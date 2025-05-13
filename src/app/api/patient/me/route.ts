import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// Add dynamic route configuration
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verificar token de autenticação
    const token = await getToken({ req: request as any });

    if (!token || token.type !== 'patient') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar dados do paciente
    const patient = await prisma.patient.findUnique({
      where: { id: token.id as string },
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

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Retornar dados formatados
    return NextResponse.json({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      hasActiveProducts: patient.hasActiveProducts,
      doctor: patient.user ? {
        name: patient.user.name,
        specialty: patient.user.specialty,
        phone: patient.user.phone,
        image: patient.user.image,
        slug: patient.user.slug
      } : null
    });
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do paciente' },
      { status: 500 }
    );
  }
} 