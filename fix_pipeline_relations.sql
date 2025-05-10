-- Script para corrigir as relações do Pipeline
BEGIN;

-- Adicionar default para id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Pipeline' 
        AND column_name = 'id' 
        AND column_default LIKE 'gen_random_uuid()%'
    ) THEN
        ALTER TABLE "Pipeline" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Adicionar updatedAt default se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Pipeline' 
        AND column_name = 'updatedAt' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE "Pipeline" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Adicionar foreign key para Pipeline -> User se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Pipeline_userId_fkey'
    ) THEN
        ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Adicionar foreign key para Lead -> Pipeline se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Lead_pipelineId_fkey'
    ) THEN
        ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey"
            FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT; 