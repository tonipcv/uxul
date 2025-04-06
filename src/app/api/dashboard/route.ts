import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função auxiliar para converter BigInt para Number
function convertBigIntToNumber(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(convertBigIntToNumber);
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = convertBigIntToNumber(data[key]);
    }
    return result;
  }
  
  return data;
}

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
    const topSourcesRaw = await prisma.$queryRaw`
      SELECT "utmSource" as "source", COUNT(*) as "count"
      FROM "public"."Lead"
      WHERE "userId" = ${userId} AND "utmSource" IS NOT NULL
      GROUP BY "utmSource"
      ORDER BY "count" DESC
      LIMIT 5
    `;

    // Calcular faturamento total (soma do potentialValue dos leads fechados)
    const closedLeadsData = await prisma.lead.aggregate({
      where: { 
        userId,
        status: 'Fechado',
        potentialValue: { not: null }
      },
      _sum: {
        potentialValue: true
      }
    });
    
    // Calcular potencial em aberto (soma do potentialValue dos leads não fechados)
    const openLeadsData = await prisma.lead.aggregate({
      where: { 
        userId,
        NOT: { status: 'Fechado' },
        potentialValue: { not: null }
      },
      _sum: {
        potentialValue: true
      }
    });

    // Extrair os valores e garantir que eles não sejam nulos
    const totalRevenue = closedLeadsData._sum.potentialValue || 0;
    const potentialRevenue = openLeadsData._sum.potentialValue || 0;

    // Converter todos os dados que podem conter BigInt
    const responseData = {
      totalLeads: Number(totalLeads),
      totalIndications: Number(totalIndications),
      totalClicks: Number(totalClicks),
      conversionRate,
      recentLeads: convertBigIntToNumber(recentLeads),
      topIndications: convertBigIntToNumber(topIndications),
      topSources: convertBigIntToNumber(topSourcesRaw),
      totalRevenue: Number(totalRevenue),
      potentialRevenue: Number(potentialRevenue)
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error instanceof Error ? error.message : String(error));
    
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao processar a solicitação' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 