const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ten11_ecommerce_products', // The folder inside Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Optional image optimizations on upload
    transformation: [{ width: 1000, height: 1500, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
};
