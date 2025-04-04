-- CreateTable
CREATE TABLE "InsideSalesLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "instagram" TEXT,
    "area" TEXT NOT NULL,
    "employees" TEXT NOT NULL,
    "revenue" TEXT NOT NULL,
    "useTechnology" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsideSalesLead_pkey" PRIMARY KEY ("id")
);
