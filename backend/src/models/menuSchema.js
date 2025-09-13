const mongoose = require("mongoose");

const menuSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category:{
     type:String,
     required:true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    menuItemImg: {
        type: String,
        required: true
    },
    available:{
        type: Boolean,
        required: true
    },
    offer:{type:Number
    },
    rating:{type:Number
    },
    restaurant:{type:mongoose.Schema.Types.ObjectId, ref:'Restaurant'}
    },
    {
        timestamps: true
    }
);

let Menu=mongoose.model("Menu",menuSchema);

module.exports=Menu;