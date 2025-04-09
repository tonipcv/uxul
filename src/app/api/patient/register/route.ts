import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    // Validar campos obrigatórios
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso
    const existingPatient = await prisma.patient.findFirst({
      where: { email }
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha antes de salvar
    const hashedPassword = await hash(password, 10);

    // Criar o paciente (sem associação a médico ainda)
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        hasPassword: true,
        // Ao se cadastrar diretamente, o paciente não tem um médico associado ainda
        userId: process.env.DEFAULT_DOCTOR_ID || '', // ID de um médico padrão ou vazio
      }
    });

    // Remover a senha da resposta
    const { password: _, ...patientWithoutPassword } = patient;

    return NextResponse.json(patientWithoutPassword);
  } catch (error) {
    console.error('Erro ao registrar paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar paciente' },
      { status: 500 }
    );
  }
} 