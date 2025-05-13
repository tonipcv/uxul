import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { patientId, token } = await request.json();

    if (!patientId || !token) {
      return NextResponse.json(
        { error: 'ID do paciente e token são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('Validando token para paciente:', patientId);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
      select: {
            name: true,
            specialty: true,
            slug: true
          }
        }
      }
    });

    if (!patient) {
      console.log('Paciente não encontrado:', patientId);
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    if (!patient.accessToken || !patient.accessTokenExpiry) {
      console.log('Token de acesso não encontrado para paciente:', patientId);
      return NextResponse.json(
        { error: 'Token de acesso não encontrado' },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (new Date() > patient.accessTokenExpiry) {
      console.log('Token expirado para paciente:', patientId);
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      );
    }

    // Hash do token recebido para comparação
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Verificar se o token corresponde
    const isValid = hashedToken === patient.accessToken;
    
    console.log('Validação do token:', isValid ? 'sucesso' : 'falha');

    if (!isValid) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Token válido, retornar dados do paciente
    const { accessToken, accessTokenExpiry, password, ...patientData } = patient;
    return NextResponse.json({ 
      success: true,
      patient: {
        ...patientData,
        redirectUrl: `/patient/${patientData.id}?token=${token}`
      }
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json(
      { error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
} 