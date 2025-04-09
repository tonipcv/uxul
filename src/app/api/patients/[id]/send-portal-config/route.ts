import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Buscar o paciente
    const patient = await db.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token de reset de senha
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar o token no paciente
    await db.patient.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Configurar o transportador de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/reset-password/confirm?token=${resetToken}`;

    // Enviar email com as configurações do portal
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: patient.email,
      subject: 'Acesso ao Portal do Paciente',
      html: `
        <h1>Bem-vindo ao Portal do Paciente</h1>
        <p>Olá ${patient.name},</p>
        <p>Seu acesso ao portal do paciente foi configurado com sucesso.</p>
        <p>Para definir sua senha e acessar o portal, clique no link abaixo:</p>
        <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #1a365d; color: white; text-decoration: none; border-radius: 5px;">Definir Senha</a></p>
        <p>Se o botão acima não funcionar, copie e cole este link no seu navegador:</p>
        <p>${resetLink}</p>
        <p><strong>Importante:</strong> Este link é válido por 24 horas.</p>
        <p>Após definir sua senha, você poderá acessar o portal através do link: <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient/login">Portal do Paciente</a></p>
      `,
    });

    // Atualizar o status de acesso ao portal do paciente
    await db.patient.update({
      where: { id },
      data: { hasPortalAccess: true },
    });

    return NextResponse.json(
      { message: 'Configurações do portal enviadas com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao enviar configurações do portal:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar configurações do portal' },
      { status: 500 }
    );
  }
} 