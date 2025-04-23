import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface SessionVariable {
  name: string;
  value: string;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface MessageNodeContent {
  message: string;
}

interface InputNodeContent {
  question: string;
  inputType?: string;
  variableName?: string;
  placeholder?: string;
}

interface ChatbotNode {
  id: string;
  type: 'message' | 'input' | 'condition';
  content: Prisma.JsonValue;
}

interface ChatbotEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: Record<string, any>;
}

interface ChatbotFlow {
  id: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
}

interface TextResponse {
  id: string;
  content: string;
  type: 'text';
}

interface InputResponse {
  id: string;
  content: string;
  type: 'input';
  inputType: string;
  variableName?: string;
  placeholder?: string;
}

type ChatbotResponse = TextResponse | InputResponse;

/**
 * Iniciar ou continuar uma sessão de chatbot
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      indicationId, 
      sessionId,
      message,  // Mensagem do usuário (apenas para continuar sessão)
      variables = [] // Variáveis iniciais (nome, telefone, etc)
    } = await req.json();

    // Verificar parâmetros
    if (!indicationId) {
      return NextResponse.json(
        { error: 'ID da indicação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a indicação e seu fluxo associado
    const indication = await prisma.indication.findUnique({
      where: { id: indicationId },
      include: {
        chatbotFlow: {
          include: {
            nodes: true,
            edges: true
          }
        }
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    if (!indication.chatbotFlow) {
      return NextResponse.json(
        { error: 'Chatbot não configurado para esta indicação' },
        { status: 400 }
      );
    }

    const flow = indication.chatbotFlow;

    // Buscar ou criar sessão
    let session;
    if (sessionId) {
      // Continuar sessão existente
      session = await prisma.chatbotSession.findUnique({
        where: { id: sessionId }
      });

      if (!session || session.flowId !== flow.id) {
        return NextResponse.json(
          { error: 'Sessão inválida' },
          { status: 400 }
        );
      }

      // Registrar a mensagem do usuário
      if (message) {
        await prisma.chatMessage.create({
          data: {
            indicationId,
            content: message,
            sender: 'user'
          }
        });
      }
    } else {
      // Criar nova sessão
      session = await prisma.chatbotSession.create({
        data: {
          flowId: flow.id,
          currentNodeId: flow.startNodeId,
          variables: {}
        }
      });

      // Armazenar variáveis iniciais
      if (variables.length > 0) {
        const sessionVars: Record<string, any> = {};
        variables.forEach((v: SessionVariable) => {
          sessionVars[v.name] = v.value;
        });

        // Atualizar variáveis da sessão
        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: { variables: sessionVars }
        });

        // Se foi fornecido nome e telefone, criar um lead
        const nameVar = variables.find(v => v.name === 'name');
        const phoneVar = variables.find(v => v.name === 'phone');
        
        if (nameVar && phoneVar) {
          try {
            await prisma.lead.create({
              data: {
                name: nameVar.value,
                phone: phoneVar.value,
                userId: indication.userId,
                indicationId: indication.id,
                source: 'chatbot_flow'
              }
            });
          } catch (error) {
            console.error('Erro ao criar lead:', error);
          }
        }
      }
    }

    // Buscar o nó atual
    const currentNodeId = session.currentNodeId;
    const currentNode = flow.nodes.find(n => n.id === currentNodeId);

    if (!currentNode) {
      return NextResponse.json(
        { error: 'Nó atual não encontrado' },
        { status: 500 }
      );
    }

    // Processar o nó atual
    const responses: ChatbotResponse[] = [];
    let nextNodeId: string | null = null;

    // Se o nó atual é uma mensagem, adicionar como resposta do bot
    if (currentNode.type === 'message' && 
        typeof currentNode.content === 'object' && 
        currentNode.content !== null && 
        'message' in currentNode.content && 
        typeof currentNode.content.message === 'string') {
      const message = currentNode.content.message;
      const botMessage = await prisma.chatMessage.create({
        data: {
          indicationId,
          content: message,
          sender: 'bot'
        }
      });
      
      responses.push({
        id: botMessage.id,
        content: botMessage.content,
        type: 'text'
      });

      // Buscar a próxima conexão sem condição 
      const nextEdge = flow.edges.find(e => 
        e.sourceNodeId === currentNode.id && (!e.condition || Object.keys(e.condition).length === 0)
      );

      if (nextEdge) {
        nextNodeId = nextEdge.targetNodeId;
      } else {
        nextNodeId = null;
      }
    } 
    // Se o nó atual é uma entrada, enviar a pergunta e esperar resposta
    else if (currentNode.type === 'input' && 
             typeof currentNode.content === 'object' && 
             currentNode.content !== null && 
             'question' in currentNode.content && 
             typeof currentNode.content.question === 'string') {
      const nodeContent = currentNode.content as unknown as InputNodeContent;
      const botMessage = await prisma.chatMessage.create({
        data: {
          indicationId,
          content: nodeContent.question,
          sender: 'bot'
        }
      });
      
      responses.push({
        id: botMessage.id,
        content: nodeContent.question,
        type: 'input',
        inputType: nodeContent.inputType || 'text',
        variableName: nodeContent.variableName,
        placeholder: nodeContent.placeholder
      });

      // Para inputs, vamos esperar a resposta do usuário antes de avançar
      if (message && sessionId) {
        // Se recebemos mensagem, atualizar a variável
        const varName = nodeContent.variableName;
        if (varName) {
          const sessionVars = session.variables || {};
          sessionVars[varName] = message;
          
          await prisma.chatbotSession.update({
            where: { id: session.id },
            data: { variables: sessionVars }
          });
        }

        // Avançar para o próximo nó
        const nextEdge = flow.edges.find(e => e.sourceNodeId === currentNode.id);
        if (nextEdge) {
          nextNodeId = nextEdge.targetNodeId;
        } else {
          nextNodeId = null;
        }
      }
    }
    // Se o nó atual é uma condição, avaliar e determinar próximo nó
    else if (currentNode.type === 'condition') {
      // Implementação da lógica de condição seria aqui
      // Por enquanto, vamos simplesmente seguir a primeira conexão
      const nextEdge = flow.edges.find(e => e.sourceNodeId === currentNode.id);
      if (nextEdge) {
        nextNodeId = nextEdge.targetNodeId;
      }
    }

    // Se temos um próximo nó, atualizar a sessão
    if (nextNodeId) {
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { currentNodeId: nextNodeId }
      });

      // Se o próximo nó é uma mensagem, podemos processar imediatamente
      const nextNode = flow.nodes.find(n => n.id === nextNodeId);
      if (nextNode && 
          nextNode.type === 'message' && 
          typeof nextNode.content === 'object' && 
          nextNode.content !== null && 
          'message' in nextNode.content && 
          typeof nextNode.content.message === 'string') {
        const message = nextNode.content.message;
        const botMessage = await prisma.chatMessage.create({
          data: {
            indicationId,
            content: message,
            sender: 'bot'
          }
        });
        
        responses.push({
          id: botMessage.id,
          content: botMessage.content,
          type: 'text'
        });

        // Buscar a próxima conexão após esta mensagem
        const followupEdge = flow.edges.find(e => e.sourceNodeId === nextNode.id);
        if (followupEdge) {
          // Atualizar para o nó seguinte
          await prisma.chatbotSession.update({
            where: { id: session.id },
            data: { currentNodeId: followupEdge.targetNodeId }
          });
        } else {
          nextNodeId = null;
        }
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      responses,
      waitingForInput: currentNode.type === 'input' && (!message || !sessionId),
      completed: !nextNodeId
    });
  } catch (error) {
    console.error('Erro ao executar chatbot:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem de chatbot' },
      { status: 500 }
    );
  }
} 