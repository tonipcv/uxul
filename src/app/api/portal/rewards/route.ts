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

    const rewards = await prisma.referralReward.findMany({
      where: {
        referral: {
          patient: {
            email: session.user.email
          }
        }
      },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        unlockValue: true,
        unlockType: true,
        unlockedAt: true,
        textContent: true,
        referral: {
          select: {
            id: true,
            slug: true,
            leads: true,
            sales: true,
            page: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        },
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            primaryColor: true
          }
        }
      }
    })

    // Formatar a resposta para incluir progresso
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      type: reward.type,
      title: reward.title,
      description: reward.description,
      unlockValue: reward.unlockValue,
      unlockType: reward.unlockType,
      isUnlocked: !!reward.unlockedAt,
      unlockedAt: reward.unlockedAt,
      textContent: reward.textContent,
      progress: reward.unlockType === 'LEADS'
        ? (reward.referral.leads / reward.unlockValue) * 100
        : (reward.referral.sales / reward.unlockValue) * 100,
      referral: {
        id: reward.referral.id,
        slug: reward.referral.slug,
        page: reward.referral.page
      },
      page: reward.page
    }))

    return NextResponse.json(formattedRewards)
  } catch (error) {
    console.error('Erro ao buscar recompensas do paciente:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 