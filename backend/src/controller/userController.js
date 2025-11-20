const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const Restaurant = require("../models/restaurantSchema")
const Order = require("../models/order")
const Menu = require("../models/menuSchema")
require("dotenv").config();


//creating a new user using POST method /user/api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  }

  try {
    //checking for user already exist or not
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res
        .status(400)
        .json({ message: "Email already registered", success: false });
    }

    //hashing password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 7);

    const create = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    //returning json web token in respose
    const token = jwt.sign(create.email, process.env.SECRET);
    return res.status(200).json({
      success: true,
      _id: create._id,
      name,
      token,
      message: "New user created successfully",
    });

  }
  catch (error) {
    console.log("user creating internal server error", error);
    return res.status(500).json({
      message: "user creating internal server error",
      success: false,
    });
  }

};


//login a new user using POST method /user/api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    // checking for user exist or not
    try {
      const userExist = await User.findOne({ email });

      if (!userExist) {
        return res
          .status(400)
          .json({ message: "User does not exist", success: false });

      }
      // comparing the user input password and data base password
      const isCorrectPassword = await bcrypt.compare(
        password,
        userExist.password
      );
      if (isCorrectPassword) {
        // returning a json web token to logined user
        const authToken = jwt.sign(userExist.id, process.env.SECRET);
        return res.status(200).json({
          message: "User login successfully",
          authToken,
          _id: userExist._id,
          name: userExist.name,
          success: true,
        });
      } else {
        console.log("Please enter with right credentials");
        return res.status(400).json({
          message: "Please enter with right credentials",
          success: false,
        });
      }
    } catch (error) {
      console.log("login user server error", error);
      return res
        .status(400)
        .json({ success: false, message: "Internal server error try again" });
    }
  }
};


//get user data  /user/api/user-info
const getUserData = async (req, res) => {
  const id = req.body.id;

  try {
    const user = await User.findById(id)
      .populate("myBasket.item")
      .exec();

    if (user) {
      return res.status(200).json({
        success: true,
        userData: user,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.log("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// get all food item details /user/api/restaurants
const getRestaurants = async (req, res) => {
  try {
    const restuData = await Restaurant.find()
      .populate("menus")
      .exec();
    if (restuData) {
      return res
        .status(200)
        .json({ success: true, data: restuData });
    }
  } catch (error) {
    console.log(" server error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error try again" });

  }
}

// get all food item details /user/api/menus
const getMenuItems = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // Use $or to search across multiple fields
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { catagory: { $regex: search, $options: "i" } },
        ],
      };
    }

    // First fetch menus + populate restaurant
    let menuItems = await Menu.find(query).populate("restaurant");

    return res.status(200).json({
      success: true,
      data: menuItems,
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error, try again",
    });
  }
};



// Home page content /user/api/home
const homePageContent = async (req, res) => {
  try {
    const data = await Restaurant.find()
      .select("_id restaurantName city country carouselImageUrl adImageUrl");

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error, try again later" });
  }
};


//Search menu by restaurant /user/api/menus/search/:restaurantName

const searchMenuByRestaurant = async (req, res) => {
  const restaurantName = req.params.restaurantName;


  try {
    // Partial and case-insensitive search for restaurant
    const restaurant = await Restaurant.findOne({
      restaurantName: { $regex: restaurantName, $options: "i" },
    }).populate("menus"); // populate full menu items

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const groupedMenu = {};

    // Group by category
    restaurant.menus.forEach((item) => {
      const cat = item.catagory || "uncategorized";
      if (!groupedMenu[cat]) groupedMenu[cat] = [];
      groupedMenu[cat].push(item);
    });

    return res.status(200).json({
      id: restaurant._id,
      restaurantName: restaurant.restaurantName,
      city: restaurant.city,
      country: restaurant.country,
      groupedMenu,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add Item to  basket  /user/api/basket/items
const addItems = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if item already exists in basket
    const existingItem = user.myBasket.find((basketItem) =>
      basketItem.item.toString() === itemId
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += 1;
    } else {
      // Add new item to basket
      user.myBasket.push({
        item: new mongoose.Types.ObjectId(itemId),
      });
    }

    const updatedUser = await (user.save()).populate;

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: existingItem ? "Item quantity updated" : "Item added to basket",
    });

  } catch (error) {
    console.log("Add Item Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Decrease item Quntity /user/api/basket/remove-item
const decreaseItemQuantity = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const basketItem = user.myBasket.find(
      (item) => item.item.toString() === itemId
    );

    if (!basketItem) {
      return res.status(400).json({
        success: false,
        message: "Item not found in basket",
      });
    }

    // Decrease quantity
    basketItem.quantity -= 1;

    if (basketItem.quantity <= 0) {
      // Remove item completely if quantity is 0
      user.myBasket = user.myBasket.filter(
        (item) => item.item.toString() !== itemId
      );
    }

    const updatedUser = await (user.save()).populate;

    res.status(200).json({
      success: true,
      data: updatedUser,
      message:
        basketItem.quantity <= 0
          ? "Item removed from basket"
          : "Item quantity decreased by 1",
    });

  } catch (error) {
    console.error("Decrease Quantity Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// placeOrder new order
const placeOrder = async (req, res) => {
  try {

    const { userId, name, email, address, city, state, pincode, paymentMethod, cartItems, restaurant } = req.body;

    if (!userId || !name || !email || !address || !city || !state || !pincode || !paymentMethod || !cartItems) {
      return res.status(400).json({ success: false, message: "all fields are requied" });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart cannot be empty" });
    }

    // Validate and re-fetch price from DB to avoid tampering
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      const menuItem = await Menu.findById(item.menuId);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Invalid menu item` });
      }

      const price = menuItem.price;
      const quantity = item.quantity > 0 ? item.quantity : 1;
      const offer = menuItem.offer / 100;
      const subtotal = (price * quantity) - offer;

      totalAmount += subtotal;

      validatedItems.push({
        menuId: menuItem._id,
        name: menuItem.name,
        image: menuItem.menuItemImg,
        price,
        quantity
      });
    }

    //  Create order object (prevent overriding status from client)
    const orderData = {
      userId,
      name,
      email,
      address,
      city,
      state,
      pincode,
      paymentMethod,
      cartItems: validatedItems,
      totalAmount,
      restaurant,
      status: "confirmed"
    };

    const newOrder = await Order.create(orderData);

    const user = await User.findById(userId);
    if (user) {
      user.myBasket = []; 

      user.orderHistory.push(newOrder._id);

      await user.save(); 
    }
    return res.status(201).json({
      success: true,
      message: "Order placement completed",
      data: newOrder
    });

  } catch (error) {
    console.error("Order placement error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserData,
  getRestaurants,
  getMenuItems,
  homePageContent,
  searchMenuByRestaurant,
  addItems,
  decreaseItemQuantity,
  placeOrder,
}