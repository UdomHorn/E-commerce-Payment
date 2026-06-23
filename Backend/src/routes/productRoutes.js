const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { upload } = require('../config/cloudinary');

// Helper to parse arrays from requests safely
const parseArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    // If it's a comma-separated list
    return input.split(',').map(item => item.trim());
  }
};

// @route   POST /api/products
// @desc    Create a new product with image uploads to Cloudinary
// @access  Public (Will restrict with Admin Auth in Phase 5)
router.post(
  '/',
  upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'detailImages', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const { name, price, description, modelInfo, category, code, colors, sizes, sizeStock, colorStock } = req.body;

      // Check if product code already exists
      const existingProduct = await Product.findOne({ where: { code } });
      if (existingProduct) {
        return res.status(400).json({ error: `Product with code '${code}' already exists.` });
      }

      // Extract Cloudinary URLs from fields
      const cardImageFiles = req.files && req.files['cardImage'] ? req.files['cardImage'] : [];
      const detailImageFiles = req.files && req.files['detailImages'] ? req.files['detailImages'] : [];

      const cardImageUrl = cardImageFiles.length > 0 ? cardImageFiles[0].path : null;
      const detailImageUrls = detailImageFiles.map(file => file.path);

      const imageUrls = [];
      if (cardImageUrl) {
        imageUrls.push(cardImageUrl);
      }
      imageUrls.push(...detailImageUrls);

      // Parse JSON stocks
      let parsedSizeStock = {};
      if (sizeStock) {
        try {
          parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
        } catch (err) {
          console.error('Failed to parse sizeStock:', err);
        }
      }

      let parsedColorStock = {};
      if (colorStock) {
        try {
          parsedColorStock = typeof colorStock === 'string' ? JSON.parse(colorStock) : colorStock;
        } catch (err) {
          console.error('Failed to parse colorStock:', err);
        }
      }

      const newProduct = await Product.create({
        code,
        name,
        price: parseFloat(price),
        description,
        modelInfo,
        category,
        images: imageUrls,
        colors: parseArray(colors),
        sizes: parseArray(sizes),
        sizeStock: parsedSizeStock,
        colorStock: parsedColorStock
      });

      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Server error creating product.' });
    }
  }
);


// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID or SKU code
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding by primary key (ID) or unique code (SKU)
    let product = null;
    const numId = Number(id);

    // PostgreSQL standard integer max value is 2,147,483,647.
    // Long SKU codes exceed this limit and cause query overflow errors if parsed as primary keys.
    if (!isNaN(numId) && numId > 0 && numId <= 2147483647) {
      product = await Product.findByPk(numId);
    }
    
    if (!product) {
      product = await Product.findOne({ where: { code: String(id) } });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
});

module.exports = router;
