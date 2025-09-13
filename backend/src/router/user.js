const express = require("express");
const authUser = require("../middleware/userAuth");
const { 
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

} = require('../controller/userController');



const userRouter = express.Router();

// signin a new user
userRouter.post("/auth/register", registerUser);

// login user
userRouter.post("/auth/login", loginUser);

// Get restaurants 
userRouter.get("/restaurants", getRestaurants)

// get user data
userRouter.post("/user-info", getUserData)

// Get home content
userRouter.get("/home", homePageContent)

// Get menus
userRouter.get("/menus", getMenuItems)

//Search menu by restaurant
userRouter.get("/menus/search/:restaurantName", searchMenuByRestaurant)

//Add food items to basket
userRouter.post("/basket/items",addItems)

userRouter.post("/basket/remove-items",decreaseItemQuantity)

userRouter.post("/place-order",placeOrder)

module.exports = userRouter;