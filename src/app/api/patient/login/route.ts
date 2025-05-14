import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('1. Iniciando login de paciente');
    
    const body = await request.json();
    console.log('2. Body recebido:', { email: body.email });
    
    const { email, password } = body;

    if (!email || !password) {
      console.log('3. Campos obrigatórios faltando');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('4. Buscando paciente');
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

    console.log('5. Resultado da busca:', { 
      found: !!patient,
      hasPassword: patient?.hasPassword,
      hasPasswordField: !!patient?.password 
    });

    if (!patient || !patient.hasPassword || !patient.password) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    console.log('6. Verificando senha');
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, patient.password);
    console.log('7. Senha válida:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    console.log('8. Gerando token');
    const token = await sign(
      {
        id: patient.id,
        email: patient.email,
        type: 'patient'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('9. Criando resposta');
    const response = NextResponse.json({
      success: true,
      data: {
        id: patient.id,
      name: patient.name,
      email: patient.email,
        doctor: patient.user ? {
          name: patient.user.name,
          specialty: patient.user.specialty,
          phone: patient.user.phone,
          image: patient.user.image,
          slug: patient.user.slug
        } : null
      }
    });

    console.log('10. Configurando cookie');
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    console.log('11. Retornando resposta');
    return response;

  } catch (error) {
    console.error('Error in patient login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
} 