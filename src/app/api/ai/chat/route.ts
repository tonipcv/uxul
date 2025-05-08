import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não fornecida' },
        { status: 400 }
      );
    }

    // Buscar dados do usuário para contextualizar a IA
    const userData = await prisma.user.findUnique({
      where: { 
        id: session.user.id 
      },
      select: {
        name: true,
        specialty: true,
        patients: {
          include: {
            lead: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Últimos 10 pacientes
        },
        leads: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Últimos 10 leads
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar o contexto para a IA
    const context = {
      doctor: {
        name: userData.name,
        specialty: userData.specialty,
      },
      recentPatients: userData.patients.map(p => ({
        name: p.name,
        status: p.lead?.status,
        appointmentDate: p.lead?.appointmentDate,
        medicalNotes: p.lead?.medicalNotes,
      })),
      recentLeads: userData.leads.map(l => ({
        status: l.status,
        appointmentDate: l.appointmentDate,
        createdAt: l.createdAt,
      }))
    };

    // Construir o prompt para a IA
    const prompt = `
Você é um assistente médico AI especializado em análise de dados de pacientes e leads.
Contexto atual:
- Médico: ${context.doctor.name} (${context.doctor.specialty})
- Últimos pacientes: ${JSON.stringify(context.recentPatients, null, 2)}
- Últimos leads: ${JSON.stringify(context.recentLeads, null, 2)}

Pergunta do médico: ${message}

Por favor, forneça uma análise profissional e sugestões baseadas nos dados disponíveis.
Mantenha um tom profissional e focado em ações práticas.
`;

    // Fazer a chamada para a API do OpenAI
    const response = await fetch('https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro na chamada da API do OpenAI');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].text.trim();

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
} 