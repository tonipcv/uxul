import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    // Se não tiver userId como parâmetro, usar o userId da sessão
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou ID não fornecido' },
        { status: 401 }
      );
    }

    // Se o usuário estiver tentando acessar dados de outro usuário sem ser admin
    if (userId && userId !== session?.user?.id) {
      // Verificar se o usuário atual tem permissão (implementar lógica de admins se necessário)
      // Por enquanto, só permitimos acessar os próprios leads
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Buscar os leads do usuário
    const leads = await prisma.lead.findMany({
      where: { 
        userId: targetUserId 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Adicionar endpoint PATCH para atualizar campos do lead
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const data = await req.json();

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    // Obter a sessão atual
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar o lead para verificar se pertence ao usuário
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    if (lead.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        name: data.name,
        phone: data.phone,
        interest: data.interest,
        status: data.status,
        potentialValue: data.potentialValue,
        appointmentDate: data.appointmentDate,
        medicalNotes: data.medicalNotes
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 