-- AlterTable
ALTER TABLE "Checkpoint" ALTER COLUMN "id" SET DATA TYPE TEXT,
                         ALTER COLUMN "id" DROP DEFAULT,
                         ALTER COLUMN "id" SET DEFAULT gen_random_uuid(); 