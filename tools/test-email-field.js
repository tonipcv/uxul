const { Database } = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

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

// Gerar ID único para o teste
const testId = `outb_test_${crypto.randomBytes(8).toString('hex')}`;
const testEmail = `teste-${Date.now()}@example.com`;

// SQL para inserir um registro de teste com email
const insertSQL = `
INSERT INTO Outbound (
  id, 
  userId, 
  nome, 
  especialidade, 
  instagram, 
  whatsapp, 
  email, 
  status, 
  observacoes, 
  endereco, 
  createdAt, 
  updatedAt
) VALUES (
  ?, 
  (SELECT id FROM User LIMIT 1), 
  'Teste Email Field', 
  'Teste', 
  'teste_insta', 
  '123456789', 
  ?, 
  'prospectado', 
  'Registro de teste para verificar campo email', 
  'Endereço de teste', 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
`;

// Inserir registro de teste
db.run(insertSQL, [testId, testEmail], function(err) {
  if (err) {
    console.error('Erro ao inserir registro de teste:', err.message);
    db.close();
    return;
  }
  
  console.log(`[OK] Registro de teste inserido com sucesso! ID: ${testId}, Email: ${testEmail}`);
  
  // Verificar se o registro foi inserido corretamente
  const selectSQL = `SELECT * FROM Outbound WHERE id = ?;`;
  
  db.get(selectSQL, [testId], (err, row) => {
    if (err) {
      console.error('Erro ao buscar registro inserido:', err.message);
    } else if (row) {
      console.log('\nRegistro encontrado:');
      console.log(row);
      
      if (row.email === testEmail) {
        console.log('\n[OK] Campo email está funcionando corretamente!');
      } else {
        console.error(`\n[ERRO] Campo email não corresponde ao valor inserido. Esperado: ${testEmail}, Recebido: ${row.email}`);
      }
      
      // Limpar registro de teste
      db.run(`DELETE FROM Outbound WHERE id = ?;`, [testId], function(err) {
        if (err) {
          console.error('Erro ao excluir registro de teste:', err.message);
        } else {
          console.log(`\n[OK] Registro de teste excluído com sucesso.`);
        }
        
        // Fechar a conexão
        db.close((err) => {
          if (err) {
            console.error('Erro ao fechar conexão:', err.message);
          }
          console.log('Conexão fechada. Teste concluído.');
        });
      });
    } else {
      console.error('\n[ERRO] Registro não encontrado após inserção!');
      
      // Fechar a conexão
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar conexão:', err.message);
        }
        console.log('Conexão fechada. Teste concluído com falha.');
      });
    }
  });
}); 