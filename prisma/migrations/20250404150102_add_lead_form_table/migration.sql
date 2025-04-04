-- CreateTable
CREATE TABLE "LeadForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "instagram" TEXT,
    "area" TEXT NOT NULL,
    "employees" TEXT NOT NULL,
    "revenue" TEXT NOT NULL,
    "useTechnology" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Novo',
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadForm_pkey" PRIMARY KEY ("id")
);
