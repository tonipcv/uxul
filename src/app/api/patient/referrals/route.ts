import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

// GET - Buscar referrals do paciente
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar paciente
    const patient = await prisma.patient.findFirst({
      where: {
        userId: session.user.id
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar referrals com recompensas
    const referrals = await prisma.patientReferral.findMany({
      where: {
        patientId: patient.id
      },
      include: {
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
            description: true,
            type: true,
            unlockValue: true,
            unlockType: true,
            unlockedAt: true,
            page: {
              select: {
                title: true,
                slug: true
              }
            },
            textContent: true
          }
        }
      }
    });

    // Formatar resposta
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      slug: referral.slug,
      page: referral.page,
      stats: {
        visits: referral.visits,
        leads: referral.leads,
        sales: referral.sales
      },
      rewards: referral.rewards.map(reward => ({
        ...reward,
        isUnlocked: !!reward.unlockedAt,
        progress: reward.unlockType === 'LEADS' 
          ? (referral.leads / reward.unlockValue) * 100
          : (referral.sales / reward.unlockValue) * 100
      }))
    }));

    return NextResponse.json(formattedReferrals);
  } catch (error) {
    console.error('Erro ao buscar referrals:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 