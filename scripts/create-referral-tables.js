const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgres://postgres:15b2d8e1ea51476ed626@dpbdp1.easypanel.host:654/servidor?sslmode=disable'
});

// SQL para criar as tabelas
const createTablesSQL = `
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type') THEN
    CREATE TYPE reward_type AS ENUM ('PAGE', 'TEXT');
  END IF;
END $$;

-- Create PatientReferral table
CREATE TABLE IF NOT EXISTS "PatientReferral" (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    userId VARCHAR(255) NOT NULL,
    pageId VARCHAR(255) NOT NULL,
    patientId VARCHAR(255) NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    leads INTEGER NOT NULL DEFAULT 0,
    sales INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pageId) REFERENCES "Page"(id) ON DELETE CASCADE,
    FOREIGN KEY (patientId) REFERENCES "Patient"(id) ON DELETE CASCADE
);

-- Create ReferralReward table
CREATE TABLE IF NOT EXISTS "ReferralReward" (
    id SERIAL PRIMARY KEY,
    type reward_type NOT NULL,
    patientReferralId INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    unlockValue INTEGER NOT NULL,
    unlockType VARCHAR(10) NOT NULL CHECK (unlockType IN ('LEADS', 'SALES')),
    pageId VARCHAR(255),
    textContent TEXT,
    unlockedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientReferralId) REFERENCES "PatientReferral"(id) ON DELETE CASCADE,
    FOREIGN KEY (pageId) REFERENCES "Page"(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_referral_slug ON "PatientReferral"(slug);
CREATE INDEX IF NOT EXISTS idx_patient_referral_user ON "PatientReferral"(userId);
CREATE INDEX IF NOT EXISTS idx_patient_referral_patient ON "PatientReferral"(patientId);
CREATE INDEX IF NOT EXISTS idx_patient_referral_page ON "PatientReferral"(pageId);
CREATE INDEX IF NOT EXISTS idx_referral_reward_patient_referral ON "ReferralReward"(patientReferralId);
CREATE INDEX IF NOT EXISTS idx_referral_reward_page ON "ReferralReward"(pageId);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patient_referral_updated_at ON "PatientReferral";
CREATE TRIGGER update_patient_referral_updated_at
    BEFORE UPDATE ON "PatientReferral"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_reward_updated_at ON "ReferralReward";
CREATE TRIGGER update_referral_reward_updated_at
    BEFORE UPDATE ON "ReferralReward"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function createTables() {
  const client = await pool.connect();
  try {
    // Inicia a transação
    await client.query('BEGIN');

    // Executa o SQL
    await client.query(createTablesSQL);

    // Confirma a transação
    await client.query('COMMIT');
    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    // Reverte em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas:', error);
    throw error;
  } finally {
    // Libera o cliente
    client.release();
    // Fecha o pool
    await pool.end();
  }
}

// Executa a criação das tabelas
createTables().catch(console.error); 