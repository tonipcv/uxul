import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { generateToken } from '@/lib/auth-patient';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
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

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar paciente pelo email usando query raw
    const patient = await prisma.$queryRaw`
      SELECT id, name, email
      FROM "Patient"
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!patient || !Array.isArray(patient) || patient.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum paciente encontrado com este email' },
        { status: 404 }
      );
    }

    const patientData = patient[0];

    // Gerar token de reset
    const resetToken = generateToken(patientData.id, 'reset');
    
    // Salvar token no banco
    await prisma.$executeRaw`
      UPDATE "Patient"
      SET "resetToken" = ${resetToken},
          "resetTokenExpiry" = NOW() + INTERVAL '1 hour'
      WHERE id = ${patientData.id}
    `;

    // Enviar email
    await sendPasswordResetEmail({
      to: patientData.email,
      name: patientData.name,
      resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/patient/reset-password/confirm?token=${resetToken}`
    });

    return NextResponse.json({ 
      message: 'Email de recuperação enviado com sucesso' 
    });

  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de recuperação de senha' },
      { status: 500 }
    );
  }
} 