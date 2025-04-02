import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar todas as indicações do usuário com contagens de eventos e leads
    const indications = await prisma.indication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(indications);
  } catch (error) {
    console.error('Erro ao buscar indicações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, slug, name } = body;

    // Validação dos campos obrigatórios
    if (!userId || !slug) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, slug' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma indicação com o mesmo slug para este usuário
    const existingIndication = await prisma.indication.findFirst({
      where: {
        userId,
        slug
      }
    });

    if (existingIndication) {
      return NextResponse.json(
        { error: 'Já existe uma indicação com este slug' },
        { status: 409 }
      );
    }

    // Criar a indicação
    const indication = await prisma.indication.create({
      data: {
        userId,
        slug,
        name
      }
    });

    return NextResponse.json(indication, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 