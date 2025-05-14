import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret';

// Add dynamic route configuration
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verificar cookie de sessão do paciente
    const sessionCookie = cookies().get('patient_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token
    const decoded = verify(sessionCookie.value, JWT_SECRET) as {
      patientId: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'session') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar dados do paciente
    const patient = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
      include: {
        user: {
          select: {
            name: true,
            specialty: true,
            phone: true,
            image: true,
            slug: true
          }
        },
        referrals: {
          include: {
            page: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            rewards: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                unlockValue: true,
                unlockType: true,
                unlockedAt: true
              }
            }
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

    // Formatar dados das referências
    const formattedReferrals = patient.referrals.map(referral => ({
      id: referral.id,
      slug: referral.slug,
      page: referral.page,
      visits: referral.visits,
      leads: referral.leads,
      sales: referral.sales,
      rewards: referral.rewards.map(reward => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        type: reward.type,
        unlockValue: reward.unlockValue,
        unlockType: reward.unlockType,
        unlockedAt: reward.unlockedAt,
        progress: reward.unlockType === 'VISITS' 
          ? Math.min(100, Math.floor((referral.visits / reward.unlockValue) * 100))
          : reward.unlockType === 'LEADS'
            ? Math.min(100, Math.floor((referral.leads / reward.unlockValue) * 100))
            : Math.min(100, Math.floor((referral.sales / reward.unlockValue) * 100))
      }))
    }));

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
      } : null,
      referrals: formattedReferrals
    });
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do paciente' },
      { status: 500 }
    );
  }
} 