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
export async function GET(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    console.log('[API] GET /api/leads: Iniciando busca para userId:', userId);
    
    if (!userId) {
      console.log('[API] Erro: Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Tentar usar o modelo Prisma primeiro
    try {
      const leads = await prisma.lead.findMany({
        where: { userId }, // Filtrar apenas os leads do usuário atual
        orderBy: { createdAt: 'desc' },
        include: {
          indication: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      });
      
      console.log(`[API] Encontrados ${leads.length} leads através do modelo Prisma para o usuário ${userId}`);
      return NextResponse.json({ success: true, data: leads });
    } catch (modelError) {
      console.error('[API] Erro ao usar modelo Prisma:', modelError);
      
      // Fallback para SQL direto
      const results = await db.$queryRaw`
        SELECT l.*, i."name" as "indicationName", i."slug" as "indicationSlug" 
        FROM "Lead" l
        LEFT JOIN "Indication" i ON l."indicationId" = i.id
        WHERE l."userId" = ${userId}
        ORDER BY l."createdAt" DESC
      `;
      
      console.log(`[API] Encontrados ${Array.isArray(results) ? results.length : 0} leads com SQL direto para o usuário ${userId}`);
      return NextResponse.json({ success: true, data: results });
    }
  } catch (error) {
    console.error('[API] Erro ao buscar leads:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar leads', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
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