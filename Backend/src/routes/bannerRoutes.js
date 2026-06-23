const express = require('express');
const router = express.Router();
const { Banner, CategoryBanner } = require('../models');
const { upload, cloudinary } = require('../config/cloudinary');

// @route   GET /api/banners
// @desc    Get all active banners sorted by order
// @access  Public
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { active: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Server error fetching banners.' });
  }
});

// @route   POST /api/banners
// @desc    Create a new banner with an image upload to Cloudinary
// @access  Public (Will restrict with Admin Auth in Phase 6)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, linkUrl, order, active } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const newBanner = await Banner.create({
      imageUrl: req.file.path, // Cloudinary URL
      title,
      linkUrl,
      order: order ? parseInt(order) : 0,
      active: active !== 'false'
    });

    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Server error creating banner.' });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Delete a banner by ID
// @access  Public (Will restrict with Admin Auth in Phase 6)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found.' });
    }

    // Try to delete image from Cloudinary if possible
    try {
      // Extract public_id from Cloudinary URL
      // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/image.jpg
      const urlParts = banner.imageUrl.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];
      const publicId = `${folderName}/${fileNameWithExtension.split('.')[0]}`;
      
      await cloudinary.uploader.destroy(publicId);
      console.log(`🧹 Deleted banner image from Cloudinary: ${publicId}`);
    } catch (clErr) {
      console.warn('Could not delete image from Cloudinary:', clErr.message);
    }

    // Delete record from Database
    await banner.destroy();
    res.json({ message: 'Banner deleted successfully.' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Server error deleting banner.' });
  }
});

// @route   GET /api/banners/categories
// @desc    Get category banners
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categoryBanners = await CategoryBanner.findAll();
    res.json(categoryBanners);
  } catch (error) {
    console.error('Error fetching category banners:', error);
    res.status(500).json({ error: 'Server error fetching category banners.' });
  }
});

// @route   POST /api/banners/categories
// @desc    Create or update category banner
// @access  Public (Will restrict with Admin Auth in Phase 6)
router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Check if CategoryBanner already exists
    let categoryBanner = await CategoryBanner.findOne({ where: { category } });
    if (categoryBanner) {
      // Delete old image from Cloudinary if possible
      try {
        const urlParts = categoryBanner.imageUrl.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const publicId = `${folderName}/${fileNameWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (clErr) {
        console.warn('Could not delete old image from Cloudinary:', clErr.message);
      }

      categoryBanner.imageUrl = req.file.path;
      await categoryBanner.save();
    } else {
      categoryBanner = await CategoryBanner.create({
        category,
        imageUrl: req.file.path
      });
    }

    res.json(categoryBanner);
  } catch (error) {
    console.error('Error updating category banner:', error);
    res.status(500).json({ error: 'Server error updating category banner.' });
  }
});

// @route   DELETE /api/banners/categories/:category
// @desc    Delete category banner override (revert to default)
// @access  Public
router.delete('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const categoryBanner = await CategoryBanner.findOne({ where: { category } });

    if (!categoryBanner) {
      return res.status(404).json({ error: 'Category banner override not found.' });
    }

    // Try to delete image from Cloudinary
    try {
      const urlParts = categoryBanner.imageUrl.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];
      const publicId = `${folderName}/${fileNameWithExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
      console.log(`🧹 Deleted category banner image from Cloudinary: ${publicId}`);
    } catch (clErr) {
      console.warn('Could not delete image from Cloudinary:', clErr.message);
    }

    await categoryBanner.destroy();
    res.json({ message: `Category banner for ${category} deleted successfully.` });
  } catch (error) {
    console.error('Error deleting category banner:', error);
    res.status(500).json({ error: 'Server error deleting category banner.' });
  }
});

module.exports = router;
