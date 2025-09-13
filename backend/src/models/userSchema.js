const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number
    },
    address: {
        type: String
    },
    city:{
        type:String
    },
    country:{
        type:String
    },
    myBasket: [{
        item:{ type: mongoose.Schema.Types.ObjectId, ref: "Menu"},
        quantity:{type:Number,default:1},
       },
    ],
    orderHistory: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    ],
 },
 
 {
    timestamps: true // adds createdAt and updatedAt automatically
});


let User = mongoose.model("User", userSchema)

module.exports = User;