const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    console.log("File is successfully uploaded on Cloudinary:", response.url);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

module.exports = uploadOnCloudinary;
