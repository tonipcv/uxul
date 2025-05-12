import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Criar nova recompensa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      referralId,
      type,
      title,
      description,
      unlockValue,
      unlockType,
      pageId,
      textContent
    } = await req.json();

    // Validar dados obrigatórios
    if (!referralId || !type || !title || !unlockValue || !unlockType) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se a referência existe e pertence ao usuário
    const referral = await prisma.patientReferral.findFirst({
      where: {
        id: referralId,
        patient: {
          userId: session.user.id
        }
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referência não encontrada' },
        { status: 404 }
      );
    }

    // Se for do tipo PAGE, verificar se a página existe e pertence ao usuário
    if (type === 'PAGE' && pageId) {
      const page = await prisma.page.findFirst({
        where: {
          id: pageId,
          userId: session.user.id
        }
      });

      if (!page) {
        return NextResponse.json(
          { error: 'Página não encontrada' },
          { status: 404 }
        );
      }
    }

    // Criar recompensa
    const reward = await prisma.referralReward.create({
      data: {
        referralId,
        type,
        title,
        description,
        unlockValue,
        unlockType,
        pageId: type === 'PAGE' ? pageId : null,
        textContent: type === 'TEXT' ? textContent : null,
      }
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Erro ao criar recompensa:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET - Listar recompensas de uma referência
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const referralId = searchParams.get('referralId');

    if (!referralId) {
      return NextResponse.json(
        { error: 'referralId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar recompensas
    const rewards = await prisma.referralReward.findMany({
      where: {
        referralId,
        referral: {
          patient: {
            userId: session.user.id
          }
        }
      },
      include: {
        page: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        unlockValue: 'asc'
      }
    });

    // Formatar resposta
    const formattedRewards = rewards.map(reward => ({
      ...reward,
      pageName: reward.type === 'PAGE' ? reward.page?.title : null
    }));

    return NextResponse.json(formattedRewards);
  } catch (error) {
    console.error('Erro ao buscar recompensas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status de desbloqueio da recompensa
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, referralId } = await req.json();

    // Verificar se a recompensa existe e pertence ao usuário
    const reward = await prisma.referralReward.findFirst({
      where: {
        id,
        referralId,
        referral: {
          patient: {
            userId: session.user.id
          }
        }
      }
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Recompensa não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar status de desbloqueio
    const updatedReward = await prisma.referralReward.update({
      where: { id },
      data: {
        unlockedAt: new Date()
      }
    });

    return NextResponse.json(updatedReward);
  } catch (error) {
    console.error('Erro ao atualizar recompensa:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 