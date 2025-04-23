import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string, indicationSlug: string } }
) {
  try {
    const { userSlug, indicationSlug } = params;

    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar a indicação pelo slug
    const indication = await prisma.indication.findFirst({
      where: {
        slug: indicationSlug,
        userId: user.id
      },
      include: { 
        // Incluir o fluxo associado
        chatbotFlow: {
          include: {
            nodes: true,
            edges: true
          }
        },
        // Incluir o quiz associado
        quiz: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: "Indicação não encontrada" },
        { status: 404 }
      );
    }

    // Redirect to quiz-specific route if it's a quiz indication
    if (indication.quizId) {
      const url = new URL(request.url);
      const origin = url.origin;
      const queryParams = url.search || '';
      
      return NextResponse.redirect(`${origin}/quiz/${userSlug}/${indicationSlug}${queryParams}`);
    }

    // Registrar visualização (evento)
    await prisma.event.create({
      data: {
        type: indication.chatbotFlowId 
          ? 'CHATBOT_FLOW_VIEW' 
          : (indication.chatbotConfig 
              ? 'CHATBOT_LEGACY_VIEW' 
              : 'LINK_VIEW'),
        userId: user.id,
        indicationId: indication.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Preparar a resposta: incluir nós e arestas se for um chatbot de fluxo
    let responseData: any = { ...indication };
    
    // Processar dados para chatbot de fluxo
    if (indication.chatbotFlow) {
      // Encontrar o nó inicial e talvez os próximos conectados
      const startNode = indication.chatbotFlow.nodes.find(n => n.id === indication.chatbotFlow?.startNodeId);
      
      responseData = {
        ...indication,
        initialNodes: startNode ? [startNode] : [], // Retorna o nó inicial numa lista
        // Remover dados completos do fluxo se não precisar no frontend inicial
        chatbotFlow: {
            id: indication.chatbotFlow.id,
            name: indication.chatbotFlow.name,
            startNodeId: indication.chatbotFlow.startNodeId
        }
      };
    } else {
      responseData.chatbotFlow = null; // Garantir que não envie dados do fluxo se não existir
    }
    
    // Processar dados para questionário
    if (indication.quiz) {
      responseData.isQuiz = true;
      
      // Formatar as questões para o frontend
      if (indication.quiz.questions) {
        responseData.quiz = {
          ...indication.quiz,
          questions: indication.quiz.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            required: q.required,
            variableName: q.variableName,
            options: q.options || []
          }))
        };
      }
    } else {
      responseData.isQuiz = false;
      responseData.quiz = null;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar indicação:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 