import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Criar nova referência
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { pageId, patientId } = await req.json();

    // Validar dados
    if (!pageId || !patientId) {
      return NextResponse.json(
        { error: 'pageId e patientId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: session.user.id
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a página pertence ao usuário
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

    // Verificar se já existe uma referência para este paciente e página
    const existingReferral = await prisma.patientReferral.findFirst({
      where: {
        patientId,
        pageId
      }
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Este paciente já tem acesso a esta página' },
        { status: 400 }
      );
    }

    // Criar referência
    const referral = await prisma.patientReferral.create({
      data: {
        slug: nanoid(10),
        pageId,
        patientId,
      }
    });

    return NextResponse.json(referral);
  } catch (error) {
    console.error('Erro ao criar referência:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET - Listar referências do paciente
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar referências com contagem de recompensas
    const referrals = await prisma.patientReferral.findMany({
      where: {
        patientId,
        patient: {
          userId: session.user.id
        }
      },
      include: {
        page: {
          select: {
            title: true
          }
        },
        rewards: {
          select: {
            id: true,
            unlockedAt: true
          }
        }
      }
    });

    // Formatar resposta
    const formattedReferrals = referrals.map(referral => ({
      ...referral,
      pageName: referral.page.title,
      totalRewards: referral.rewards.length,
      unlockedRewards: referral.rewards.filter(r => r.unlockedAt).length
    }));

    return NextResponse.json(formattedReferrals);
  } catch (error) {
    console.error('Erro ao buscar referências:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 