import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Buscar opções de interesse de um usuário pelo slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userSlug = slug;
    
    if (!userSlug) {
      return NextResponse.json(
        { error: 'Slug do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar as opções de interesse do usuário
    const interestOptions = await prisma.interestOption.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        label: true,
        value: true,
        redirectUrl: true,
        isDefault: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(interestOptions);
  } catch (error) {
    console.error('Erro ao buscar opções de interesse pelo slug:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar opções de interesse' },
      { status: 500 }
    );
  }
} 