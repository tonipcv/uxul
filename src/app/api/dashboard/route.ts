import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar contagem de leads
    const totalLeads = await prisma.lead.count({
      where: { userId }
    });

    // Buscar contagem de indicações
    const totalIndications = await prisma.indication.count({
      where: { userId }
    });

    // Buscar contagem de cliques
    const totalClicks = await prisma.event.count({
      where: { 
        userId,
        type: 'click' 
      }
    });

    // Calcular taxa de conversão (leads / cliques)
    const conversionRate = totalClicks > 0 
      ? Math.round((totalLeads / totalClicks) * 100) 
      : 0;

    // Buscar leads recentes (últimos 5)
    const recentLeads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    // Buscar top indicadores (indicações com mais leads)
    const topIndications = await prisma.indication.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            leads: true,
            events: true
          }
        }
      },
      orderBy: [
        {
          leads: {
            _count: 'desc'
          }
        }
      ],
      take: 5
    });

    // Buscar as origens de tráfego mais comuns
    const topSources = await prisma.$queryRaw`
      SELECT utmSource as source, COUNT(*) as count
      FROM Lead
      WHERE userId = ${userId} AND utmSource IS NOT NULL
      GROUP BY utmSource
      ORDER BY count DESC
      LIMIT 5
    `;

    return NextResponse.json({
      totalLeads,
      totalIndications,
      totalClicks,
      conversionRate,
      recentLeads,
      topIndications,
      topSources
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 