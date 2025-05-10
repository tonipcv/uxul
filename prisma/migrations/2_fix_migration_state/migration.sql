-- Fix migration state
DO $$ 
BEGIN
    -- Drop the _prisma_migrations table if it exists
    DROP TABLE IF EXISTS "_prisma_migrations";
    
    -- Recreate the _prisma_migrations table
    CREATE TABLE "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMP WITH TIME ZONE,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("id")
    );

    -- Add unique constraint on migration_name
    CREATE UNIQUE INDEX "_prisma_migrations_name" ON "_prisma_migrations"("migration_name");
END $$; 