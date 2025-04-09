-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "hasPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;
