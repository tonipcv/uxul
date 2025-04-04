import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/leads/{id}/notes:
 *   post:
 *     summary: Adiciona ou atualiza anotações médicas em um lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicalNotes:
 *                 type: string
 *                 description: Anotações médicas ou informações clínicas sobre o lead
 *     responses:
 *       200:
 *         description: Anotações adicionadas com sucesso
 *       404:
 *         description: Lead não encontrado
 *       401:
 *         description: Não autorizado
 */
export async function POST(
  req: NextRequest,
  { params }
) {
  try {
    const id = params.id;
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const { medicalNotes } = await req.json();

    if (typeof medicalNotes !== 'string') {
      return NextResponse.json(
        { error: 'Anotações médicas devem ser fornecidas como texto' },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e pertence ao usuário
    const leadExists = await prisma.lead.findUnique({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar anotações médicas do lead
    const updatedLead = await prisma.lead.update({
      where: {
        id
      },
      data: {
        medicalNotes,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Anotações médicas adicionadas com sucesso',
      data: {
        id: updatedLead.id,
        medicalNotes: updatedLead.medicalNotes
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar anotações médicas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/leads/{id}/notes:
 *   get:
 *     summary: Obtém as anotações médicas de um lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Anotações médicas obtidas com sucesso
 *       404:
 *         description: Lead não encontrado
 *       401:
 *         description: Não autorizado
 */
export async function GET(
  req: NextRequest,
  { params }
) {
  try {
    const id = params.id;
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar lead com foco apenas nas anotações médicas
    const lead = await prisma.lead.findUnique({
      where: {
        id,
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        medicalNotes: true,
        updatedAt: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: lead.id,
      name: lead.name,
      medicalNotes: lead.medicalNotes || '',
      lastUpdated: lead.updatedAt
    });
  } catch (error) {
    console.error('Erro ao buscar anotações médicas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 