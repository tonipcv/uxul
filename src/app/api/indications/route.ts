import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

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
 *               name:
 *                 type: string
 *                 description: Nome da indicação
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
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const data = await req.json();
    const { name, patientName, patientEmail, patientPhone } = data;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da indicação é obrigatório' },
        { status: 400 }
      );
    }

    // Validar dados do paciente
    if (!patientName || !patientEmail || !patientPhone) {
      return NextResponse.json(
        { error: 'Dados do paciente são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar o slug a partir do nome
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
      locale: 'pt'
    }).substring(0, 50);

    // Verificar se já existe uma indicação com esse slug
    const existingCount = await prisma.indication.count({
      where: {
        userId: session.user.id,
        slug: {
          startsWith: baseSlug
        }
      }
    });

    // Se já existe, adicionar um sufixo numérico
    const slug = existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug;

    // Criar o lead primeiro
    const lead = await prisma.lead.create({
      data: {
        name: patientName,
        phone: patientPhone,
        userId: session.user.id,
        status: 'Novo'
      }
    });

    // Criar o paciente vinculado ao lead
    const patient = await prisma.patient.create({
      data: {
        name: patientName,
        email: patientEmail,
        phone: patientPhone,
        userId: session.user.id,
        leadId: lead.id
      }
    });

    // Criar a nova indicação vinculada ao lead
    const newIndication = await prisma.indication.create({
      data: {
        name,
        slug,
        userId: session.user.id,
        leads: {
          connect: {
            id: lead.id
          }
        }
      },
      include: {
        leads: {
          include: {
            patient: true
          }
        }
      }
    });

    return NextResponse.json(newIndication, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 