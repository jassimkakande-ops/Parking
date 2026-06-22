require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
  try {
    console.log('Running 007 migration...');
    const sqlPath = path.join(__dirname, 'migrations', '007_add_attendant_role.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await db.query(sql);
    console.log('Migration ran successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
