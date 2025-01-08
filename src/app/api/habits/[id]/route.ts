import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Extrair o "id" a partir da URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    // O ID será o último segmento em "/api/habits/[id]"
    const idString = segments[segments.length - 1];
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Excluir o habit pelo Prisma
    await prisma.habit.delete({
      where: { id }
    });

    // Resposta sem conteúdo indicando sucesso
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
