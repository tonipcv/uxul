import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const referrals = await prisma.patientReferral.findMany({
      where: {
        patient: {
          email: session.user.email
        }
      },
      select: {
        id: true,
        slug: true,
        visits: true,
        leads: true,
        sales: true,
        createdAt: true,
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            primaryColor: true
          }
        },
        rewards: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            unlockValue: true,
            unlockType: true,
            unlockedAt: true,
            textContent: true,
            page: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      }
    })

    // Formatar a resposta para incluir progresso
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
      })),
      createdAt: referral.createdAt
    }))

    return NextResponse.json(formattedReferrals)
  } catch (error) {
    console.error('Erro ao buscar referrals do paciente:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 