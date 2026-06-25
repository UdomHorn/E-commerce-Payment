const { Order, OrderItem, Product } = require('../models');

/**
 * Sends a formatted HTML telegram notification for a paid order.
 * @param {number|string} orderId - The primary key of the order
 */
const sendTelegramNotification = async (orderId) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️ Telegram configuration (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID) is missing. Notification skipped.');
    return;
  }

  try {
    // Fetch full order details including items and product names
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'code']
            }
          ]
        }
      ]
    });

    if (!order) {
      console.error(`❌ Order #${orderId} not found in database. Cannot send Telegram alert.`);
      return;
    }

    // Format items details
    let itemsText = '';
    if (order.items && order.items.length > 0) {
      itemsText = order.items.map(item => {
        const prodName = item.product?.name || 'Deleted Product';
        const color = item.selectedColor || 'Default';
        const size = item.selectedSize || 'Standard';
        return `• <b>${prodName}</b> (${color} / ${size}) x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
      }).join('\n');
    } else {
      itemsText = 'No items found.';
    }

    // Format checkout notification message
    const message = `
🛍️ <b>New Order Received!</b>
───────────────────
<b>Order ID:</b> #${order.id}
<b>Customer:</b> <code>${order.customerEmail}</code>
<b>Total Paid:</b> <b>$${order.totalAmount.toFixed(2)}</b>
<b>Status:</b> ✅ ${order.status}

📦 <b>Items Ordered:</b>
${itemsText}

📍 <b>Shipping Address:</b>
<i>${order.shippingAddress || 'No shipping address provided.'}</i>
`.trim();

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errJson = await response.json();
      throw new Error(errJson.description || `HTTP ${response.status}`);
    }

    console.log(`✅ Telegram notification sent successfully for Order #${order.id}`);
  } catch (error) {
    console.error(`❌ Failed to send Telegram notification for Order #${orderId}:`, error.message);
  }
};

module.exports = {
  sendTelegramNotification
};
