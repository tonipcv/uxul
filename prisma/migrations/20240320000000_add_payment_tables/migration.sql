-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "planStatus" TEXT DEFAULT 'inactive';

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "paymentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLink_externalId_key" ON "PaymentLink"("externalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentLink_userId_idx" ON "PaymentLink"("userId");

-- AddForeignKey
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 