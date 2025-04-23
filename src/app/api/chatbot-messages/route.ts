import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ChatbotConfig {
  welcomeMessage?: string;
  name?: string;
}

/**
 * Enviar mensagem ao chatbot
 */
export async function POST(req: NextRequest) {
  try {
    const { indicationId, content, sender, metadata } = await req.json();

    if (!indicationId || !content || !sender) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: indicationId, content, sender' },
        { status: 400 }
      );
    }

    // Verificar se a indicação existe
    const indication = await prisma.indication.findFirst({
      where: {
        id: indicationId
      }
    });

    if (!indication || !indication.chatbotConfig) {
      return NextResponse.json(
        { error: 'Chatbot não encontrado' },
        { status: 404 }
      );
    }

    // Criar a mensagem
    const message = await prisma.chatMessage.create({
      data: {
        indicationId,
        content,
        sender,
        metadata
      }
    });

    // Se for uma mensagem do usuário, gerar uma resposta automática
    let botResponse: any = null;
    if (sender === 'user') {
      // Pegar configuração do chatbot
      const config = indication.chatbotConfig as ChatbotConfig | null;
      const welcomeMessage = config?.welcomeMessage || 'Como posso ajudar?';
      
      // Resposta padrão do bot
      botResponse = await prisma.chatMessage.create({
        data: {
          indicationId,
          content: welcomeMessage,
          sender: 'bot'
        }
      });

      // Verificar se é primeira mensagem (lead)
      const messagesCount = await prisma.chatMessage.count({
        where: {
          indicationId,
          sender: 'user'
        }
      });

      // Se for a primeira mensagem, registrar como lead
      if (messagesCount === 1 && metadata?.name && metadata?.phone) {
        try {
          // Criar lead
          await prisma.lead.create({
            data: {
              name: metadata.name as string,
              phone: metadata.phone as string,
              userId: indication.userId,
              indicationId: indication.id,
              source: 'chatbot',
              interest: 'Chat automático'
            }
          });
        } catch (error) {
          console.error('Erro ao criar lead do chatbot:', error);
        }
      }
    }

    return NextResponse.json({ 
      message, 
      botResponse 
    });
  } catch (error) {
    console.error('Erro ao processar mensagem de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}

/**
 * Obter histórico de mensagens do chatbot
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const indicationId = url.searchParams.get('indicationId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    if (!indicationId) {
      return NextResponse.json(
        { error: 'Parâmetro indicationId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a indicação existe
    const indication = await prisma.indication.findFirst({
      where: {
        id: indicationId
      }
    });

    if (!indication || !indication.chatbotConfig) {
      return NextResponse.json(
        { error: 'Chatbot não encontrado' },
        { status: 404 }
      );
    }

    // Buscar mensagens
    const messages = await prisma.chatMessage.findMany({
      where: {
        indicationId
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
} 