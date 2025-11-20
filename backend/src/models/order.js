const mongoose = require("mongoose");


const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',

    },
    cartItems: [
        {
            menuId: { type: String, required: true },
            name: { type: String, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: { type: String, required: true },

    status: {
        type: String,
        enum: ["pending", "confirmed", "preparing", "outfordelivery", "delivered"],
        required: true
    }


}, { timestamps: true });


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;