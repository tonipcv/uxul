import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from "next-auth/jwt";

/**
 * @swagger
 * /api/indications/{slug}:
 *   get:
 *     summary: Obtém detalhes de uma indicação específica
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes da indicação obtidos com sucesso
 *       404:
 *         description: Indicação não encontrada
 *       401:
 *         description: Não autorizado
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { slug } = context.params;

    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar a indicação pelo slug
    const indication = await prisma.indication.findFirst({
      where: {
        slug,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            events: {
              where: { type: 'click' }
            },
            leads: true
          }
        }
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Buscar mais estatísticas detalhadas
    // Obter número de cliques por dia nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clickStats = await prisma.event.groupBy({
      by: ['createdAt'],
      where: {
        indicationId: indication.id,
        type: 'click',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        _all: true
      }
    });

    // Buscar leads gerados por esta indicação
    const leads = await prisma.lead.findMany({
      where: {
        indicationId: indication.id
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limitar a 10 leads recentes
    });

    return NextResponse.json({
      ...indication,
      clickStats,
      recentLeads: leads
    });
  } catch (error) {
    console.error('Erro ao buscar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/indications/{slug}:
 *   put:
 *     summary: Atualiza uma indicação específica
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Indicação atualizada com sucesso
 *       404:
 *         description: Indicação não encontrada
 *       401:
 *         description: Não autorizado
 */
export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const { slug } = context.params;
    const { name } = await request.json();

    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se a indicação existe e pertence ao usuário
    const existingIndication = await prisma.indication.findFirst({
      where: {
        slug,
        userId: session.user.id
      }
    });

    if (!existingIndication) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar a indicação
    const updatedIndication = await prisma.indication.update({
      where: {
        id: existingIndication.id
      },
      data: {
        name
      }
    });

    return NextResponse.json(updatedIndication);
  } catch (error) {
    console.error('Erro ao atualizar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/indications/{slug}:
 *   delete:
 *     summary: Exclui uma indicação específica
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Indicação excluída com sucesso
 *       404:
 *         description: Indicação não encontrada
 *       401:
 *         description: Não autorizado
 */
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { slug } = context.params;

    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se a indicação existe e pertence ao usuário
    const indication = await prisma.indication.findFirst({
      where: {
        slug,
        userId: session.user.id
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Excluir eventos relacionados primeiro
    await prisma.event.deleteMany({
      where: { indicationId: indication.id }
    });

    // Excluir leads relacionados
    await prisma.lead.deleteMany({
      where: { indicationId: indication.id }
    });

    // Excluir a indicação
    await prisma.indication.delete({
      where: { id: indication.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Indicação excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir indicação' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const indication = await prisma.indication.findFirst({
    where: { slug: params.slug },
  });

  if (!indication) {
    return NextResponse.json({ error: "Indication not found" }, { status: 404 });
  }

  await prisma.event.create({
    data: {
      type: "INDICATION_SHARED",
      userId: token.sub as string,
      indicationId: indication.id,
    },
  });

  return NextResponse.json({ success: true });
} 