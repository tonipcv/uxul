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

    // Extrair parâmetros da query
    const url = new URL(req.url);
    const withStats = url.searchParams.get('withStats') === 'true';
    const period = url.searchParams.get('period') || 'month';

    // Determinar a data de início com base no período (se withStats=true)
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        // Não aplicar filtro de data
        startDate.setFullYear(2000);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30); // Padrão: último mês
    }

    // Buscar indicações com ou sem estatísticas
    if (withStats) {
      const indications = await prisma.indication.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              events: {
                where: {
                  type: 'click',
                  createdAt: { gte: startDate }
                }
              },
              leads: {
                where: {
                  createdAt: { gte: startDate }
                }
              }
            }
          }
        }
      });

      // Formatar os resultados com estatísticas
      const formattedIndications = indications.map(indication => {
        const clicks = indication._count.events;
        const leads = indication._count.leads;
        
        return {
          id: indication.id,
          slug: indication.slug,
          name: indication.name || indication.slug,
          createdAt: indication.createdAt,
          stats: {
            clicks,
            leads,
            conversionRate: clicks > 0 ? Math.round((leads / clicks) * 100) : 0,
            period
          }
        };
      });

      return NextResponse.json(formattedIndications);
    } else {
      // Buscar indicações sem estatísticas (mais rápido)
      const indications = await prisma.indication.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(indications);
    }
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
    const { name } = data;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da indicação é obrigatório' },
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

    // Criar a nova indicação
    const newIndication = await prisma.indication.create({
      data: {
        name,
        slug,
        userId: session.user.id
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