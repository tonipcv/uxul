import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const pipelines = await prisma.pipeline.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('Erro ao buscar pipelines:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description: description || '',
        userId: session.user.id
      }
    });

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Erro ao criar pipeline:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pipeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'ID do pipeline é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se o pipeline pertence ao usuário
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      select: { userId: true }
    });

    if (!pipeline || pipeline.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Pipeline não encontrado' },
        { status: 404 }
      );
    }

    // Remove o pipeline e atualiza os leads associados
    await prisma.$transaction([
      prisma.lead.updateMany({
        where: { pipelineId },
        data: { pipelineId: null }
      }),
      prisma.pipeline.delete({
        where: { id: pipelineId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir pipeline:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir pipeline' },
      { status: 500 }
    );
  }
} 