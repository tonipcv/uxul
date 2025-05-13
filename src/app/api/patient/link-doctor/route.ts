import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar se é um médico autenticado
    if (!session?.user?.id || session.user.type !== 'user') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { patientEmail } = await request.json();

    if (!patientEmail) {
      return NextResponse.json(
        { error: 'Email do paciente é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o paciente
    const patient = await prisma.patient.findUnique({
      where: { email: patientEmail }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o paciente já está vinculado a outro médico
    if (patient.userId && patient.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Paciente já está vinculado a outro médico' },
        { status: 400 }
      );
    }

    // Vincular paciente ao médico
    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        userId: session.user.id,
        hasActiveProducts: true
      },
      include: {
        user: {
          select: {
            name: true,
            specialty: true,
            phone: true,
            image: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPatient.id,
        name: updatedPatient.name,
        email: updatedPatient.email,
        phone: updatedPatient.phone,
        hasActiveProducts: updatedPatient.hasActiveProducts,
        doctor: updatedPatient.user ? {
          name: updatedPatient.user.name,
          specialty: updatedPatient.user.specialty,
          phone: updatedPatient.user.phone,
          image: updatedPatient.user.image,
          slug: updatedPatient.user.slug
        } : null
      }
    });
  } catch (error) {
    console.error('Erro ao vincular paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao vincular paciente' },
      { status: 500 }
    );
  }
} 