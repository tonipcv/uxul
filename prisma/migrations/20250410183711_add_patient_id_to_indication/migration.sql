-- AlterTable
ALTER TABLE "Indication" ADD COLUMN     "patientId" TEXT;

-- AddForeignKey
ALTER TABLE "Indication" ADD CONSTRAINT "Indication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
