const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Product, Order, OrderItem, Notification } = require('../models');
const sequelize = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendTelegramNotification } = require('../utils/telegram');

const jwt = require('jsonwebtoken');

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

        // OPTION A — Reserve stock immediately to prevent oversell race condition
        const sizeStockCopy = { ...product.sizeStock };
        if (item.selectedColor && sizeStockCopy[item.selectedColor]) {
          const colorSizeCopy = { ...sizeStockCopy[item.selectedColor] };
          const current = parseInt(colorSizeCopy[item.selectedSize], 10);
          if (!isNaN(current)) {
            colorSizeCopy[item.selectedSize] = Math.max(0, current - item.quantity);
            sizeStockCopy[item.selectedColor] = colorSizeCopy;
          }
        } else if (sizeStockCopy[item.selectedSize] !== undefined) {
          const current = parseInt(sizeStockCopy[item.selectedSize], 10);
          if (!isNaN(current)) {
            sizeStockCopy[item.selectedSize] = Math.max(0, current - item.quantity);
          }
        }
        product.sizeStock = sizeStockCopy;
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

        // OPTION A — Reserve color stock immediately
        const colorStockCopy = { ...product.colorStock };
        const current = parseInt(colorStockCopy[item.selectedColor], 10);
        if (!isNaN(current)) {
          colorStockCopy[item.selectedColor] = Math.max(0, current - item.quantity);
          product.colorStock = colorStockCopy;
        }
      }

      // Save reserved stock to database within the same transaction
      await product.save({ transaction });
      console.log(`🔒 Reserved ${item.quantity}x "${product.name}" (Size: ${item.selectedSize}, Color: ${item.selectedColor}) — stock locked at intent creation.`);

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

    // Check if user is logged in to associate order with userId
    let userId = null;
    const token = req.cookies?.authToken || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid JWT for guest checkouts
      }
    }

    // Create a PENDING Order in PostgreSQL
    const order = await Order.create({
      userId,
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

// @route   GET /api/payment/my-orders
// @desc    Get logged-in user's orders
// @access  Private
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { userId: req.user.id },
          { customerEmail: req.user.email }
        ]
      },
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
    console.error('Error fetching my orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// @route   GET /api/payment/order/:id
// @desc    Get order details by ID for receipt
// @access  Public (Secured by optional email matching or matching userId)
router.get('/order/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Fallback: If the order status is still PENDING, query Stripe directly
    // to verify if it has succeeded, and update the database accordingly.
    if (order.status === 'PENDING' && order.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (paymentIntent.status === 'succeeded') {
          await sequelize.transaction(async (t) => {
            const freshOrder = await Order.findByPk(order.id, {
              include: [{ model: OrderItem, as: 'items' }],
              transaction: t
            });
            if (freshOrder && freshOrder.status !== 'PAID') {
              freshOrder.status = 'PAID';
              await freshOrder.save({ transaction: t });

              for (const item of freshOrder.items) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                  // Deduct Size Stock
                  if (product.sizeStock && item.selectedSize) {
                    const sizeStock = { ...product.sizeStock };
                    if (item.selectedColor && sizeStock[item.selectedColor]) {
                      const colorSizeStock = { ...sizeStock[item.selectedColor] };
                      const currentSizeStock = parseInt(colorSizeStock[item.selectedSize], 10);
                      if (!isNaN(currentSizeStock)) {
                        const newStock = Math.max(0, currentSizeStock - item.quantity);
                        colorSizeStock[item.selectedSize] = newStock;
                        sizeStock[item.selectedColor] = colorSizeStock;
                        product.sizeStock = sizeStock;

                        if (newStock <= 3) {
                          await Notification.create({
                            type: 'LOW_STOCK',
                            title: 'Low Stock Warning',
                            message: `Product "${product.name}" (Color: ${item.selectedColor}, Size: ${item.selectedSize}) is low on stock: only ${newStock} items left!`,
                            metadata: { productId: product.id }
                          }, { transaction: t });
                        }
                      }
                    } else {
                      const currentSizeStock = parseInt(sizeStock[item.selectedSize], 10);
                      if (!isNaN(currentSizeStock)) {
                        const newStock = Math.max(0, currentSizeStock - item.quantity);
                        sizeStock[item.selectedSize] = newStock;
                        product.sizeStock = sizeStock;

                        if (newStock <= 3) {
                          await Notification.create({
                            type: 'LOW_STOCK',
                            title: 'Low Stock Warning',
                            message: `Product "${product.name}" (Size: ${item.selectedSize}) is low on stock: only ${newStock} items left!`,
                            metadata: { productId: product.id }
                          }, { transaction: t });
                        }
                      }
                    }
                  }

                  // Deduct Color Stock
                  if (product.colorStock && item.selectedColor) {
                    const colorStock = { ...product.colorStock };
                    const currentColorStock = parseInt(colorStock[item.selectedColor], 10);
                    if (!isNaN(currentColorStock)) {
                      const newStock = Math.max(0, currentColorStock - item.quantity);
                      colorStock[item.selectedColor] = newStock;
                      product.colorStock = colorStock;

                      if (newStock <= 3) {
                        await Notification.create({
                          type: 'LOW_STOCK',
                          title: 'Low Stock Warning',
                          message: `Product "${product.name}" (Color: ${item.selectedColor}) is low on stock: only ${newStock} items left!`,
                          metadata: { productId: product.id }
                        }, { transaction: t });
                      }
                    }
                  }

                  await product.save({ transaction: t });
                  console.log(`📉 Fallback: Deducted ${item.quantity}x from "${product.name}" for size "${item.selectedSize}" & color "${item.selectedColor}".`);
                }
              }
              // Update status on the local in-memory order object
              order.status = 'PAID';

              // Create notification for admin
              await Notification.create({
                type: 'NEW_ORDER',
                title: 'New Order Received',
                message: `Order #${order.id} paid by ${order.customerEmail} for $${order.totalAmount.toFixed(2)}`,
                metadata: { orderId: order.id }
              }, { transaction: t });

              console.log(`✅ Fallback: Order #${order.id} status synced to PAID successfully.`);
              // Send Telegram notification
              sendTelegramNotification(order.id);
            }
          });
        }
      } catch (syncError) {
        console.error('⚠️ Failed to sync pending order status with Stripe:', syncError);
      }
    }

    // Security check:
    // If order has userId and is requested by a logged-in user, ensure it matches.
    // If it's a guest order, allow retrieval matching customerEmail parameter.
    let isAuthorized = false;

    // Check if token exists
    const token = req.cookies?.authToken || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (order.userId === decoded.id) {
          isAuthorized = true;
        }
      } catch (err) {
        // Ignore token verify error
      }
    }

    // Check if email query parameter matches
    const emailQuery = req.query.email;
    if (emailQuery && order.customerEmail.toLowerCase() === emailQuery.toLowerCase()) {
      isAuthorized = true;
    }

    // Reject access if neither the user ID matches nor the email query matches the order email
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access Denied. You are not authorized to view this order receipt.' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order receipt:', error);
    res.status(500).json({ error: 'Failed to retrieve order receipt.' });
  }
});

// @route   PUT /api/payment/orders/:id/fulfillment
// @desc    Update order fulfillment status (Admin only)
// @access  Private/Admin
router.put('/orders/:id/fulfillment', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { fulfillmentStatus } = req.body;
    if (!['Unfulfilled', 'Shipped', 'Delivered'].includes(fulfillmentStatus)) {
      return res.status(400).json({ error: 'Invalid fulfillment status value.' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.fulfillmentStatus = fulfillmentStatus;
    await order.save();

    res.json({ message: 'Order fulfillment status updated successfully.', order });
  } catch (error) {
    console.error('Error updating order fulfillment status:', error);
    res.status(500).json({ error: 'Failed to update order fulfillment status.' });
  }
});

module.exports = router;

