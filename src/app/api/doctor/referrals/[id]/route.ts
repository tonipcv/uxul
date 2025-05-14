import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar se a referência existe e pertence ao usuário
    const referral = await prisma.patientReferral.findFirst({
      where: {
        id,
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

    // Excluir a referência e suas recompensas em uma transação
    await prisma.$transaction([
      // Primeiro excluir as recompensas associadas
      prisma.referralReward.deleteMany({
        where: {
          referralId: id
        }
      }),
      // Depois excluir a referência
      prisma.patientReferral.delete({
        where: {
          id
        }
      })
    ]);

    return NextResponse.json(
      { message: 'Referência excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir referência:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { pageId, patientId } = await request.json();

    // Validar dados
    if (!pageId || !patientId) {
      return NextResponse.json(
        { error: 'pageId e patientId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a referência existe e pertence ao usuário
    const existingReferral = await prisma.patientReferral.findFirst({
      where: {
        id,
        patient: {
          userId: session.user.id
        }
      }
    });

    if (!existingReferral) {
      return NextResponse.json(
        { error: 'Referência não encontrada' },
        { status: 404 }
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

    // Verificar se já existe outra referência para este paciente e página
    const duplicateReferral = await prisma.patientReferral.findFirst({
      where: {
        id: { not: id },
        patientId,
        pageId
      }
    });

    if (duplicateReferral) {
      return NextResponse.json(
        { error: 'Este paciente já tem acesso a esta página' },
        { status: 400 }
      );
    }

    // Atualizar referência
    const updatedReferral = await prisma.patientReferral.update({
      where: { id },
      data: {
        pageId,
        patientId
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
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedReferral.id,
      patient: updatedReferral.patient,
      page: updatedReferral.page,
      slug: updatedReferral.slug,
      stats: {
        visits: updatedReferral.visits,
        leads: updatedReferral.leads,
        sales: updatedReferral.sales
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar referência:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 