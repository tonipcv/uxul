import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    await prisma.factEntry.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      message: `${ids.length} registros excluídos com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao excluir registros:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir registros' },
      { status: 500 }
    );
  }
} 