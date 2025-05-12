-- Create enum for reward types
CREATE TYPE reward_type AS ENUM ('PAGE', 'TEXT');

-- Create PatientReferral table
CREATE TABLE IF NOT EXISTS "PatientReferral" (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    userId VARCHAR(255) NOT NULL,
    pageId VARCHAR(255) NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    leads INTEGER NOT NULL DEFAULT 0,
    sales INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ReferralReward table
CREATE TABLE IF NOT EXISTS "ReferralReward" (
    id SERIAL PRIMARY KEY,
    type reward_type NOT NULL,
    patientReferralId INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    content TEXT NOT NULL,
    unlocked BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientReferralId) REFERENCES "PatientReferral"(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_patient_referral_slug ON "PatientReferral"(slug);
CREATE INDEX idx_patient_referral_user ON "PatientReferral"(userId);
CREATE INDEX idx_referral_reward_patient_referral ON "ReferralReward"(patientReferralId);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_referral_updated_at
    BEFORE UPDATE ON "PatientReferral"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_reward_updated_at
    BEFORE UPDATE ON "ReferralReward"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 