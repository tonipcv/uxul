const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function migratePivotSnapshot() {
  // Configuração de SSL para produção
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessário para alguns provedores de hospedagem
    }
  });

  console.log('Iniciando migração do PivotSnapshot...');
  console.log('Conectando ao banco de dados...');

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('Conexão estabelecida com sucesso!');

    // Iniciar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se a tabela já existe
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'PivotSnapshot'
        );
      `);

      if (tableExists.rows[0].exists) {
        console.log('Tabela PivotSnapshot já existe. Pulando criação...');
        await client.query('COMMIT');
        return;
      }

      // Ler e executar o script SQL
      const sqlPath = path.join(__dirname, '..', 'migrations', '20240516_add_pivot_snapshot.sql');
      const sqlContent = await fs.readFile(sqlPath, 'utf8');
      
      // Executar cada comando separadamente
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          await client.query(command);
          console.log('Comando SQL executado com sucesso:', command.trim().split('\n')[0]);
        }
      }

      // Commit da transação
      await client.query('COMMIT');
      console.log('Migração concluída com sucesso!');

    } catch (err) {
      // Rollback em caso de erro
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar migração
if (require.main === module) {
  migratePivotSnapshot().catch(console.error);
}

module.exports = migratePivotSnapshot; 