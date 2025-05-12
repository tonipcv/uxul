import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todas as referências do médico
    const referrals = await prisma.patientReferral.findMany({
      where: {
        patient: {
          userId: session.user.id
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        page: {
          select: {
            title: true,
            slug: true
          }
        },
        rewards: {
          select: {
            id: true,
            title: true,
            type: true,
            unlockedAt: true,
            page: {
              select: {
                title: true
              }
            },
            textContent: true
          }
        }
      },
      orderBy: {
        leads: 'desc'
      }
    });

    // Formatar resposta
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      patient: referral.patient,
      page: referral.page,
      slug: referral.slug,
      stats: {
        visits: referral.visits,
        leads: referral.leads,
        sales: referral.sales
      },
      unlockedRewards: referral.rewards
        .filter(r => r.unlockedAt)
        .map(r => ({
          title: r.title,
          type: r.type,
          content: r.type === 'PAGE' ? r.page?.title : r.textContent
        }))
    }));

    // Agrupar estatísticas
    const stats = {
      totalVisits: referrals.reduce((sum, r) => sum + r.visits, 0),
      totalLeads: referrals.reduce((sum, r) => sum + r.leads, 0),
      totalSales: referrals.reduce((sum, r) => sum + r.sales, 0),
      activePatients: referrals.length,
      unlockedRewards: referrals.reduce(
        (sum, r) => sum + r.rewards.filter(rw => rw.unlockedAt).length,
        0
      )
    };

    return NextResponse.json({
      referrals: formattedReferrals,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar referrals:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 