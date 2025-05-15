/**
 * Script para configurar o banco de dados PostgreSQL de produção
 */
const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

// String de conexão do banco PostgreSQL fornecida
const DATABASE_URL = "postgresql://postgres:ddad72e29eb917430119@dpbdp1.easypanel.host:32102/aa?sslmode=disable";

console.log('1. Configurando arquivo .env com a string de conexão do PostgreSQL...');
writeFileSync(path.join(__dirname, '../.env'), `DATABASE_URL="${DATABASE_URL}"\n`);

console.log('2. Gerando cliente Prisma com a configuração atualizada...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('\n3. Instruções para migrar e executar a aplicação em produção:');
console.log('   a. Para migrar seu banco de dados existente:');
console.log('      - Exporte seu banco de dados SQLite: sqlite3 prisma/dev.db .dump > dump.sql');
console.log('      - Adapte o dump SQL para PostgreSQL (pode exigir ajustes manuais)');
console.log('      - Importe para PostgreSQL: psql -h dpbdp1.easypanel.host -p 32102 -U postgres -d aa -f adaptado_dump.sql');
console.log('      - Ou use uma ferramenta como pgAdmin para migração visual');
console.log('   b. Ou siga os passos para construir seu esquema no banco de produção:');
console.log('      - Execute: npx prisma migrate deploy');
console.log('   c. Para iniciar a aplicação em produção:');
console.log('      - Compile a aplicação: npm run build');
console.log('      - Inicie o servidor: npm run start');
console.log('\nConfigurações concluídas! Seu aplicativo agora está configurado para usar o PostgreSQL de produção.'); 