import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

// Verificar se a variável de ambiente JWT_SECRET está definida
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar paciente pelo email
    const patient = await prisma.patient.findFirst({
      where: { email },
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
      console.log('Login attempt failed: Email not found', { email });
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verificar se o paciente tem senha definida
    if (!patient.hasPassword || !patient.password) {
      console.log('Login attempt failed: No password set', { email });
      return NextResponse.json(
        { error: 'Senha não definida. Por favor, use o link de primeiro acesso.' },
        { status: 401 }
      );
    }

    // Verificar se o paciente tem acesso ao portal
    if (!patient.hasPortalAccess) {
      console.log('Login attempt failed: No portal access', { email });
      return NextResponse.json(
        { error: 'Acesso ao portal não autorizado. Entre em contato com seu médico.' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isValidPassword = await compare(password, patient.password);
    if (!isValidPassword) {
      console.log('Login attempt failed: Invalid password', { email });
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = sign(
      { 
        id: patient.id,
        email: patient.email,
        type: 'patient'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Criar resposta com cookie
    const response = NextResponse.json({
      patientId: patient.id,
      name: patient.name,
      email: patient.email,
      hasPassword: patient.hasPassword,
      hasPortalAccess: patient.hasPortalAccess,
      firstAccess: patient.firstAccess,
      doctorName: patient.user?.name,
      user: {
        name: patient.user?.name || 'Médico',
        specialty: patient.user?.specialty || 'Especialidade não informada',
        phone: patient.user?.phone || '',
        image: patient.user?.image || null,
        slug: patient.user?.slug || patient.id
      }
    });

    // Configurar cookie de autenticação
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    return response;

  } catch (error) {
    console.error('Error in patient login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
} 