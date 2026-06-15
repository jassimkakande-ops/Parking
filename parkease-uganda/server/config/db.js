const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Add ssl configuration if required by Supabase or remote DBs in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Helper function to test the connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to the PostgreSQL database', { module: 'db' });
    client.release();
  } catch (err) {
    logger.error('Failed to connect to the database', { module: 'db', error: err.message, stack: err.stack });
    process.exit(1);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection
};
