-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "accessTokenExpiry" TIMESTAMP(3);
