require('dotenv').config();
const sequelize = require('./config/database');
const { Notification, Product, Order } = require('./models');

async function test() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    // Find or create a product to link the low stock notification
    console.log('🔍 Looking for an existing product to link...');
    let product = await Product.findOne();
    if (!product) {
      console.log('📝 Seeding a mockup product...');
      product = await Product.create({
        name: 'Vintage Denim Jacket',
        code: 'JKT-DNM-002',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0'],
        description: 'A classic vintage denim jacket.',
        sizeStock: { S: 2, M: 10 },
        colorStock: { Denim: 12 }
      });
    }
    console.log(`✅ Using Product ID #${product.id} ("${product.name}") for low stock alert.`);

    // Find or create an order to link the payment failed notification
    console.log('🔍 Looking for an existing order to link...');
    let order = await Order.findOne();
    if (!order) {
      console.log('📝 Seeding a mockup order...');
      order = await Order.create({
        status: 'FAILED',
        totalAmount: 89.99,
        customerEmail: 'failed_customer@example.com',
        shippingAddress: '456 Failed Ave, Boston, MA 02115',
        stripePaymentIntentId: 'pi_failed_test_67890'
      });
    }
    console.log(`✅ Using Order ID #${order.id} for payment failed alert.`);

    console.log('📝 Creating test notifications (LOW_STOCK & PAYMENT_FAILED)...');
    
    // 1. Create LOW_STOCK alert
    const notifLowStock = await Notification.create({
      type: 'LOW_STOCK',
      title: 'Low Stock Warning',
      message: `Product "${product.name}" (Size: S) is low on stock: only 2 items left!`,
      metadata: { productId: product.id }
    });
    console.log(`✅ Low stock alert created: ID #${notifLowStock.id}`);

    // 2. Create PAYMENT_FAILED alert
    const notifFailedPay = await Notification.create({
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Stripe payment failed for Order #${order.id} (customer: ${order.customerEmail})`,
      metadata: { orderId: order.id }
    });
    console.log(`✅ Payment failed alert created: ID #${notifFailedPay.id}`);

    console.log('🏁 Verification script completed successfully! Open your dashboard to view the themed alerts.');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

test();
