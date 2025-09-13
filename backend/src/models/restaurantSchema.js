const  mongoose = require("mongoose");

const restaurantSchema=mongoose.Schema({
     adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    },
    restaurantName:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    deliveryTime:{
        type:Number,
    },
    menus:[{type:mongoose.Schema.Types.ObjectId, ref:'Menu'}
    ],
    logoUrl:{
        type:String,
        required:true
    },
    carouselImageUrl:{
        type:String,
        required:true
    },
    adImageUrl:{
        type:String,
        required:true
    }
},{timestamps:true});


let Restaurant = mongoose.model("Restaurant", restaurantSchema)

module.exports = Restaurant;