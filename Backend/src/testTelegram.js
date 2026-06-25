require('dotenv').config();
const sequelize = require('./config/database');
const { Order, OrderItem, Product } = require('./models');
const { sendTelegramNotification } = require('./utils/telegram');

async function test() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    // Find the latest order, or create a mockup order if none exists
    let order = await Order.findOne({
      order: [['id', 'DESC']],
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      console.log('📝 No order found in database. Creating a mockup product and order...');
      // Find or create a product
      let product = await Product.findOne();
      if (!product) {
        product = await Product.create({
          name: 'Classic Black Tee',
          code: 'TEE-BLK-001',
          price: 29.99,
          images: [],
          description: 'A premium classic black t-shirt.',
          sizeStock: { M: 10, L: 5 },
          colorStock: { Black: 15 }
        });
      }

      order = await Order.create({
        status: 'PAID',
        totalAmount: 59.98,
        customerEmail: 'test_customer@example.com',
        shippingAddress: '123 Test St, San Francisco, CA 94103',
        stripePaymentIntentId: 'pi_mockup_test_12345'
      });

      await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity: 2,
        selectedSize: 'M',
        selectedColor: 'Black',
        price: 29.99
      });

      console.log(`✅ Mockup order #${order.id} created.`);
    } else {
      console.log(`✅ Using latest order #${order.id} found in database.`);
    }

    console.log(`🔄 Triggering Telegram notification for Order #${order.id}...`);
    await sendTelegramNotification(order.id);
    console.log('🏁 Test finished.');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

test();
