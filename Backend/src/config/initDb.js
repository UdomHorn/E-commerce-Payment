const { Client } = require('pg');
require('dotenv').config();

async function ensureDatabaseExists() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not configured.");
    return;
  }

  // Parse connection string to get target database name
  // Format: postgresql://username:password@host:port/database_name
  const matches = connectionString.match(/^(postgresql:\/\/[^/]+\/)([^?]+)/);
  if (!matches) {
    console.warn("Invalid DATABASE_URL format.");
    return;
  }

  const baseUri = matches[1];
  const targetDbName = matches[2];

  // Connect to the default 'postgres' database first to run database creation
  const client = new Client({
    connectionString: `${baseUri}postgres`
  });

  try {
    await client.connect();

    // Check if the target database already exists
    const checkQuery = 'SELECT 1 FROM pg_database WHERE datname = $1';
    const result = await client.query(checkQuery, [targetDbName]);

    if (result.rowCount === 0) {
      console.log(`⚠️ Database "${targetDbName}" does not exist. Attempting to create it...`);
      
      // Execute raw SQL to create the database (cannot use parameterized query for CREATE DATABASE)
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`✅ Database "${targetDbName}" already exists.`);
    }
  } catch (error) {
    console.warn(`Could not verify/create database "${targetDbName}" automatically:`, error.message);
    console.warn("Please make sure your local PostgreSQL service is running and credentials are correct.");
  } finally {
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
  }
}

module.exports = ensureDatabaseExists;
