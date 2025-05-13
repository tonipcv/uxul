const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Iniciando migração...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'migrations', 'add_patient_independent_registration.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Executar a migração
    await prisma.$executeRawUnsafe(sqlContent);
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .catch((error) => {
    console.error('Falha na migração:', error);
    process.exit(1);
  }); 