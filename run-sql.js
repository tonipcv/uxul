// Script para executar SQL diretamente no banco usando o Prisma
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runSQL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📦 Conectando ao banco de dados...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'add_email_to_lead.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔧 Executando SQL...');
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ SQL executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
runSQL(); 