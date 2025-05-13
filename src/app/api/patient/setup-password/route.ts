import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export async function POST(request: NextRequest) {
  try {
    const { email, password, token } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a senha tem pelo menos 8 caracteres
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar o paciente
    const patient = await prisma.patient.findFirst({
      where: { 
        email,
        OR: [
          { hasPassword: false },
          { 
            AND: [
              { resetToken: { not: null } },
              { resetTokenExpiry: { gt: new Date() } }
            ]
          }
        ]
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Email não encontrado ou senha já definida. Use a opção "Esqueci minha senha" se precisar redefini-la.' },
        { status: 404 }
      );
    }

    // Se um token foi fornecido, validar
    if (token && patient.resetToken) {
      if (token !== patient.resetToken || !patient.resetTokenExpiry || new Date() > patient.resetTokenExpiry) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 400 }
        );
      }
    }

    // Hash da nova senha
    const hashedPassword = await hash(password, 12);

    // Gerar JWT token para autenticação
    const authToken = sign(
      { 
        id: patient.id,
        email: patient.email,
        type: 'patient'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Atualizar o paciente com a nova senha
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        password: hashedPassword,
        hasPassword: true,
        firstAccess: false,
        resetToken: null,
        resetTokenExpiry: null,
        hasPortalAccess: true
      }
    });

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso'
    });

    // Configurar cookie de autenticação
    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    return response;

  } catch (error) {
    console.error('Erro ao definir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 