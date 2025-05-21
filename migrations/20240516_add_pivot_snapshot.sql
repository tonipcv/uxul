-- Criar tabela PivotSnapshot
CREATE TABLE IF NOT EXISTS "PivotSnapshot" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "config" JSONB NOT NULL,
  "data" JSONB NOT NULL,
  "totals" JSONB NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "pivot_snapshot_name_idx" ON "PivotSnapshot"("name");
CREATE INDEX IF NOT EXISTS "pivot_snapshot_created_at_idx" ON "PivotSnapshot"("createdAt");

-- Criar índice GIN para busca em JSON
CREATE INDEX IF NOT EXISTS "pivot_snapshot_metadata_gin_idx" ON "PivotSnapshot" USING gin ("metadata" jsonb_path_ops);

-- Adicionar comentários para documentação
COMMENT ON TABLE "PivotSnapshot" IS 'Armazena snapshots de análises pivot para auditoria e histórico';
COMMENT ON COLUMN "PivotSnapshot"."config" IS 'Configuração da análise (filtros, dimensões, métricas)';
COMMENT ON COLUMN "PivotSnapshot"."data" IS 'Dados da análise no momento do snapshot';
COMMENT ON COLUMN "PivotSnapshot"."metadata" IS 'Metadados como criador, tags, etc'; 