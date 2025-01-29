-- AddUserRelation
BEGIN;

-- Adicionar coluna userId
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Atualizar userId com o primeiro usuário do sistema (temporariamente)
WITH FirstUser AS (
    SELECT id FROM "User" LIMIT 1
)
UPDATE "Task" SET "userId" = (SELECT id FROM FirstUser) WHERE "userId" IS NULL;

-- Tornar a coluna NOT NULL após preencher os dados
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

-- Adicionar foreign key
ALTER TABLE "Task" 
ADD CONSTRAINT "Task_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"(id) 
ON DELETE CASCADE;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");

COMMIT; 