import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    // Buscar o paciente
    const patient = await db.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token de acesso
    const accessToken = randomBytes(32).toString('hex');
    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar o token no paciente
    await db.patient.update({
      where: { id },
      data: {
        resetToken: accessToken,
        resetTokenExpiry: accessTokenExpiry,
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

    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/reset-password/confirm?token=${accessToken}`;

    // Enviar email com as configurações do portal
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: patient.email,
      subject: 'Acesso ao Portal do Paciente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d; text-align: center;">Bem-vindo ao Portal do Paciente</h1>
          
          <p>Olá ${patient.name},</p>
          
          <p>Seu médico, Dr(a). ${patient.user?.name || 'Médico'}, configurou seu acesso ao portal do paciente.</p>
          
          <p>Para acessar o portal e definir sua senha, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessLink}" 
               style="background-color: #1a365d; 
                      color: white; 
                      text-decoration: none; 
                      padding: 12px 24px; 
                      border-radius: 6px;
                      font-weight: bold;
                      display: inline-block;">
              Configurar Minha Senha
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Se o botão acima não funcionar, copie e cole este link no seu navegador:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${accessLink}</p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
            <p style="color: #475569; margin: 0;"><strong>Importante:</strong></p>
            <ul style="color: #475569; margin: 10px 0;">
              <li>Este link é válido por 24 horas</li>
              <li>Por segurança, crie uma senha forte</li>
              <li>Não compartilhe este email com ninguém</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Após configurar sua senha, você poderá acessar o portal através do link: 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient/login" style="color: #1a365d;">Portal do Paciente</a>
          </p>
        </div>
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