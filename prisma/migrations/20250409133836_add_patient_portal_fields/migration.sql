-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "firstAccess" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasPortalAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;
