import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
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

    const patient = await db.patient.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        lead: {
          select: {
            status: true,
            appointmentDate: true,
            medicalNotes: true,
          }
        }
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: patient }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar paciente' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
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

    const body = await request.json();

    // Verificar se o paciente existe e pertence ao usuário
    const existingPatient = await db.patient.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o paciente e seu lead
    const updatedPatient = await db.patient.update({
          where: {
        id: params.id,
          },
          data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        lead: {
          update: {
            status: body.lead.status,
            appointmentDate: body.lead.appointmentDate,
            medicalNotes: body.lead.medicalNotes,
          }
        }
      },
      include: {
        lead: {
          select: {
            status: true,
            appointmentDate: true,
            medicalNotes: true,
          }
        }
      }
    });

    return NextResponse.json(updatedPatient, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar paciente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
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

    // Verificar se o paciente existe e pertence ao usuário
    const patient = await db.patient.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o paciente e seus dados relacionados
    await db.patient.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: 'Paciente excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir paciente' },
      { status: 500 }
    );
  }
} 