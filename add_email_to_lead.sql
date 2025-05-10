-- Adicionar coluna email à tabela Lead
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "email" TEXT; 