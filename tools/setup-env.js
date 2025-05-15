#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Caminhos importantes
const projectRoot = path.join(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');
const prismaDir = path.join(projectRoot, 'prisma');
const dbPath = path.join(prismaDir, 'dev.db');

// Conteúdo do .env
const envContent = `DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
`;

// Garantir que o diretório prisma existe
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
  console.log('✅ Diretório prisma criado');
}

// Garantir que há um arquivo de banco de dados vazio
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('✅ Arquivo de banco de dados criado');
}

// Escrever o arquivo .env
fs.writeFileSync(envPath, envContent);
console.log('✅ Arquivo .env configurado');

// Também configurar .env.local
fs.writeFileSync(envLocalPath, envContent);
console.log('✅ Arquivo .env.local configurado');

// Regenerar o cliente Prisma
try {
  console.log('🔄 Regenerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma regenerado');
} catch (error) {
  console.error('❌ Erro ao regenerar cliente Prisma:', error);
}

// Aplicar o esquema
try {
  console.log('🔄 Aplicando esquema ao banco de dados...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Esquema aplicado ao banco de dados');
} catch (error) {
  console.error('❌ Erro ao aplicar esquema ao banco de dados:', error);
}

console.log('\n🎉 Configuração concluída! Execute npm run dev para iniciar o servidor.'); 