-- Primeiro, adicionar as colunas como nullable (se não existirem)
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Circle" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Cycle" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Encontrar o usuário xppsalvador@gmail.com
DO $$ 
DECLARE
    target_user_id TEXT;
BEGIN
    SELECT id INTO target_user_id FROM "User" WHERE email = 'xppsalvador@gmail.com' LIMIT 1;

    -- Atualizar os registros existentes para vincular ao usuário
    UPDATE "Habit" SET "userId" = target_user_id WHERE "userId" IS NULL;
    UPDATE "Circle" SET "userId" = target_user_id WHERE "userId" IS NULL;
    UPDATE "Cycle" SET "userId" = target_user_id WHERE "userId" IS NULL;

    -- Adicionar as foreign keys e tornar as colunas NOT NULL
    IF target_user_id IS NOT NULL THEN
        -- Habit
        ALTER TABLE "Habit" ALTER COLUMN "userId" SET NOT NULL;
        ALTER TABLE "Habit" DROP CONSTRAINT IF EXISTS "Habit_userId_fkey";
        ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

        -- Circle
        ALTER TABLE "Circle" ALTER COLUMN "userId" SET NOT NULL;
        ALTER TABLE "Circle" DROP CONSTRAINT IF EXISTS "Circle_userId_fkey";
        ALTER TABLE "Circle" ADD CONSTRAINT "Circle_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

        -- Cycle
        ALTER TABLE "Cycle" ALTER COLUMN "userId" SET NOT NULL;
        ALTER TABLE "Cycle" DROP CONSTRAINT IF EXISTS "Cycle_userId_fkey";
        ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$; 