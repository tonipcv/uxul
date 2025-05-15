const { Database } = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, '../prisma/dev.db');
console.log(`Conectando ao banco de dados em: ${dbPath}`);

// Abrir conexão com o banco de dados
const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite.');
});

// SQL para adicionar o campo de email diretamente
const alterTableSQL = `
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Adicionar a coluna email à tabela Outbound
ALTER TABLE Outbound ADD COLUMN email TEXT;

COMMIT;
PRAGMA foreign_keys=on;
`;

// Executa o comando SQL para adicionar a coluna
db.exec(alterTableSQL, (err) => {
  if (err) {
    console.error('Erro ao adicionar coluna email:', err.message);
    // Mesmo com erro, ainda tentamos confirmar se a coluna existe
    checkColumn();
  } else {
    console.log('Comando SQL executado com sucesso!');
    checkColumn();
  }
});

// Função para verificar se a coluna foi adicionada
function checkColumn() {
  const checkSQL = `PRAGMA table_info(Outbound);`;
  
  db.all(checkSQL, [], (err, rows) => {
    if (err) {
      console.error('Erro ao verificar estrutura da tabela:', err.message);
    } else {
      const emailColumn = rows.find(row => row.name === 'email');
      
      if (emailColumn) {
        console.log('[OK] Coluna email existe na tabela Outbound!');
        console.log('Detalhes da coluna:', emailColumn);
      } else {
        console.error('[ERRO] Coluna email não foi encontrada na tabela Outbound.');
      }
    }
    
    // Fechar a conexão em qualquer caso
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar conexão:', err.message);
      }
      console.log('Conexão fechada. Migração concluída.');
    });
  });
} 