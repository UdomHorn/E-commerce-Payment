const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Product, Order, OrderItem } = require('../models');
const sequelize = require('../config/database');

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

module.exports = router;
