import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { signIn } from 'next-auth/react';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export async function POST(request: Request) {
  try {
    console.log('1. Iniciando registro de paciente');
    
    const body = await request.json();
    console.log('2. Body recebido:', body);
    
    const { name, email, phone, password } = body;

    // Validar campos obrigatórios
    if (!name || !email || !phone || !password) {
      console.log('3. Campos obrigatórios faltando:', { name, email, phone, password });
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('4. Verificando email existente:', email);
    // Verificar se o email já está em uso
    const existingPatient = await prisma.patient.findFirst({
      where: { email }
    });

    if (existingPatient) {
      console.log('5. Email já cadastrado');
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    console.log('6. Gerando hash da senha');
    // Hash da senha antes de salvar
    const hashedPassword = await hash(password, 10);

    console.log('7. Criando paciente');
    // Criar o paciente
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        hasPassword: true,
        password: hashedPassword
      }
    });

    console.log('8. Paciente criado:', patient.id);

    // Fazer login automaticamente após o registro
    const response = NextResponse.json({
      success: true,
      data: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      }
    });

    return response;
  } catch (error) {
    console.error('Erro detalhado ao registrar paciente:', error);
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erro ao registrar paciente' },
      { status: 500 }
    );
  }
} 