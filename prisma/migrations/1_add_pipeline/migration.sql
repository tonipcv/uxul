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

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "pipelineId" TEXT;

-- CreateIndex
CREATE INDEX "Pipeline_userId_idx" ON "Pipeline"("userId");
CREATE INDEX "Lead_pipelineId_idx" ON "Lead"("pipelineId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE; 