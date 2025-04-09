import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Verificar se a variável de ambiente JWT_SECRET está definida
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log('Tentativa de login para:', email);

    if (!email || !password) {
      console.log('Email ou senha não fornecidos');
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
            slug: true
          }
        }
      }
    });

    if (!patient) {
      console.log('Paciente não encontrado');
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o paciente tem senha definida
    if (!patient.hasPassword || !patient.password) {
      console.log('Paciente sem senha definida');
      return NextResponse.json(
        { error: 'Conta sem senha definida. Por favor, solicite um link de acesso por email.' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordValid = await compare(password, patient.password);
    if (!passwordValid) {
      console.log('Senha incorreta');
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Criar sessão usando NextAuth
    const session = await getServerSession(authOptions);
    
    // Gerar JWT
    const token = sign(
      {
        id: patient.id,
        email: patient.email,
        name: patient.name,
        type: 'patient'
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token válido por 7 dias
    );

    console.log('Login bem-sucedido para:', email);
    console.log('ID do paciente:', patient.id);

    // Retornar dados necessários para o frontend
    const response = NextResponse.json({
      success: true,
      patientId: patient.id,
      session: {
        user: {
          id: patient.id,
          email: patient.email,
          name: patient.name,
          type: 'patient'
        }
      }
    });

    // Definir cookie
    response.cookies.set({
      name: 'patient_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Erro ao autenticar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar paciente' },
      { status: 500 }
    );
  }
} 