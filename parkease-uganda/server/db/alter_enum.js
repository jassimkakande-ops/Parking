require('dotenv').config({ path: '../../.env' });
const db = require('../config/db');

async function main() {
  try {
    console.log('Adding "timedout" to payment_status ENUM...');
    await db.query(`ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'timedout';`);
    console.log('Success! ENUM updated.');
  } catch (error) {
    console.error('Error updating ENUM:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
