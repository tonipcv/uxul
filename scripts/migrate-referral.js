const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://postgres:15b2d8e1ea51476ed626@dpbdp1.easypanel.host:654/servidor?sslmode=disable"
});

const migrationSQL = `
-- Remover tabelas se existirem (para evitar conflitos)
DROP TABLE IF EXISTS "ReferralReward";
DROP TABLE IF EXISTS "PatientReferral";
DROP TYPE IF EXISTS "RewardType";

-- Criar enum RewardType
CREATE TYPE "RewardType" AS ENUM ('PAGE', 'TEXT');

-- Criar tabela PatientReferral
CREATE TABLE "PatientReferral" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT UNIQUE NOT NULL,
  "pageId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "visits" INTEGER NOT NULL DEFAULT 0,
  "leads" INTEGER NOT NULL DEFAULT 0,
  "sales" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PatientReferral_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE,
  CONSTRAINT "PatientReferral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE
);

-- Criar tabela ReferralReward
CREATE TABLE "ReferralReward" (
  "id" TEXT PRIMARY KEY,
  "referralId" TEXT NOT NULL,
  "type" "RewardType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "unlockValue" INTEGER NOT NULL,
  "unlockType" TEXT NOT NULL,
  "pageId" TEXT,
  "textContent" TEXT,
  "unlockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "PatientReferral"("id") ON DELETE CASCADE,
  CONSTRAINT "ReferralReward_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL,
  CONSTRAINT "unlockType_check" CHECK ("unlockType" IN ('LEADS', 'SALES'))
);

-- Criar índices depois que as tabelas existirem
CREATE INDEX "PatientReferral_pageId_idx" ON "PatientReferral"("pageId");
CREATE INDEX "PatientReferral_patientId_idx" ON "PatientReferral"("patientId");
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");
CREATE INDEX "ReferralReward_pageId_idx" ON "ReferralReward"("pageId");
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migração...');
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error); 