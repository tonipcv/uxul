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

// SQL para verificar a estrutura da tabela
const checkTableSQL = `PRAGMA table_info(Outbound);`;

// Executa o comando SQL
db.all(checkTableSQL, [], (err, rows) => {
  if (err) {
    console.error('Erro ao verificar estrutura da tabela:', err.message);
  } else {
    console.log('Estrutura da tabela Outbound:');
    console.table(rows);
    
    // Verificar especificamente a coluna email
    const emailColumn = rows.find(row => row.name === 'email');
    if (emailColumn) {
      console.log('\n[OK] A coluna email existe na tabela Outbound!');
      console.log('Detalhes da coluna email:', emailColumn);
    } else {
      console.error('\n[ERRO] A coluna email NÃO foi encontrada na tabela Outbound.');
    }
  }
  
  // Fechar a conexão
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar conexão:', err.message);
    }
    console.log('Conexão fechada.');
  });
}); 