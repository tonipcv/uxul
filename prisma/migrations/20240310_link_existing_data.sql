-- First, add the userId columns as nullable
ALTER TABLE "Cycle" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Circle" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Link all existing records to the user xppsalvador@gmail.com
WITH target_user AS (
  SELECT id FROM "User" WHERE email = 'xppsalvador@gmail.com' LIMIT 1
)
UPDATE "Cycle" SET "userId" = (SELECT id FROM target_user)
WHERE "userId" IS NULL;

WITH target_user AS (
  SELECT id FROM "User" WHERE email = 'xppsalvador@gmail.com' LIMIT 1
)
UPDATE "Habit" SET "userId" = (SELECT id FROM target_user)
WHERE "userId" IS NULL;

WITH target_user AS (
  SELECT id FROM "User" WHERE email = 'xppsalvador@gmail.com' LIMIT 1
)
UPDATE "Circle" SET "userId" = (SELECT id FROM target_user)
WHERE "userId" IS NULL;

-- Add foreign key constraints
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make the columns NOT NULL after linking the data
ALTER TABLE "Cycle" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Habit" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Circle" ALTER COLUMN "userId" SET NOT NULL; 