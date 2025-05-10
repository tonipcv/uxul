const { PrismaClient } = require('@prisma/client');

async function createDefaultPipeline() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📦 Buscando usuário...');
    
    // Buscar o primeiro usuário (você pode modificar isso para um usuário específico)
    const user = await prisma.user.findFirst({
      where: {
        plan: 'premium'
      }
    });
    
    if (!user) {
      console.log('⚠️ Nenhum usuário premium encontrado');
      return;
    }
    
    console.log('👤 Usuário encontrado:', user.name);
    
    // Verificar se o usuário já tem um pipeline
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        userId: user.id
      }
    });
    
    if (existingPipeline) {
      console.log('ℹ️ Usuário já possui um pipeline:', existingPipeline.name);
      return;
    }
    
    // Criar pipeline padrão
    console.log('🔧 Criando pipeline padrão...');
    const pipeline = await prisma.pipeline.create({
      data: {
        name: 'Pipeline Principal',
        description: 'Pipeline padrão para gerenciamento de leads',
        userId: user.id,
        columns: [
          { id: 'novos', title: 'Novos' },
          { id: 'agendados', title: 'Agendados' },
          { id: 'compareceram', title: 'Compareceram' },
          { id: 'fechados', title: 'Fechados' },
          { id: 'naoVieram', title: 'Não vieram' }
        ]
      }
    });
    
    console.log('✅ Pipeline criado com sucesso:', pipeline);
    
    // Atualizar leads existentes para usar o novo pipeline
    console.log('🔄 Atualizando leads existentes...');
    await prisma.lead.updateMany({
      where: {
        userId: user.id,
        pipelineId: null
      },
      data: {
        pipelineId: pipeline.id
      }
    });
    
    console.log('✅ Leads atualizados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createDefaultPipeline(); 