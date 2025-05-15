const { Database } = require('sqlite3').verbose();
const path = require('path');

// Abrir conexão com o banco de dados
const db = new Database(path.join(__dirname, '../prisma/dev.db'), (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite.');
});

// SQL para criar a tabela Outbound
const createOutboundTable = `
CREATE TABLE IF NOT EXISTS Outbound (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nome TEXT NOT NULL,
  especialidade TEXT,
  imagem TEXT,
  instagram TEXT,
  whatsapp TEXT,
  status TEXT DEFAULT 'abordado',
  observacoes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);
`;

// Executar SQL para criar a tabela
db.run(createOutboundTable, (err) => {
  if (err) {
    console.error('Erro ao criar tabela Outbound:', err.message);
  } else {
    console.log('Tabela Outbound criada com sucesso!');
    
    // Inserir alguns dados de exemplo
    const insertSampleData = `
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dr Maria Pessa',
      'Dermatologista',
      'dramariapessa',
      NULL,
      'abordado',
      'usa linktree'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dr Maria Pessa');
    
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dr Leandro Capuchinho',
      NULL,
      'leandrocapuchinho',
      NULL,
      'interessado',
      'sem linktree link direto para o whatsapp'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dr Leandro Capuchinho');
    
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dr Glauco Piassi',
      NULL,
      'glaucopiassi',
      NULL,
      'publicou link',
      'sem usar linktree'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dr Glauco Piassi');
    
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dra Priscila Faria',
      'Ginecologista',
      'drapriscilafariagineco',
      NULL,
      'upgrade lead',
      'tem linktree e site'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dra Priscila Faria');
    
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dra Sefora',
      NULL,
      'drasefora',
      NULL,
      NULL,
      'sem linktree e sem nada'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dra Sefora');
    
    INSERT INTO Outbound (id, userId, nome, especialidade, instagram, whatsapp, status, observacoes)
    SELECT
      'outb_' || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)),
      (SELECT id FROM User LIMIT 1),
      'Dr Erico Diogenes',
      NULL,
      'drericodiogenes',
      NULL,
      NULL,
      'site na bio não funcionando'
    WHERE NOT EXISTS (SELECT 1 FROM Outbound WHERE nome = 'Dr Erico Diogenes');
    `;
    
    db.exec(insertSampleData, (err) => {
      if (err) {
        console.error('Erro ao inserir dados de exemplo:', err.message);
      } else {
        console.log('Dados de exemplo inseridos com sucesso!');
      }
      
      // Fechar a conexão com o banco
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
          console.log('Conexão com o banco de dados fechada.');
        }
      });
    });
  }
}); 