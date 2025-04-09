-- This is an empty migration.

-- Add resetToken and resetTokenExpiry columns to Patient table
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);