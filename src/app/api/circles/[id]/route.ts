import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    // Extrair o "id" a partir da URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    // O ID será o último segmento da rota "/api/circles/[id]"
    const idString = segments[segments.length - 1];

    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Ler o body da requisição
    const body = await request.json();
    const { clicks } = body;

    // Atualizar registro no Prisma
    const circle = await prisma.circle.update({
      where: { id },
      data: { clicks },
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update circle' },
      { status: 500 }
    );
  }
}
