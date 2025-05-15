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

// SQL para adicionar o campo de email
const addEmailSQL = `
-- Verifica se a coluna já existe antes de adicionar
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Adicionar coluna se não existir
SELECT CASE 
  WHEN NOT EXISTS(SELECT 1 FROM pragma_table_info('Outbound') WHERE name = 'email') 
  THEN 'ALTER TABLE Outbound ADD COLUMN email TEXT'
END AS sql_to_run;

COMMIT;
PRAGMA foreign_keys=on;
`;

// Executa o comando SQL
db.all(addEmailSQL, [], (err, rows) => {
  if (err) {
    console.error('Erro ao executar verificação de coluna:', err.message);
    db.close();
    process.exit(1);
  }
  
  const sqlToRun = rows[0] && rows[0].sql_to_run;
  
  if (sqlToRun) {
    console.log('Executando:', sqlToRun);
    db.exec(sqlToRun, (err) => {
      if (err) {
        console.error('Erro ao adicionar coluna email:', err.message);
      } else {
        console.log('Coluna de email adicionada com sucesso!');
      }
      
      // Fechar a conexão
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar conexão:', err.message);
        }
        console.log('Conexão fechada. Migração concluída.');
      });
    });
  } else {
    console.log('A coluna email já existe na tabela Outbound. Nenhuma alteração necessária.');
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar conexão:', err.message);
      }
      console.log('Conexão fechada.');
    });
  }
}); 