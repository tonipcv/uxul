import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth-patient';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Aguardar params antes de acessá-lo no Next.js 15+
    const { slug } = context.params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!slug) {
      return NextResponse.json(
        { error: 'ID do paciente não fornecido' },
        { status: 400 }
      );
    }

    // Buscar paciente pelo ID (o slug na URL é o ID do paciente)
    const patient = await prisma.patient.findUnique({
      where: {
        id: slug
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        hasPassword: true,
        hasPortalAccess: true,
        firstAccess: true,
        welcomeEmailSent: true,
        resetToken: true,
        resetTokenExpiry: true,
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

    // Se não tiver token, retornar apenas os dados básicos
    if (!token) {
      return NextResponse.json({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        hasPassword: patient.hasPassword,
        hasPortalAccess: patient.hasPortalAccess,
        firstAccess: patient.firstAccess,
        welcomeEmailSent: patient.welcomeEmailSent,
        doctorName: patient.user?.name,
        user: {
          name: patient.user?.name || 'Médico',
          specialty: patient.user?.specialty || 'Especialidade não informada',
          phone: patient.user?.phone || '',
          image: patient.user?.image || null,
          slug: patient.user?.slug || patient.id
        }
      });
    }

    // Verificar se o token é válido
    if (patient.resetToken !== token || !patient.resetTokenExpiry || new Date(patient.resetTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Gerar novo token de acesso
    const accessToken = generateToken(patient.id, 'auth');
    
    // Atualizar token de acesso
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        accessToken,
        accessTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        resetToken: null,
        resetTokenExpiry: null,
        hasPassword: true,
        hasPortalAccess: true
      }
    });

    return NextResponse.json({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      hasPassword: true,
      hasPortalAccess: true,
      firstAccess: false,
      welcomeEmailSent: patient.welcomeEmailSent,
      doctorName: patient.user?.name,
      accessToken,
      user: {
        name: patient.user?.name || 'Médico',
        specialty: patient.user?.specialty || 'Especialidade não informada',
        phone: patient.user?.phone || '',
        image: patient.user?.image || null,
        slug: patient.user?.slug || patient.id
      }
    });

  } catch (error) {
    console.error('Error in patient route:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 