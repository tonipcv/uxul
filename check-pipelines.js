const { PrismaClient } = require('@prisma/client');

async function checkPipelines() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📦 Verificando pipelines...');
    
    const pipelines = await prisma.pipeline.findMany({
      include: {
        user: true,
        leads: true
      }
    });
    
    console.log('📊 Total de pipelines:', pipelines.length);
    
    if (pipelines.length > 0) {
      console.log('🔍 Detalhes dos pipelines:');
      pipelines.forEach(pipeline => {
        console.log(`
ID: ${pipeline.id}
Nome: ${pipeline.name}
Usuário: ${pipeline.user.name}
Total de leads: ${pipeline.leads.length}
Criado em: ${pipeline.createdAt}
        `);
      });
    } else {
      console.log('⚠️ Nenhum pipeline encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkPipelines(); 