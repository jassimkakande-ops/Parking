const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
  try {
    const migrationFile = process.argv[2] || '004_add_payment_type_and_withdrawals.sql';
    const sqlPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`Running migration: ${migrationFile}...`);
    await db.query(sql);
    console.log(`Migration successful: ${migrationFile}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigration();
