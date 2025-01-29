-- CreateTaskTable
BEGIN;

-- Criar a tabela Task se não existir
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- Adicionar foreign key
ALTER TABLE "Task" 
ADD CONSTRAINT "Task_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"(id) 
ON DELETE CASCADE;

-- Adicionar índices
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

COMMIT; 