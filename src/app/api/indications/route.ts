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

    const { patientId, name, type } = await req.json();

    // Verificar se o patientId foi fornecido
    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente é obrigatório" },
        { status: 400 }
      );
    }

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
    
    const patientName = patient.name;

    // Verifica se o paciente já tem uma indicação ativa
    const existingIndication = await prisma.indication.findFirst({
      where: {
        patientId: patientId,
        type: type || 'regular'
      },
    });

    if (existingIndication) {
      return NextResponse.json(
        { error: "Este paciente já possui um link de indicação ativo" },
        { status: 400 }
      );
    }

    // Gera um slug único para a indicação
    const slug = nanoid(10);

    // Define o nome da indicação
    const indicationName = name || patientName || `Indicação ${slug.substring(0, 5)}`;

    // Cria a indicação
    const indication = await prisma.indication.create({
      data: {
        slug,
        userId: token.sub as string,
        patientId,
        name: indicationName,
        type: type || 'regular',
        fullLink: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`,
      },
    });

    // Registra o evento de criação da indicação
    await prisma.event.create({
      data: {
        type: "INDICATION_CREATED",
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