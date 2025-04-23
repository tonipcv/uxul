// Script para migrar chatbots antigos para o novo formato de fluxo

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ChatbotConfig {
  greeting?: string;
  welcomeMessage?: string;
  name?: string;
}

// Função principal
async function migrateChatbots() {
  try {
    console.log('Iniciando migração de chatbots...');
    
    // Buscar indicações que são chatbots
    const chatbotIndications = await prisma.indication.findMany({
      where: {
        type: 'chatbot',
        chatbotFlowId: null // Apenas os que ainda não migraram
      }
    });
    
    // Filtrar apenas os que têm chatbotConfig
    const indicationsToMigrate = chatbotIndications.filter(
      indication => indication.chatbotConfig !== null
    );
    
    console.log(`Encontrados ${indicationsToMigrate.length} chatbots para migrar`);
    
    // Processar cada chatbot
    for (const indication of indicationsToMigrate) {
      console.log(`Migrando chatbot: ${indication.name || indication.id}`);
      
      const config = indication.chatbotConfig as ChatbotConfig;
      
      // Buscar nome do usuário
      const user = await prisma.user.findUnique({
        where: { id: indication.userId },
        select: { name: true }
      });
      
      const doctorName = user?.name || 'seu médico';
      
      // Criar um novo fluxo de chatbot
      const flow = await prisma.chatbotFlow.create({
        data: {
          name: config.name || indication.name || `Chatbot ${indication.slug}`,
          description: 'Migrado automaticamente do formato antigo',
          userId: indication.userId,
          isPublished: true,
        }
      });
      
      console.log(`  Criado fluxo com ID: ${flow.id}`);
      
      // Criar nó de boas-vindas
      const welcomeNode = await prisma.chatbotNode.create({
        data: {
          flowId: flow.id,
          type: 'message',
          content: {
            message: config.greeting || `Olá! Sou o assistente virtual de ${doctorName}`
          },
          position: { x: 250, y: 100 }
        }
      });
      
      // Criar nó para coletar nome
      const nameNode = await prisma.chatbotNode.create({
        data: {
          flowId: flow.id,
          type: 'input',
          content: {
            question: 'Qual é o seu nome?',
            variableName: 'name',
            placeholder: 'Digite seu nome completo',
            inputType: 'text'
          },
          position: { x: 250, y: 250 }
        }
      });
      
      // Criar nó para coletar telefone
      const phoneNode = await prisma.chatbotNode.create({
        data: {
          flowId: flow.id,
          type: 'input',
          content: {
            question: 'Qual é o seu telefone para contato?',
            variableName: 'phone',
            placeholder: '(00) 00000-0000',
            inputType: 'tel'
          },
          position: { x: 250, y: 400 }
        }
      });
      
      // Criar nó de mensagem final
      const finalNode = await prisma.chatbotNode.create({
        data: {
          flowId: flow.id,
          type: 'message',
          content: {
            message: config.welcomeMessage || 'Obrigado por suas informações! Entraremos em contato em breve.'
          },
          position: { x: 250, y: 550 }
        }
      });
      
      // Conectar os nós
      await prisma.chatbotEdge.create({
        data: {
          flowId: flow.id,
          sourceNodeId: welcomeNode.id,
          targetNodeId: nameNode.id
        }
      });
      
      await prisma.chatbotEdge.create({
        data: {
          flowId: flow.id,
          sourceNodeId: nameNode.id,
          targetNodeId: phoneNode.id
        }
      });
      
      await prisma.chatbotEdge.create({
        data: {
          flowId: flow.id,
          sourceNodeId: phoneNode.id,
          targetNodeId: finalNode.id
        }
      });
      
      // Atualizar a indicação para apontar para o novo fluxo
      await prisma.indication.update({
        where: { id: indication.id },
        data: {
          chatbotFlowId: flow.id
        }
      });
      
      // Definir o nó inicial do fluxo
      await prisma.chatbotFlow.update({
        where: { id: flow.id },
        data: {
          startNodeId: welcomeNode.id
        }
      });
      
      console.log(`  Migração concluída!`);
    }
    
    console.log('Migração de chatbots finalizada com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração
migrateChatbots()
  .catch(console.error); 