import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePatientAccessToken } from '@/lib/auth';
import { sendPatientConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar paciente pelo email
    const patient = await prisma.patient.findFirst({
      where: { email },
      include: {
        user: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'E-mail não encontrado no sistema. Por favor, verifique o e-mail informado ou entre em contato com seu médico.' },
        { status: 404 }
      );
    }

    // Gerar token de acesso
    const { token, hashedToken } = await generatePatientAccessToken();
    
    // Salvar token no banco
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        accessToken: hashedToken,
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });

    // Gerar link de acesso
    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/${patient.id}?token=${token}`;

    // Enviar email
    try {
      await sendPatientConfirmationEmail({
        to: patient.email,
        patientName: patient.name,
        doctorName: patient.user?.name || 'Médico',
        accessLink
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({ 
      message: 'Link de acesso enviado com sucesso',
      success: true 
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 