const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TYPE slot_type_enum AS ENUM ('car', 'bike');
      ALTER TABLE parking_slots ADD COLUMN slot_type slot_type_enum NOT NULL DEFAULT 'car';
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
