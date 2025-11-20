const express = require("express");
const authUser = require("../middleware/userAuth");
const upload = require("../middleware/multer");
const uploadOnCloudinary = require("../utils/cloudinary");
const {signinAdmin, loginAdmin, restaurantRegister, addMenuItems, menuList, deleteMenuItem, updateMenuAvailability, getAllOrders, updateOrderStatus}=require("../controller/adminController")


const adminRouter = express.Router();

//making rote for signin a new admin
adminRouter.post("/register", signinAdmin);
// making route for admin login 
adminRouter.post("/login-admin", loginAdmin);

adminRouter.post(
  "/restaurant/register",
  upload.fields([
    { name: "logoUrl", maxCount: 1 },
    { name: "carouselImageUrl", maxCount: 1 },
    { name: "adImageUrl", maxCount: 1 }
  ]),
  restaurantRegister
);


adminRouter.post(
  "/restaurant/create-menu-item/:adminId",
  upload.fields([{ name: "menuItemImg", maxCount: 1 }]),
  addMenuItems
);
// adminRouter.post(
//   "/restaurant/create-menu-item/:adminId",authUser,
//   upload.fields([{ name: "menuItemImg", maxCount: 1 }]),
//   addMenuItems
// );

adminRouter.get("/menu-list/:id", menuList);

adminRouter.delete("/menu-item/:adminId/:menuId", authUser, deleteMenuItem);

adminRouter.patch("/menu-item/:adminId/:menuId/availability", authUser, updateMenuAvailability);

adminRouter.get("/orders/:restaurantId", getAllOrders);
// adminRouter.get("/orders/:restaurantId", authUser, getAllOrders);

adminRouter.put("/orders/update-status", updateOrderStatus);

module.exports= adminRouter;