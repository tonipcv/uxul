require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Read and execute the up migration
    const upSql = await fs.readFile(
      path.join(__dirname, '001_create_patient_referral_tables.up.sql'),
      'utf8'
    );
    await client.query(upSql);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error running migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackMigration() {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Read and execute the down migration
    const downSql = await fs.readFile(
      path.join(__dirname, '001_create_patient_referral_tables.down.sql'),
      'utf8'
    );
    await client.query(downSql);

    // Commit transaction
    await client.query('COMMIT');
    console.log('Rollback completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error running rollback:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'up') {
  runMigration().catch(() => process.exit(1));
} else if (command === 'down') {
  rollbackMigration().catch(() => process.exit(1));
} else {
  console.error('Please specify either "up" or "down" as command line argument');
  process.exit(1);
} 