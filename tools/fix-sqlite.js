#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️ Corrigindo URL do SQLite no schema.prisma');

const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

if (fs.existsSync(schemaPath)) {
  // Ler o conteúdo atual
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Substituir a seção datasource
  const updatedSchema = schemaContent.replace(
    /datasource\s+db\s+{[^}]*}/gs, 
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  
  // Escrever de volta ao arquivo
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log('✅ Schema.prisma atualizado para usar DATABASE_URL do ambiente');
  
  // Criar arquivo .env na raiz do projeto
  const envPath = path.join(projectRoot, '.env');
  const envContent = `DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env criado/atualizado com DATABASE_URL correto');
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
  }
  
  // Regenerar o cliente Prisma
  try {
    console.log('🔄 Regenerando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente Prisma regenerado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao regenerar cliente Prisma:', error.message);
  }
  
  console.log('🎉 Configuração do SQLite concluída!');
} else {
  console.error('❌ Arquivo schema.prisma não encontrado');
} 