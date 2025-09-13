const mongoose = require("mongoose");
require("dotenv").config();

// const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-app';
const DB_URI = process.env.MONGODB_URI ;

const connectDb = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDb;
