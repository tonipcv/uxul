const { PrismaClient } = require('@prisma/client');

async function fixPipeline() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📦 Conectando ao banco de dados...');
    
    // Adicionar default para id
    console.log('🔧 Configurando default para id...');
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'Pipeline' 
              AND column_name = 'id' 
              AND column_default LIKE 'gen_random_uuid()%'
          ) THEN
              ALTER TABLE "Pipeline" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
          END IF;
      END $$;
    `;
    
    // Adicionar updatedAt default
    console.log('🔧 Configurando default para updatedAt...');
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'Pipeline' 
              AND column_name = 'updatedAt' 
              AND column_default IS NOT NULL
          ) THEN
              ALTER TABLE "Pipeline" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
          END IF;
      END $$;
    `;
    
    // Adicionar foreign key Pipeline -> User
    console.log('🔧 Adicionando relação Pipeline -> User...');
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'Pipeline_userId_fkey'
          ) THEN
              ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_userId_fkey"
                  FOREIGN KEY ("userId") REFERENCES "User"("id") 
                  ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
      END $$;
    `;
    
    // Adicionar foreign key Lead -> Pipeline
    console.log('🔧 Adicionando relação Lead -> Pipeline...');
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'Lead_pipelineId_fkey'
          ) THEN
              ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey"
                  FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") 
                  ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
      END $$;
    `;
    
    console.log('✅ Correções aplicadas com sucesso!');
    
    // Verificar se as constraints foram criadas
    const checkConstraints = await prisma.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints
      WHERE constraint_name IN ('Pipeline_userId_fkey', 'Lead_pipelineId_fkey');
    `;
    
    console.log('🔍 Constraints encontradas:', checkConstraints);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixPipeline(); 