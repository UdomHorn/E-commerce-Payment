const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Product, Order, OrderItem } = require('../models');
const sequelize = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   POST /api/payment/create-payment-intent
// @desc    Create Stripe Payment Intent and save PENDING order in PostgreSQL
// @access  Public
router.post('/create-payment-intent', async (req, res) => {
  // Start database transaction
  const transaction = await sequelize.transaction();

  try {
    const { items, shippingAddress, customerEmail } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in the checkout cart.' });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required.' });
    }

    let totalAmount = 0;
    const validatedItems = [];

    // Verify product prices from database to prevent tampering
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ error: `Product with ID ${item.productId} not found.` });
      }

      const itemPrice = product.price;
      
      // Validate size stock if it is set in database
      if (product.sizeStock && item.selectedSize) {
        let availableSizeStock;
        if (item.selectedColor && product.sizeStock[item.selectedColor]) {
          availableSizeStock = product.sizeStock[item.selectedColor][item.selectedSize];
        } else {
          availableSizeStock = product.sizeStock[item.selectedSize];
        }

        if (availableSizeStock !== undefined && parseInt(availableSizeStock, 10) < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: `Insufficient stock for "${product.name}" (Size: ${item.selectedSize}). Available: ${availableSizeStock}` 
          });
        }
      }

      // Validate color stock if it is set in database
      if (product.colorStock && item.selectedColor) {
        const availableColorStock = product.colorStock[item.selectedColor];
        if (availableColorStock !== undefined && parseInt(availableColorStock, 10) < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: `Insufficient stock for "${product.name}" (Color: ${item.selectedColor}). Available: ${availableColorStock}` 
          });
        }
      }

      totalAmount += itemPrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        selectedSize: item.selectedSize || 'Standard',
        selectedColor: item.selectedColor || 'Default',
        price: itemPrice
      });
    }

    // Create a Stripe Payment Intent (amount in cents)
    const amountInCents = Math.round(totalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata: {
        customerEmail,
        shippingAddress
      }
    });

    // Create a PENDING Order in PostgreSQL
    const order = await Order.create({
      stripePaymentIntentId: paymentIntent.id,
      status: 'PENDING',
      totalAmount,
      shippingAddress,
      customerEmail
    }, { transaction });

    // Create the OrderItems
    for (const item of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        price: item.price
      }, { transaction });
    }

    // Commit transaction if everything succeeded
    await transaction.commit();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      totalAmount
    });

  } catch (error) {
    // Rollback changes on database error
    await transaction.rollback();
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to initialize payment process.' });
  }
});

// @route   GET /api/payment/orders
// @desc    Get all orders with items (Admin only)
// @access  Private/Admin
router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'code', 'images']
            }
          ]
        }
      ]
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// @route   GET /api/payment/dashboard-stats
// @desc    Get store sales metrics, order counts, and low stock products (Admin only)
// @access  Private/Admin
router.get('/dashboard-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const paidCount = await Order.count({ where: { status: 'PAID' } });
    const pendingCount = await Order.count({ where: { status: 'PENDING' } });
    const failedCount = await Order.count({ where: { status: 'FAILED' } });

    // Revenue calculation
    const paidOrders = await Order.findAll({
      where: { status: 'PAID' }
    });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Low stock products logic
    const allProducts = await Product.findAll();
    const lowStockProducts = [];
    for (const product of allProducts) {
      let totalStock = 0;
      if (product.colorStock) {
        totalStock = Object.values(product.colorStock).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
      }
      if (totalStock === 0 && product.sizeStock) {
        const sumValues = (obj) => {
          if (!obj || typeof obj !== 'object') return 0;
          return Object.values(obj).reduce((sum, val) => {
            if (typeof val === 'object') {
              return sum + sumValues(val);
            }
            return sum + (parseInt(val, 10) || 0);
          }, 0);
        };
        totalStock = sumValues(product.sizeStock);
      }
      
      if (totalStock <= 10) {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          code: product.code,
          category: product.category,
          totalStock
        });
      }
    }

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        paidCount,
        pendingCount,
        failedCount
      },
      lowStockProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
  }
});

module.exports = router;
