const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  modelInfo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  colors: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  sizes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  sizeStock: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  colorStock: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  }

}, {
  timestamps: true,
});

module.exports = Product;
