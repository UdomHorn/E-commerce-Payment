const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Banner = require('./Banner');
const CategoryBanner = require('./CategoryBanner');

// Define associations
Order.hasMany(OrderItem, { 
  foreignKey: 'orderId', 
  as: 'items', 
  onDelete: 'CASCADE' 
});
OrderItem.belongsTo(Order, { 
  foreignKey: 'orderId', 
  as: 'order' 
});

Product.hasMany(OrderItem, { 
  foreignKey: 'productId', 
  as: 'orderItems' 
});
OrderItem.belongsTo(Product, { 
  foreignKey: 'productId', 
  as: 'product' 
});

module.exports = {
  Product,
  Order,
  OrderItem,
  Banner,
  CategoryBanner,
};
