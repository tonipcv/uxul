const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para criar a tabela ContactInteraction no banco de dados
 * Executa SQL diretamente para evitar problemas com o Prisma Migrate
 */
async function main() {
  try {
    console.log('Iniciando criação da tabela de interações de contatos...');
    
    // Verificar se a tabela já existe
    const tableExists = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='ContactInteraction';
    `;
    
    if (tableExists && tableExists.length > 0) {
      console.log('Tabela ContactInteraction já existe. Pulando criação.');
      return;
    }
    
    // Criar a tabela usando SQL direto
    await prisma.$executeRaw`
      CREATE TABLE "ContactInteraction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "outboundId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("outboundId") REFERENCES "Outbound" ("id") ON DELETE CASCADE
      );
    `;
    
    // Criar índice para melhorar performance de consultas
    await prisma.$executeRaw`
      CREATE INDEX "ContactInteraction_outboundId_idx" ON "ContactInteraction"("outboundId");
    `;
    
    console.log('Tabela ContactInteraction criada com sucesso!');
    
    // Opcional: Inserir alguns dados de exemplo
    const outbounds = await prisma.outbound.findMany({ take: 5 });
    
    if (outbounds.length > 0) {
      console.log('Inserindo dados de exemplo...');
      
      const types = ['whatsapp', 'email', 'instagram', 'call', 'other'];
      const contents = [
        'Enviado mensagem de apresentação.',
        'Agendada reunião para próxima semana.',
        'Respondeu com interesse nos serviços.',
        'Solicitou mais informações sobre valores.',
        'Demonstrou interesse na proposta.'
      ];
      
      for (const outbound of outbounds) {
        // Criar de 1 a 3 interações para cada outbound
        const numInteractions = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numInteractions; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const content = contents[Math.floor(Math.random() * contents.length)];
          
          await prisma.$executeRaw`
            INSERT INTO "ContactInteraction" ("id", "outboundId", "content", "type", "createdAt", "updatedAt")
            VALUES (
              ${`ci_${Date.now()}_${Math.floor(Math.random() * 1000)}`},
              ${outbound.id},
              ${content},
              ${type},
              ${new Date().toISOString()},
              ${new Date().toISOString()}
            );
          `;
        }
      }
      
      console.log('Dados de exemplo inseridos com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro durante a criação da tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 