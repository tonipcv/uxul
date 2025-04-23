import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Listar todos os chatbots do usuário
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar todos os fluxos de chatbot do usuário
    const chatbotFlows = await prisma.chatbotFlow.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        indications: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapear os fluxos para incluir dados da indicação
    const mappedFlows = chatbotFlows.map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      isPublished: flow.isPublished,
      createdAt: flow.createdAt,
      // Pegar a primeira indicação associada (geralmente haverá apenas uma)
      indicationId: flow.indications[0]?.id || null,
      indicationSlug: flow.indications[0]?.slug || null,
    }));

    return NextResponse.json(mappedFlows);
  } catch (error) {
    console.error('Erro ao listar chatbots:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chatbots' },
      { status: 500 }
    );
  }
}

/**
 * Criar um novo fluxo de chatbot
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cliente Prisma está disponível
    if (!prisma) {
      console.error('Erro: Cliente Prisma não está disponível');
      return NextResponse.json(
        { error: 'Erro interno do servidor: Cliente de banco de dados não inicializado' },
        { status: 500 }
      );
    }

    // Criar fluxo de chatbot com nó inicial
    const flow = await prisma.chatbotFlow.create({
      data: {
        name,
        description,
        userId: session.user.id
      }
    });

    // Criar nó inicial (boas-vindas)
    const startNode = await prisma.chatbotNode.create({
      data: {
        flowId: flow.id,
        type: 'message',
        content: {
          message: `Olá! Sou o assistente virtual ${name}. Como posso ajudar você hoje?`
        },
        position: { x: 200, y: 100 }
      }
    });

    // Atualizar o fluxo com o nó inicial
    await prisma.chatbotFlow.update({
      where: { id: flow.id },
      data: { startNodeId: startNode.id }
    });

    // Criar nó para abrir a conversa
    const conversationNode = await prisma.chatbotNode.create({
      data: {
        flowId: flow.id,
        type: 'message',
        content: {
          message: 'Para que eu possa te ajudar melhor, gostaria de saber um pouco sobre você.'
        },
        position: { x: 200, y: 200 }
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
        position: { x: 200, y: 300 }
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
        position: { x: 200, y: 400 }
      }
    });

    // Criar nó de mensagem final
    const finalNode = await prisma.chatbotNode.create({
      data: {
        flowId: flow.id,
        type: 'message',
        content: {
          message: 'Obrigado por suas informações! Entraremos em contato em breve.'
        },
        position: { x: 200, y: 500 }
      }
    });

    // Conectar os nós
    await prisma.chatbotEdge.create({
      data: {
        flowId: flow.id,
        sourceNodeId: startNode.id,
        targetNodeId: conversationNode.id
      }
    });

    await prisma.chatbotEdge.create({
      data: {
        flowId: flow.id,
        sourceNodeId: conversationNode.id,
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

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Erro ao criar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao criar chatbot' },
      { status: 500 }
    );
  }
} 