const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:7e1108cc0482dfdd9e12@dpbdp1.easypanel.host:21341/aa?sslmode=disable"
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Start transaction
    await client.query('BEGIN');

    // Add and populate createdAt
    await client.query(`
      ALTER TABLE "FactEntry" 
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3)
    `);
    console.log('Added createdAt column');
    
    await client.query(`
      UPDATE "FactEntry" 
      SET "createdAt" = "importedAt" 
      WHERE "createdAt" IS NULL
    `);
    console.log('Populated createdAt column');
    
    await client.query(`
      ALTER TABLE "FactEntry" 
      ALTER COLUMN "createdAt" SET NOT NULL,
      ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Set createdAt constraints');

    // Add and populate updatedAt
    await client.query(`
      ALTER TABLE "FactEntry" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3)
    `);
    console.log('Added updatedAt column');
    
    await client.query(`
      UPDATE "FactEntry" 
      SET "updatedAt" = "importedAt" 
      WHERE "updatedAt" IS NULL
    `);
    console.log('Populated updatedAt column');
    
    await client.query(`
      ALTER TABLE "FactEntry" 
      ALTER COLUMN "updatedAt" SET NOT NULL,
      ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Set updatedAt constraints');

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully added timestamp columns to FactEntry table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main(); 