-- Primeiro, verificamos se a coluna já existe para evitar erros
DO $$ 
BEGIN 
    -- Adicionar hasActiveProducts se não existir
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name='Patient' 
                  AND column_name='hasActiveProducts') THEN
        ALTER TABLE "Patient" ADD COLUMN "hasActiveProducts" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Tornar userId opcional se não for
    IF EXISTS (SELECT 1 
              FROM information_schema.columns 
              WHERE table_name='Patient' 
              AND column_name='userId' 
              AND is_nullable='NO') THEN
        ALTER TABLE "Patient" ALTER COLUMN "userId" DROP NOT NULL;
    END IF;

    -- Adicionar índice único no email se não existir
    IF NOT EXISTS (SELECT 1 
                  FROM pg_indexes 
                  WHERE tablename='Patient' 
                  AND indexname='Patient_email_key') THEN
        CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");
    END IF;

    -- Atualizar constraints de chave estrangeira para userId
    IF EXISTS (SELECT 1 
              FROM information_schema.table_constraints 
              WHERE constraint_name='Patient_userId_fkey') THEN
        ALTER TABLE "Patient" DROP CONSTRAINT "Patient_userId_fkey";
        ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;

END $$; 