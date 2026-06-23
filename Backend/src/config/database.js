const { Sequelize } = require('sequelize');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not defined in the environment variables.");
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see raw SQL queries in console
  dialectOptions: {
    // If using hosted PostgreSQL providers like Supabase/Neon that require SSL, uncomment below:
    /*
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
    */
  }
});

module.exports = sequelize;
