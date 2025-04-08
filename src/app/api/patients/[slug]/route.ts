import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { 
        OR: [
          { id: slug },
          { user: { slug: slug } }
        ]
      },
      select: {
        name: true,
        email: true,
        phone: true,
        accessToken: true,
        accessTokenExpiry: true,
        user: {
          select: {
            name: true,
            specialty: true,
            phone: true,
            image: true,
            slug: true,
          },
        },
        lead: {
          select: {
            status: true,
            appointmentDate: true,
            medicalNotes: true,
            indication: {
              select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true,
                fullLink: true,
                _count: {
                  select: {
                    leads: true,
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o token é válido e não expirou
    if (
      !patient.accessToken ||
      !patient.accessTokenExpiry ||
      new Date(patient.accessTokenExpiry) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Token de acesso inválido ou expirado' },
        { status: 401 }
      );
    }

    // Hash do token fornecido para comparação
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Verificar se o token corresponde
    if (patient.accessToken !== hashedToken) {
      return NextResponse.json(
        { error: 'Token de acesso inválido' },
        { status: 401 }
      );
    }

    // Remover os campos de token da resposta
    const { accessToken, accessTokenExpiry, ...patientData } = patient;

    // Adicionar o link completo da indicação
    if (patientData.lead?.indication) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      patientData.lead.indication.fullLink = `${baseUrl}/${patientData.user.slug}/${patientData.lead.indication.slug}`;
    }

    return NextResponse.json(patientData);
  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do paciente' },
      { status: 500 }
    );
  }
} 