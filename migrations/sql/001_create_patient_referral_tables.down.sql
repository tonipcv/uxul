-- Drop triggers
DROP TRIGGER IF EXISTS update_patient_referral_updated_at ON "PatientReferral";
DROP TRIGGER IF EXISTS update_referral_reward_updated_at ON "ReferralReward";

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_patient_referral_slug;
DROP INDEX IF EXISTS idx_patient_referral_user;
DROP INDEX IF EXISTS idx_referral_reward_patient_referral;

-- Drop tables
DROP TABLE IF EXISTS "ReferralReward";
DROP TABLE IF EXISTS "PatientReferral";

-- Drop enum
DROP TYPE IF EXISTS reward_type; 