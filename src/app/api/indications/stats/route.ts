import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/indications/stats:
 *   get:
 *     summary: Obtém estatísticas agregadas de indicações
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *           default: month
 *         description: Período para filtrar as estatísticas
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
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
    const period = url.searchParams.get('period') || 'month';

    // Determinar a data de início com base no período
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

    // Buscar todas as indicações do usuário
    const indications = await prisma.indication.findMany({
      where: { userId: session.user.id },
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

    // Calcular estatísticas agregadas
    const totalIndications = indications.length;
    let totalClicks = 0;
    let totalLeads = 0;
    const indicationStats = indications.map(indication => {
      const clicks = indication._count.events;
      const leads = indication._count.leads;
      totalClicks += clicks;
      totalLeads += leads;
      
      return {
        id: indication.id,
        slug: indication.slug,
        name: indication.name,
        clicks,
        leads,
        conversionRate: clicks > 0 ? Math.round((leads / clicks) * 100) : 0
      };
    });

    // Ordenar por número de leads (melhor desempenho primeiro)
    indicationStats.sort((a, b) => b.leads - a.leads);

    // Estatísticas por dia nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyClicks = await prisma.event.groupBy({
      by: ['createdAt'],
      where: {
        userId: session.user.id,
        type: 'click',
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        _all: true
      }
    });

    const dailyLeads = await prisma.lead.groupBy({
      by: ['createdAt'],
      where: {
        userId: session.user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        _all: true
      }
    });

    // Estatísticas gerais
    const overallStats = {
      totalIndications,
      totalClicks,
      totalLeads,
      overallConversionRate: totalClicks > 0 ? Math.round((totalLeads / totalClicks) * 100) : 0,
      period
    };

    return NextResponse.json({
      overall: overallStats,
      indications: indicationStats,
      dailyStats: {
        clicks: dailyClicks,
        leads: dailyLeads
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de indicações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 