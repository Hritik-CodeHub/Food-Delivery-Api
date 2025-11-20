const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminSchema")
const Restaurant = require("../models/restaurantSchema")
const Menu = require("../models/menuSchema")
const Order = require("../models/order")
const uploadOnCloudinary = require("../utils/cloudinary")
const fs = require("fs");

require("dotenv").config();


//creating a new user using POST method /user/api/admin/signin-user
const signinAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    //checking for user already exist or not
    const userExist = await Admin.findOne({ email });
    if (!userExist) {
      //hashing password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 7);
      try {
        const create = await Admin.create({
          name,
          email,
          password: hashedPassword,
        });
        //returning json web token in respose
        const token = jwt.sign(create.email, process.env.SECRET);
        return res.status(200).json({
          message: "New Admin created successfully",
          token,
          name,
          id:create._id,
          success: true,
        });
      } catch (error) {
        console.log("Admin creating internal server error", error);
        return res.status(400).json({
          message: "Admin creating internal server error",
          success: false,
        });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Email already registered", success: false });
    }
  }
};

//login a Admin using POST method /user/api/admin/login-admin
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    // checking for Admin exist or not
    const userExist = await Admin.findOne({ email });
    if (userExist) {
      // comparing the user input password and data base password
      const isCorrectPassword = await bcrypt.compare(
        password,
        userExist.password
      );
      if (isCorrectPassword) {
        // returning a json web token to logined admin
        const authToken = jwt.sign(userExist.id, process.env.SECRET);
        const restaurant = await Restaurant.findOne({ adminId: userExist._id});
        
        const restaurantExists=restaurant?true:false;

        return res.status(200).json({
          message: "Admin login successfully",
          success: true,
          _id:userExist._id, 
          name:userExist.name,
          restaurantExists,
          restaurantId:restaurant._id,
          authToken,
        });
      } else {
        console.log("Please enter with right credentials");
        return res.status(400).json({
          message: "Please enter with right credentials",
          success: false,
        });
      }
    } else {
      return res
        .status(404)
        .json({ message: "User does not exist", success: false });
    }
  }
};


// add Restaurant details  /user/api/admin/register-restu
const restaurantRegister = async (req, res) => {
  console.log(req.files)


  const { adminId, restaurantName, city, country } = req.body;
  if (!adminId || !restaurantName || !city || !country) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  }

  else {
    try {
      const userExist = await Restaurant.findOne({ adminId });
      if (!userExist) {
        // Access files from multer
        const logoFile = req.files?.logoUrl?.[0];
        const carouselFile = req.files?.carouselImageUrl?.[0];
        const adFile = req.files?.adImageUrl?.[0];

        // Upload to Cloudinary and get URLs
        const logoRes = logoFile ? await uploadOnCloudinary(logoFile.path) : null;
        const carouselRes = carouselFile ? await uploadOnCloudinary(carouselFile.path) : null;
        const adRes = adFile ? await uploadOnCloudinary(adFile.path) : null;

        // Delete local temp files
        if (logoFile) fs.unlinkSync(logoFile.path);
        if (carouselFile) fs.unlinkSync(carouselFile.path);
        if (adFile) fs.unlinkSync(adFile.path);

        // Save data to MongoDB
        const newRestaurant = await Restaurant.create({
          adminId: new mongoose.Types.ObjectId(adminId),
          restaurantName,
          city,
          country,
          logoUrl: logoRes?.secure_url,
          carouselImageUrl: carouselRes?.secure_url,
          adImageUrl: adRes?.secure_url,
        });

        res.status(201).json({
          message: "Restaurant registered successfully",
          data: {...newRestaurant, success:true}
        });
      } else {
        return res
          .status(400)
          .json({ message: "Restaurant already registered", success: false });
      }
    }
    catch (error) {
      console.error("Error registering Restaurant:", error);
      res.status(500).json({ error: "Failed to register Restaurant" });
    }
  }
}

//add menu Items  /user/api/admin/create-menu-item
const addMenuItems = async (req, res) => {

  try {
    const { adminId } = req.params;
    const menu = req.body;
    console.log(menu)
    // validation
    if (!adminId || !menu) {
      return res.status(400).json({
        message: "Request failed, all fields are mandatory",
      });
    }

    const restaurantExists = await Restaurant.findOne({ adminId: adminId });
    if (!restaurantExists) {
      return res.status(404).json({ message: "Restaurant not found for this adminId" });
    }


    // Access files from multer
    const menuItemImgFile = req.files?.menuItemImg?.[0];

    // Upload to Cloudinary and get URLs
    const menuItemImgRes = menuItemImgFile ? await uploadOnCloudinary(menuItemImgFile.path) : null;

    // Delete local image file
    if (menuItemImgFile) fs.unlinkSync(menuItemImgFile.path);

    const menuData = await Menu.create({
      ...menu,
      menuItemImg: menuItemImgRes?.secure_url,
    });
    if (menuData) {
      let updatedRestaurant = await Restaurant.findOneAndUpdate(
        { adminId: new mongoose.Types.ObjectId(adminId) },
        {
          $push: {
            menus:  new mongoose.Types.ObjectId(menuData._id),
          }
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: menuData,
        message: "New menu added successfully"
      });
    } else {
      return res.status(400).json({
        message: " creating new menu item is failed",
      });
    }
  } catch (error) {
    console.log(" Error adding menu item", error);
    return res.status(500).json({
      message: "Server error while creating  menu item",
    });
  } finally{
    if (menuItemImgFile) fs.unlinkSync(menuItemImgFile.path);
  }
}

// Get all menu list for admin dashboard
const menuList = async (req, res) => {
  const { id } = req.params;
  try {
    const menuList = await Restaurant.findById(id)
     .populate("menus")
     .exec();
    if (menuList) {
      let data={
        adminId:menuList.adminId,
        restaurantName:menuList.restaurantName,
        menus:menuList.menus,
        timestamps:menuList.timestamps,
      }
      res.status(200).json({
        success: true,
        data: data,
      });
    } else { 
      res.status(404).json({
        success: false,
        message: "Restaurant not found or menu list not available",
      });
    }
  } catch (error) {
    console.error("Error fetching menu list:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete menue item
const deleteMenuItem = async (req, res) => {
  try {
    const { adminId, menuId } = req.params;

    if (!adminId || !menuId) {
      return res.status(400).json({
        success: false,
        message: "adminId and menuId are required",
      });
    }

    // Verify restaurant exists for this admin
    const restaurant = await Restaurant.findOne({ adminId: new mongoose.Types.ObjectId(adminId) });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found for this adminId" });
    }

    // Remove menu reference from restaurant.menus
    await Restaurant.updateOne(
      { _id: restaurant._id },
      { $pull: { menus: new mongoose.Types.ObjectId(menuId) } }
    );

    // Delete the menu document
    const deleted = await Menu.findByIdAndDelete(menuId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.status(200).json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item", error);
    return res.status(500).json({ success: false, message: "Server error while deleting menu item" });
  }
}

// update availability of a menu item
const updateMenuAvailability = async (req, res) => {
  try {
    const { adminId, menuId } = req.params;
    let { available } = req.body;

    if (!adminId || !menuId) {
      return res.status(400).json({
        success: false,
        message: "adminId and menuId are required",
      });
    }

    if (available === undefined || available === null) {
      return res.status(400).json({ success: false, message: "available is required" });
    }

    // Normalize to string since schema expects String
    if (typeof available === "boolean") {
      available = available ? "true" : "false";
    } else if (typeof available === "string") {
      const lower = available.toLowerCase();
      if (lower !== "true" && lower !== "false") {
        return res.status(400).json({ success: false, message: "available must be 'true' or 'false'" });
      }
      available = lower;
    } else {
      return res.status(400).json({ success: false, message: "available must be boolean or string" });
    }

    // Verify restaurant exists for this admin
    const restaurant = await Restaurant.findOne({ adminId: new mongoose.Types.ObjectId(adminId) });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found for this adminId" });
    }

    // Ensure the menu belongs to this restaurant
    const isMenuInRestaurant = restaurant.menus.some((m) => String(m) === String(menuId));
    if (!isMenuInRestaurant) {
      return res.status(403).json({ success: false, message: "Menu item does not belong to this restaurant" });
    }

    const updated = await Menu.findByIdAndUpdate(
      menuId,
      { available },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    return res.status(200).json({ success: true, message: "Availability updated", data: updated });
  } catch (error) {
    console.error("Error updating menu availability", error);
    return res.status(500).json({ success: false, message: "Server error while updating availability" });
  }
}

const getAllOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required"
      });
    }

    // Fetch orders for the restaurant (latest first)
    const orders = await Order.find({ restaurant: restaurantId }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        data: []
      });
    }
    
    console.log(orders)

    // Format response data
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      customer: order.name,
      items: order.cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalItems: order.cartItems.length,
      method: order.paymentMethod,
      amount: order.totalAmount,
      status: order.status,
      eta:
        order.status === "delivered"
          ? "Delivered"
          : order.status === "outfordelivery"
          ? "30-45 mins"
          : order.status === "preparing"
          ? "20-30 mins"
          : order.status === "confirmed"
          ? "15-25 mins"
          : "Pending",
      placedAt: order.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: formattedOrders,
      totalOrders: formattedOrders.length
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders"
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "orderId and status are required"
      });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true } // returns updated doc
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating order status"
    });
  }
};


module.exports = { signinAdmin, loginAdmin, restaurantRegister, addMenuItems, menuList, deleteMenuItem, updateMenuAvailability, getAllOrders, updateOrderStatus };