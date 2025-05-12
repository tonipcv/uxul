const { Client } = require('pg');

const DATABASE_URL = "postgres://postgres:15b2d8e1ea51476ed626@dpbdp1.easypanel.host:654/servidor?sslmode=disable";

async function createServicesTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Criar a tabela Service
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Service" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "category" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,

        CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
      );
    `);

    // Adicionar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Service_userId_idx" ON "Service"("userId");
    `);

    // Adicionar serviceId nas tabelas relacionadas
    await client.query(`
      ALTER TABLE "Lead"
      ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
      ADD CONSTRAINT "Lead_serviceId_fkey" 
      FOREIGN KEY ("serviceId") 
      REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await client.query(`
      ALTER TABLE "Page"
      ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
      ADD CONSTRAINT "Page_serviceId_fkey" 
      FOREIGN KEY ("serviceId") 
      REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    await client.query(`
      ALTER TABLE "ReferralReward"
      ADD COLUMN IF NOT EXISTS "serviceId" TEXT,
      ADD CONSTRAINT "ReferralReward_serviceId_fkey" 
      FOREIGN KEY ("serviceId") 
      REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    console.log('✅ Tabelas e relações de Service criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    await client.end();
  }
}

createServicesTables(); 