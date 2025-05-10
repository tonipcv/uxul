import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug do médico é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        specialty: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 