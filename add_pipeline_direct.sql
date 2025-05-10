-- Script para adicionar Pipeline diretamente
-- Este script é seguro para executar em produção

BEGIN;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Pipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "columns" JSONB NOT NULL DEFAULT '[{"id":"novos","title":"Novos"},{"id":"agendados","title":"Agendados"},{"id":"compareceram","title":"Compareceram"},{"id":"fechados","title":"Fechados"},{"id":"naoVieram","title":"Não vieram"}]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- AlterTable (seguro - adiciona coluna se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Lead' AND column_name = 'pipelineId'
    ) THEN
        ALTER TABLE "Lead" ADD COLUMN "pipelineId" TEXT;
    END IF;
END $$;

-- CreateIndex (seguro - cria índices se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'Pipeline_userId_idx'
    ) THEN
        CREATE INDEX "Pipeline_userId_idx" ON "Pipeline"("userId");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'Lead_pipelineId_idx'
    ) THEN
        CREATE INDEX "Lead_pipelineId_idx" ON "Lead"("pipelineId");
    END IF;
END $$;

-- AddForeignKey (seguro - adiciona FKs se não existirem)
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
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Pipeline_userId_fkey'
    ) THEN
        ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT; 