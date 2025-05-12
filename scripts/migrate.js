const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function runMigration() {
  try {
    // Define a URL do banco de dados
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@dpbdp1.easypanel.host:654/postgres';

    // Executa a migração do Prisma
    console.log('Executando migração do Prisma...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Gera o cliente Prisma
    console.log('Gerando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

runMigration(); 