-- AddUserRelationToTasks
BEGIN;

-- Adicionar coluna userId se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Task' AND column_name = 'userId') THEN
        ALTER TABLE "Task" ADD COLUMN "userId" TEXT;
    END IF;
END $$;

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

-- Adicionar índice se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'Task' AND indexname = 'Task_userId_idx') THEN
        CREATE INDEX "Task_userId_idx" ON "Task"("userId");
    END IF;
END $$;

COMMIT; 