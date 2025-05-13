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