import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Lista leads do usuário com opções de filtro e ordenação
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para buscar por nome, email ou telefone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, converted, lost]
 *         description: Filtrar por status do lead
 *       - in: query
 *         name: indication
 *         schema:
 *           type: string
 *         description: ID da indicação para filtrar
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de registros por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, status]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de leads obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login novamente.' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    console.log('Buscando leads para usuário:', session.user.id, 'pipelineId:', pipelineId);

    const leads = await prisma.lead.findMany({
      where: {
        userId: session.user.id,
        pipelineId: pipelineId || undefined,
        status: {
          not: 'Removido'
        }
      },
      include: {
        indication: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Leads encontrados:', leads.length);
    return new NextResponse(JSON.stringify(leads), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro detalhado ao buscar leads:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao buscar leads' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   put:
 *     summary: Atualiza o status de um ou mais leads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, converted, lost]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
export async function PUT(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const { ids, status } = await req.json();

    // Validar dados
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs de leads inválidos' },
        { status: 400 }
      );
    }

    if (!status || !['new', 'contacted', 'converted', 'lost'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar se todos os leads pertencem ao usuário
    const count = await prisma.lead.count({
      where: {
        id: { in: ids },
        userId: session.user.id
      }
    });

    if (count !== ids.length) {
      return NextResponse.json(
        { error: 'Um ou mais leads não pertencem ao usuário' },
        { status: 403 }
      );
    }

    // Atualizar o status dos leads
    const updatedLeads = await prisma.lead.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id
      },
      data: {
        status
      }
    });

    return NextResponse.json({
      success: true,
      count: updatedLeads.count,
      message: `Status de ${updatedLeads.count} lead(s) atualizado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao atualizar status de leads:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Adicionar endpoint PATCH para atualizar campos do lead
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const body = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se o lead pertence ao usuário
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { userId: true }
    });

    if (!lead || lead.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads:
 *   delete:
 *     summary: Exclui um lead específico
 *     parameters:
 *       - in: query
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead a ser excluído
 *     responses:
 *       200:
 *         description: Lead excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Lead não encontrado
 */
export async function DELETE(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Obter o ID do lead da URL
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e pertence ao usuário
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId: session.user.id
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o lead
    await prisma.lead.delete({
      where: { id: leadId }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lead' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      phone, 
      email,
      referralId
    } = body;

    // Validação dos campos obrigatórios
    if (!name || !phone || !referralId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, phone, referralId' },
        { status: 400 }
      );
    }

    // Buscar a referência
    const referral = await prisma.patientReferral.findUnique({
      where: { id: referralId },
      include: {
        page: {
          select: {
            userId: true
          }
        },
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referência não encontrada' },
        { status: 404 }
      );
    }

    // Obter IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Criar o lead usando o userId da página
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        userId: referral.page.userId,
        source: 'REFERRAL',
      }
    });

    // Incrementar contador de leads
    await prisma.patientReferral.update({
      where: { id: referralId },
      data: { leads: { increment: 1 } }
    });

    // Registrar o evento de lead
    await prisma.event.create({
      data: {
        type: 'REFERRAL_LEAD',
        userId: referral.page.userId,
        ip: ip.toString(),
        userAgent,
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 