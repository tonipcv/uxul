/**
 * Script para remover rotas API que dependem de modelos ausentes no Prisma schema
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando limpeza de rotas não utilizadas...');

// Array de diretórios que devem ser removidos por dependerem de modelos ausentes
const routesToRemove = [
  'src/app/api/pages',
  'src/app/api/patient',
  'src/app/api/patients',
  'src/app/api/portal',
  'src/app/api/services',
  'src/app/api/pipelines',
  'src/app/api/interest-options',
  'src/app/api/content'
];

// Contador de rotas removidas
let removedCount = 0;

// Função para remover recursivamente um diretório
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
        console.log(`  Arquivo removido: ${filePath}`);
        removedCount++;
      }
    });
    fs.rmdirSync(dirPath);
    console.log(`Diretório removido: ${dirPath}`);
  }
}

// Função para verificar e remover rotas específicas dentro de outros diretórios
function removeSpecificRoutes() {
  // Remover rota de doctor/referrals que depende de patientReferral
  const doctorReferralsPath = 'src/app/api/doctor/referrals';
  if (fs.existsSync(doctorReferralsPath)) {
    removeDirectory(doctorReferralsPath);
  }

  // Identificar e remover arquivos individuais que usam modelos ausentes
  const filesToCheck = [
    'src/app/api/leads/route.ts',
    'src/app/api/indications/route.ts',
    'src/middleware-patient.ts',
    'src/lib/auth.ts'
  ];

  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('patientReferral') || 
          content.includes('patient.') || 
          content.includes('pipeline.') || 
          content.includes('interestOption')) {
        console.log(`Arquivo com dependências problemáticas: ${filePath}`);
        console.log(`  Este arquivo precisa ser ajustado manualmente.`);
      }
    }
  });
}

// Remover os diretórios listados
routesToRemove.forEach(route => {
  console.log(`\nProcessando: ${route}`);
  removeDirectory(route);
});

// Verificar e remover rotas específicas
removeSpecificRoutes();

console.log(`\nLimpeza concluída! ${removedCount} arquivos removidos.`);
console.log('\nAviso: Alguns arquivos podem precisar de ajustes manuais para remover referências a modelos ausentes.');
console.log('Recomenda-se revisar os arquivos em src/app/api/leads/route.ts e src/app/api/indications/route.ts');

// Para ajudar no teste, gerar um novo cliente Prisma
console.log('\nGerando cliente Prisma atualizado...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Cliente Prisma gerado com sucesso!');
} catch (error) {
  console.error('Erro ao gerar cliente Prisma:', error.message);
}

console.log('\nAgora você pode tentar compilar a aplicação novamente com: npm run build'); 