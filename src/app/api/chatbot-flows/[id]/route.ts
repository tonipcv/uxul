import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Buscar detalhes de um fluxo de chatbot específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const flowId = params.id;
    
    // Buscar o fluxo e verificar se pertence ao usuário
    const flow = await prisma.chatbotFlow.findUnique({
      where: {
        id: flowId,
        userId: session.user.id
      },
      include: {
        nodes: true,
        edges: true,
        indications: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!flow) {
      return NextResponse.json(
        { error: 'Fluxo de chatbot não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Erro ao buscar fluxo de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fluxo de chatbot' },
      { status: 500 }
    );
  }
}

/**
 * Atualizar um fluxo de chatbot
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const flowId = params.id;
    const { name, description, isPublished, startNodeId, nodes, edges } = await req.json();

    // Verificar se o fluxo existe e pertence ao usuário
    const existingFlow = await prisma.chatbotFlow.findUnique({
      where: {
        id: flowId,
        userId: session.user.id
      }
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Fluxo de chatbot não encontrado' },
        { status: 404 }
      );
    }

    // Iniciar uma transação para garantir consistência
    const updatedFlow = await prisma.$transaction(async (tx) => {
      // Atualizar informações básicas do fluxo
      const flow = await tx.chatbotFlow.update({
        where: { id: flowId },
        data: {
          name,
          description,
          isPublished,
          startNodeId
        }
      });

      // Se foram fornecidos novos nós, atualizar todos os nós
      if (nodes) {
        // Remover nós existentes
        await tx.chatbotNode.deleteMany({
          where: { flowId }
        });

        // Criar novos nós
        await tx.chatbotNode.createMany({
          data: nodes.map((node: any) => ({
            ...node,
            flowId
          }))
        });
      }

      // Se foram fornecidas novas conexões, atualizar todas as conexões
      if (edges) {
        // Remover conexões existentes
        await tx.chatbotEdge.deleteMany({
          where: { flowId }
        });

        // Criar novas conexões
        await tx.chatbotEdge.createMany({
          data: edges.map((edge: any) => ({
            ...edge,
            flowId
          }))
        });
      }

      return flow;
    });

    return NextResponse.json(updatedFlow);
  } catch (error) {
    console.error('Erro ao atualizar fluxo de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar fluxo de chatbot' },
      { status: 500 }
    );
  }
}

/**
 * Excluir um fluxo de chatbot
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const flowId = params.id;

    // Verificar se o fluxo existe e pertence ao usuário
    const existingFlow = await prisma.chatbotFlow.findUnique({
      where: {
        id: flowId,
        userId: session.user.id
      },
      include: {
        indications: true
      }
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Fluxo de chatbot não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se existem indicações usando este fluxo
    if (existingFlow.indications.length > 0) {
      // Atualizar as indicações para remover a referência ao fluxo
      await prisma.indication.updateMany({
        where: {
          chatbotFlowId: flowId
        },
        data: {
          chatbotFlowId: null
        }
      });
    }

    // Excluir o fluxo (a exclusão em cascata removerá nós e conexões)
    await prisma.chatbotFlow.delete({
      where: { id: flowId }
    });

    return NextResponse.json({
      success: true,
      message: 'Fluxo de chatbot excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fluxo de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir fluxo de chatbot' },
      { status: 500 }
    );
  }
} 