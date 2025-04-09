import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do paciente é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe e pertence ao usuário atual
    const patient = await db.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o paciente e seu lead associado
    await db.patient.delete({
      where: {
        id,
      },
    });

    if (patient.leadId) {
      await db.lead.delete({
        where: {
          id: patient.leadId,
        },
      });
    }

    return NextResponse.json(
      { message: 'Paciente deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar paciente' },
      { status: 500 }
    );
  }
} 