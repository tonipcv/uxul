import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { patientId, token } = await request.json();

    if (!patientId || !token) {
      return NextResponse.json(
        { error: 'ID do paciente e token são obrigatórios' },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        accessToken: true,
        accessTokenExpiry: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    if (!patient.accessToken || !patient.accessTokenExpiry) {
      return NextResponse.json(
        { error: 'Token de acesso não encontrado' },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (new Date() > patient.accessTokenExpiry) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      );
    }

    // Verificar se o token corresponde
    const isValid = await compare(token, patient.accessToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Token válido, retornar sucesso
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json(
      { error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
} 