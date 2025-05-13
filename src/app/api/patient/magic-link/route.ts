import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePatientAccessToken } from '@/lib/auth';
import { sendPatientConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('Buscando paciente pelo email:', email);
    // Buscar paciente pelo email
    const patient = await prisma.patient.findFirst({
      where: { email },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!patient) {
      console.log('Paciente não encontrado:', email);
      return NextResponse.json(
        { error: 'E-mail não encontrado. Verifique se este é o email cadastrado pelo seu médico.' },
        { status: 404 }
      );
    }

    console.log('Paciente encontrado, gerando token de acesso');
    // Gerar token de acesso
    const { token, hashedToken } = await generatePatientAccessToken();
    
    console.log('Salvando token no banco');
    // Salvar token no banco
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        accessToken: hashedToken,
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        hasPortalAccess: true
      }
    });

    // Gerar link de acesso
    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/access/verify?token=${encodeURIComponent(token)}&id=${encodeURIComponent(patient.id)}`;

    console.log('Enviando email de confirmação');
    // Enviar email
    try {
      await sendPatientConfirmationEmail({
        to: patient.email,
        patientName: patient.name,
        doctorName: patient.user?.name || 'Médico',
        accessLink
      });
      console.log('Email enviado com sucesso');
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Reverter as alterações no banco de dados
      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          accessToken: null,
          accessTokenExpiry: null,
          hasPortalAccess: false
        }
      });
      throw emailError;
    }

    return NextResponse.json({ 
      message: 'Link de acesso enviado com sucesso',
      success: true 
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Por favor, tente novamente mais tarde.' },
      { status: 500 }
    );
  }
} 