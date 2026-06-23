const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoryBanner = sequelize.define('CategoryBanner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // e.g. "Women" or "Men"
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = CategoryBanner;
