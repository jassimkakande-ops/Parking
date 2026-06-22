require('dotenv').config({ path: '../../.env' });
const db = require('../config/db');

async function main() {
  try {
    console.log('Adding "attendant" to user_role ENUM...');
    await db.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'attendant';`);
    console.log('Success! ENUM updated.');
  } catch (error) {
    console.error('Error updating ENUM:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
