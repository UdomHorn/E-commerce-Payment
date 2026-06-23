const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable for guest checkouts
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PENDING', // PENDING, PAID, FAILED, CANCELLED
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true, // Will capture at checkout
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = Order;
