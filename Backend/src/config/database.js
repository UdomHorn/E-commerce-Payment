const { Sequelize } = require('sequelize');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not defined in the environment variables.");
  process.exit(1);
}

const dialectOptions = {};

if (process.env.NODE_ENV === 'production' || 
    (process.env.DATABASE_URL && 
     !process.env.DATABASE_URL.includes('localhost') && 
     !process.env.DATABASE_URL.includes('127.0.0.1'))) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see raw SQL queries in console
  dialectOptions
});

module.exports = sequelize;
