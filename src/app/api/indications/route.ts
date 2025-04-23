import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';
import { getToken } from "next-auth/jwt";
import { nanoid } from "nanoid";

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/indications:
 *   get:
 *     summary: Lista todas as indicações do usuário
 *     parameters:
 *       - in: query
 *         name: withStats
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Inclui estatísticas básicas de cada indicação
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *           default: month
 *         description: Período para filtrar as estatísticas (se withStats=true)
 *     responses:
 *       200:
 *         description: Lista de indicações obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
export async function GET(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar indicações com estatísticas
    const indications = await prisma.indication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            events: {
              where: {
                type: 'click'
              }
            },
            leads: true
          }
        },
        leads: {
          where: {
            status: 'converted'
          },
          select: {
            id: true
          }
        }
      }
    });

    // Formatar os resultados
    const formattedIndications = indications.map(indication => ({
      id: indication.id,
      slug: indication.slug,
      name: indication.name || indication.slug,
      createdAt: indication.createdAt,
      _count: {
        events: indication._count.events,
        leads: indication._count.leads,
        converted: indication.leads.length
      }
    }));

    return NextResponse.json(formattedIndications);
  } catch (error) {
    console.error('Erro ao buscar indicações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/indications:
 *   post:
 *     summary: Cria uma nova indicação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: ID do paciente
 *     responses:
 *       201:
 *         description: Indicação criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { patientId, chatbotConfig, chatbotFlowId, name, type } = await req.json();

    // Para chatbots, patientId é opcional
    if (!patientId && !chatbotConfig && !chatbotFlowId) {
      return NextResponse.json(
        { error: "ID do paciente é obrigatório para indicações do tipo regular" },
        { status: 400 }
      );
    }

    // Verificação para chatbot
    const isChatbot = !!chatbotConfig || !!chatbotFlowId || type === 'chatbot';

    // Para indicações normais, verifica dados do paciente
    let patientName = "";
    if (patientId) {
      // Verifica se o paciente existe e pertence ao usuário
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          userId: token.sub as string,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }
      
      patientName = patient.name;

      // Verifica se o paciente já tem uma indicação ativa do mesmo tipo
      const existingIndication = await prisma.indication.findFirst({
        where: {
          patientId: patientId,
          type: isChatbot ? 'chatbot' : 'regular'
        },
      });

      if (existingIndication) {
        return NextResponse.json(
          { error: `Este paciente já possui um link ${isChatbot ? "de chatbot" : "de indicação"} ativo` },
          { status: 400 }
        );
      }
    }

    // Gera um slug único para a indicação
    const slug = nanoid(10);

    // Define o nome baseado no tipo
    let indicationName = name;
    if (!indicationName) {
      if (isChatbot) {
        if (chatbotConfig && typeof chatbotConfig === 'object' && 'name' in chatbotConfig) {
          indicationName = String(chatbotConfig.name);
        } else {
          indicationName = `Chatbot ${slug.substring(0, 5)}`;
        }
      } else {
        indicationName = patientName || `Indicação ${slug.substring(0, 5)}`;
      }
    }

    // Cria a indicação
    const indication = await prisma.indication.create({
      data: {
        slug,
        userId: token.sub as string,
        patientId: patientId || null,
        name: indicationName,
        type: type || (isChatbot ? 'chatbot' : 'regular'),
        chatbotConfig: isChatbot && chatbotConfig ? chatbotConfig : undefined,
        chatbotFlowId: chatbotFlowId || undefined,
        fullLink: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`,
      },
    });

    // Registra o evento de criação da indicação
    await prisma.event.create({
      data: {
        type: isChatbot ? "CHATBOT_CREATED" : "INDICATION_CREATED",
        userId: token.sub as string,
        indicationId: indication.id,
      },
    });

    return NextResponse.json(indication);
  } catch (error) {
    console.error("Erro ao criar indicação:", error);
    return NextResponse.json(
      { error: "Erro ao criar indicação" },
      { status: 500 }
    );
  }
} 