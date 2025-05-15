import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('[GET /api/patients] Session:', session);

    if (!session?.user?.id) {
      console.log('[GET /api/patients] No user session');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('[GET /api/patients] Fetching patients for user:', session.user.id);
    
    // Buscar pacientes com dados mínimos necessários
    const patients = await db.patient.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        lead: {
          select: {
            status: true,
            appointmentDate: true,
            medicalNotes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[GET /api/patients] Found patients:', patients);

    // Retornar array diretamente, sem wrapper
    return NextResponse.json(patients);
  } catch (error) {
    console.error('[GET /api/patients] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacientes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Sessão:", session);

    if (!session?.user?.id) {
      console.log("Usuário não autenticado");
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log("Dados recebidos:", data);
    const { name, email, phone, lead, hasPortalAccess } = data;

    // Validar campos obrigatórios
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nome, email e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o email é o mesmo do usuário logado
    if (email === session.user.email) {
      return NextResponse.json(
        { error: 'Não é possível usar o mesmo email do médico para o paciente' },
        { status: 400 }
      );
    }

    // Verificar se já existe um paciente com este email
    const existingPatient = await db.patient.findFirst({
      where: {
        userId: session.user.id,
        email,
      },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Já existe um paciente com este email' },
        { status: 409 }
      );
    }

    // Primeiro criamos o lead
    console.log("Criando lead...");
    const newLead = await db.lead.create({
      data: {
        name,
        phone,
        status: lead?.status || 'Novo',
        appointmentDate: lead?.appointmentDate ? new Date(lead.appointmentDate) : null,
        medicalNotes: lead?.medicalNotes || null,
        userId: session.user.id,
      }
    });
    console.log("Lead criado:", newLead.id);

    // Depois criamos o paciente conectando ao lead
    console.log("Criando paciente...");
    const patient = await db.patient.create({
      data: {
        name,
        email,
        phone,
        userId: session.user.id,
        leadId: newLead.id,
        hasPortalAccess: hasPortalAccess || false
      },
      include: {
        lead: true,
      }
    });
    console.log("Paciente criado:", patient.id);

    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    
    // Verificar se é um erro de unique constraint do Prisma (email duplicado)
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes("Unique constraint failed") && errorMessage.includes("email")) {
        return NextResponse.json(
          { error: 'Já existe um paciente com este email' },
          { status: 409 } // 409 Conflict é usado para conflitos de recurso
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar paciente' },
      { status: 500 }
    );
  }
}
