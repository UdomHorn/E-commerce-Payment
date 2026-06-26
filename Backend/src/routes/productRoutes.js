const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Product = require('../models/Product');
const { upload } = require('../config/cloudinary');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

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
// @access  Private/Admin
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
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
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// @route   POST /api/products/sync-stock
// @desc    Get stock levels for multiple product IDs
// @access  Public
router.post('/sync-stock', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid product IDs list.' });
    }

    const products = await Product.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      attributes: ['id', 'name', 'sizeStock', 'colorStock']
    });

    res.json(products);
  } catch (error) {
    console.error('Error syncing stocks:', error);
    res.status(500).json({ error: 'Server error syncing stocks.' });
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

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'detailImages', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const { name, price, description, modelInfo, category, code, colors, sizes, sizeStock, colorStock } = req.body;

      // Check if SKU is changed and already exists on another product
      if (code && code !== product.code) {
        const existingProduct = await Product.findOne({ where: { code } });
        if (existingProduct) {
          return res.status(400).json({ error: `Product with SKU '${code}' already exists.` });
        }
      }

      // Image handling
      let imageUrls = product.images; // Default to existing images

      const cardImageFiles = req.files && req.files['cardImage'] ? req.files['cardImage'] : [];
      const detailImageFiles = req.files && req.files['detailImages'] ? req.files['detailImages'] : [];

      if (cardImageFiles.length > 0 || detailImageFiles.length > 0) {
        const cardImageUrl = cardImageFiles.length > 0 ? cardImageFiles[0].path : null;
        const detailImageUrls = detailImageFiles.map(file => file.path);

        const newImageUrls = [];
        if (cardImageUrl) {
          newImageUrls.push(cardImageUrl);
        } else if (product.images.length > 0) {
          newImageUrls.push(product.images[0]); // Keep old cardImage
        }

        if (detailImageUrls.length > 0) {
          newImageUrls.push(...detailImageUrls);
        } else if (product.images.length > 1) {
          newImageUrls.push(...product.images.slice(1)); // Keep old details
        }
        imageUrls = newImageUrls;
      }

      // Parse JSON stocks
      let parsedSizeStock = product.sizeStock;
      if (sizeStock) {
        try {
          parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
        } catch (err) {
          console.error('Failed to parse sizeStock:', err);
        }
      }

      let parsedColorStock = product.colorStock;
      if (colorStock) {
        try {
          parsedColorStock = typeof colorStock === 'string' ? JSON.parse(colorStock) : colorStock;
        } catch (err) {
          console.error('Failed to parse colorStock:', err);
        }
      }

      await product.update({
        code: code || product.code,
        name: name || product.name,
        price: price ? parseFloat(price) : product.price,
        description: description !== undefined ? description : product.description,
        modelInfo: modelInfo !== undefined ? modelInfo : product.modelInfo,
        category: category || product.category,
        images: imageUrls,
        colors: colors ? parseArray(colors) : product.colors,
        sizes: sizes ? parseArray(sizes) : product.sizes,
        sizeStock: parsedSizeStock,
        colorStock: parsedColorStock
      });

      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Server error updating product.' });
    }
  }
);

// @route   PUT /api/products/:id/stock
// @desc    Quickly update stock for a product variant (Admin only)
// @access  Private/Admin
router.put(
  '/:id/stock',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { color, size, count } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const updatedSizeStock = product.sizeStock ? { ...product.sizeStock } : {};
      const updatedColorStock = product.colorStock ? { ...product.colorStock } : {};
      const parsedCount = Math.max(0, parseInt(count, 10) || 0);

      if (color && updatedSizeStock[color]) {
        // Nested: sizeStock[color][size]
        const colorSizes = { ...updatedSizeStock[color] };
        colorSizes[size] = parsedCount;
        updatedSizeStock[color] = colorSizes;

        // Recalculate colorStock for this color
        updatedColorStock[color] = Object.values(colorSizes).reduce(
          (sum, v) => sum + (parseInt(v, 10) || 0),
          0
        );
      } else if (size && updatedSizeStock[size] !== undefined) {
        // Flat sizeStock
        updatedSizeStock[size] = parsedCount;
      } else if (color) {
        // colorStock only fallback
        updatedColorStock[color] = parsedCount;
      }

      await product.update({
        sizeStock: updatedSizeStock,
        colorStock: updatedColorStock
      });

      res.json({ message: 'Stock updated successfully.', product });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Server error updating stock.' });
    }
  }
);

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;
