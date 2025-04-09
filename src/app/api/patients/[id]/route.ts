import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const id = context.params.id;
    
    // Log para debug
    console.log('ID do paciente:', id);
    
    const data = await req.json();
    
    // Log para debug
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));

    // Validar dados de entrada
    if (!data || typeof data !== 'object') {
      return new NextResponse(
        JSON.stringify({ error: 'Dados inválidos' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (!data.name || !data.email || !data.phone) {
      return new NextResponse(
        JSON.stringify({ error: 'Dados obrigatórios faltando' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ID do paciente é obrigatório' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Verificar se o paciente existe e pertence ao usuário atual
    const patient = await db.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        lead: true,
      },
    });

    // Log para debug
    console.log('Paciente encontrado:', JSON.stringify(patient, null, 2));

    if (!patient) {
      return new NextResponse(
        JSON.stringify({ error: 'Paciente não encontrado' }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Preparar dados para atualização
    const updateData = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      lead: patient.leadId ? {
        update: {
          where: {
            id: patient.leadId
          },
          data: {
            status: data.lead?.status || undefined,
            appointmentDate: data.lead?.appointmentDate ? new Date(data.lead.appointmentDate).toISOString() : null,
            medicalNotes: data.lead?.medicalNotes || null,
          }
        }
      } : undefined
    };

    // Log para debug
    console.log('Dados para atualização:', JSON.stringify(updateData, null, 2));

    // Atualizar o paciente
    const updatedPatient = await db.patient.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        lead: true,
      },
    });

    // Log para debug
    console.log('Paciente atualizado:', JSON.stringify(updatedPatient, null, 2));

    return new NextResponse(
      JSON.stringify(updatedPatient),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    // Log detalhado do erro
    const errorDetails = {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta
    };
    
    console.error('Erro ao atualizar paciente:', errorDetails);

    let errorMessage = 'Erro ao atualizar paciente';
    
    // Tratamento específico para erros do Prisma
    if (error?.code === 'P2002') {
      errorMessage = 'Este email já está em uso por outro paciente';
    } else if (error?.code === 'P2025') {
      errorMessage = 'Paciente não encontrado';
    } else if (error?.name === 'PrismaClientValidationError') {
      if (error.message.includes('appointmentDate')) {
        errorMessage = 'Data da consulta inválida';
      }
    }

    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const id = context.params.id;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ID do paciente é obrigatório' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Verificar se o paciente existe e pertence ao usuário atual
    const patient = await db.patient.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!patient) {
      return new NextResponse(
        JSON.stringify({ error: 'Paciente não encontrado' }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Deletar o paciente e seu lead associado
    await db.patient.delete({
      where: {
        id,
      },
    });

    return new NextResponse(
      JSON.stringify({ message: 'Paciente deletado com sucesso' }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    // Log detalhado do erro
    const errorDetails = {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta
    };
    
    console.error('Erro ao deletar paciente:', errorDetails);

    return new NextResponse(
      JSON.stringify({ 
        error: error?.message || 'Erro ao deletar paciente',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 