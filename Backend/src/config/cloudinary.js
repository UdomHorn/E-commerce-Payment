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

// Configure Cloudinary storage engine for Multer (Products)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devclothes_ecommerce_products', // The folder inside Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Optional image optimizations on upload
    transformation: [{ width: 1000, height: 1500, crop: 'limit' }]
  },
});

// Dedicated storage engine for Banners to preserve original high quality
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devclothes_ecommerce_banners', // Separate folder inside Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // No transformation properties to retain original resolution
  },
});

const upload = multer({ storage: storage });
const uploadBanner = multer({ storage: bannerStorage });

module.exports = {
  cloudinary,
  upload,
  uploadBanner
};
