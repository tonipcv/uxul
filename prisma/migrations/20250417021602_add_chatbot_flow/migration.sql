-- AlterTable
ALTER TABLE "Indication" ADD COLUMN     "chatbotFlowId" TEXT;

-- CreateTable
CREATE TABLE "ChatbotFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startNodeId" TEXT,

    CONSTRAINT "ChatbotFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotNode" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotEdge" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotSession" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "leadId" TEXT,
    "currentNodeId" TEXT,
    "variables" JSONB,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotNode_flowId_idx" ON "ChatbotNode"("flowId");

-- CreateIndex
CREATE INDEX "ChatbotEdge_flowId_idx" ON "ChatbotEdge"("flowId");

-- CreateIndex
CREATE INDEX "ChatbotEdge_sourceNodeId_idx" ON "ChatbotEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "ChatbotEdge_targetNodeId_idx" ON "ChatbotEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "ChatbotSession_flowId_idx" ON "ChatbotSession"("flowId");

-- AddForeignKey
ALTER TABLE "Indication" ADD CONSTRAINT "Indication_chatbotFlowId_fkey" FOREIGN KEY ("chatbotFlowId") REFERENCES "ChatbotFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotFlow" ADD CONSTRAINT "ChatbotFlow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotNode" ADD CONSTRAINT "ChatbotNode_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ChatbotFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotEdge" ADD CONSTRAINT "ChatbotEdge_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "ChatbotFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotEdge" ADD CONSTRAINT "ChatbotEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "ChatbotNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotEdge" ADD CONSTRAINT "ChatbotEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "ChatbotNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
