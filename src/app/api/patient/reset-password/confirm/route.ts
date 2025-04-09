import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o token é válido
    const patient = await prisma.$queryRaw`
      SELECT id, "resetToken", "resetTokenExpiry"
      FROM "Patient"
      WHERE "resetToken" = ${token}
      AND "resetTokenExpiry" > NOW()
      LIMIT 1
    `;

    if (!patient || !Array.isArray(patient) || patient.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    const patientData = patient[0];

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e limpar token
    await prisma.$executeRaw`
      UPDATE "Patient"
      SET 
        password = ${hashedPassword},
        "hasPassword" = true,
        "resetToken" = NULL,
        "resetTokenExpiry" = NULL
      WHERE id = ${patientData.id}
    `;

    return NextResponse.json({ 
      message: 'Senha definida com sucesso' 
    });

  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Erro ao definir senha' },
      { status: 500 }
    );
  }
} 