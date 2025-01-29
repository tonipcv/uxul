-- UpdateTaskStructure
BEGIN;

-- Adicionar colunas necessárias
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN DEFAULT false;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "importance" INTEGER DEFAULT 1;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Atualizar userId com o primeiro usuário do sistema (temporariamente)
WITH FirstUser AS (
    SELECT id FROM "User" LIMIT 1
)
UPDATE "Task" SET "userId" = (SELECT id FROM FirstUser) WHERE "userId" IS NULL;

-- Tornar colunas obrigatórias NOT NULL
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "dueDate" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "isCompleted" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "importance" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Adicionar foreign key se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'Task_userId_fkey') THEN
        ALTER TABLE "Task" 
        ADD CONSTRAINT "Task_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar índices se não existirem
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'Task' AND indexname = 'Task_userId_idx') THEN
        CREATE INDEX "Task_userId_idx" ON "Task"("userId");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'Task' AND indexname = 'Task_dueDate_idx') THEN
        CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
    END IF;
END $$;

COMMIT; 