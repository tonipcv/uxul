-- CreateEisenhowerTasks
BEGIN;

-- Criar a tabela EisenhowerTask
CREATE TABLE IF NOT EXISTS "EisenhowerTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EisenhowerTask_pkey" PRIMARY KEY ("id")
);

-- Adicionar foreign key
ALTER TABLE "EisenhowerTask" 
ADD CONSTRAINT "EisenhowerTask_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"(id) 
ON DELETE CASCADE;

-- Adicionar índices
CREATE INDEX "EisenhowerTask_userId_idx" ON "EisenhowerTask"("userId");
CREATE INDEX "EisenhowerTask_dueDate_idx" ON "EisenhowerTask"("dueDate");

COMMIT; 