const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, OrderItem, Product } = require('./models');
const ensureDatabaseExists = require('./config/initDb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// 1. Stripe Webhook - MUST run before express.json() to get raw buffer
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Stripe Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`💰 PaymentIntent for ${paymentIntent.amount} succeeded.`);

    try {
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (order) {
        if (order.status !== 'PAID') {
          // Perform inventory deduction and order status update inside transaction
          await sequelize.transaction(async (t) => {
            order.status = 'PAID';
            await order.save({ transaction: t });

            for (const item of order.items) {
              const product = await Product.findByPk(item.productId, { transaction: t });
              if (product) {
                // Deduct Size Stock
                if (product.sizeStock && item.selectedSize) {
                  const sizeStock = { ...product.sizeStock };
                  if (item.selectedColor && sizeStock[item.selectedColor]) {
                    const colorSizeStock = { ...sizeStock[item.selectedColor] };
                    const currentSizeStock = parseInt(colorSizeStock[item.selectedSize], 10);
                    if (!isNaN(currentSizeStock)) {
                      colorSizeStock[item.selectedSize] = Math.max(0, currentSizeStock - item.quantity);
                      sizeStock[item.selectedColor] = colorSizeStock;
                      product.sizeStock = sizeStock;
                    }
                  } else {
                    const currentSizeStock = parseInt(sizeStock[item.selectedSize], 10);
                    if (!isNaN(currentSizeStock)) {
                      sizeStock[item.selectedSize] = Math.max(0, currentSizeStock - item.quantity);
                      product.sizeStock = sizeStock;
                    }
                  }
                }

                // Deduct Color Stock
                if (product.colorStock && item.selectedColor) {
                  const colorStock = { ...product.colorStock };
                  const currentColorStock = parseInt(colorStock[item.selectedColor], 10);
                  if (!isNaN(currentColorStock)) {
                    colorStock[item.selectedColor] = Math.max(0, currentColorStock - item.quantity);
                    product.colorStock = colorStock;
                  }
                }

                await product.save({ transaction: t });
                console.log(`📉 Deducted ${item.quantity}x from "${product.name}" for size "${item.selectedSize}" & color "${item.selectedColor}".`);
              }
            }
          });
          console.log(`✅ Order #${order.id} status updated to PAID and stock levels deducted successfully.`);
        }
      } else {
        console.warn(`⚠️ Order for payment intent ${paymentIntent.id} not found.`);
      }
    } catch (error) {
      console.error('❌ Error processing payment success webhook:', error);
      return res.status(500).json({ error: 'DB update error.' });
    }
  }

  res.json({ received: true });
});

// 2. Standard Body Parsers (for all other endpoints)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const productRoutes = require('./routes/productRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running.' });
});

// Register routes
app.use('/api/products', productRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/banners', bannerRoutes);

// Test database connection and start server
async function startServer() {
  try {
    // 1. Ensure the PostgreSQL database exists
    await ensureDatabaseExists();

    // 2. Connect and authenticate
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');

    // Sync database models (alter table if schema changes)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized with schema changes.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database or start server:', error);
  }
}

startServer();
