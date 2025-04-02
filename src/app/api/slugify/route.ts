import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função auxiliar para converter texto em slug
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove espaços
    .replace(/[^\w\-]+/g, '') // Remove caracteres não alfanuméricos
    .replace(/\-\-+/g, '-'); // Remove múltiplos hífens
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    // Validação dos campos obrigatórios
    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, name' },
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

    // Gerar slug base
    let baseSlug = slugify(name);
    if (!baseSlug) {
      baseSlug = 'indication'; // Fallback se o nome não gerar um slug válido
    }

    // Verificar se o slug já existe
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    // Tentar até encontrar um slug único
    while (slugExists) {
      const existingIndication = await prisma.indication.findFirst({
        where: {
          userId,
          slug,
        }
      });

      if (!existingIndication) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('Erro ao gerar slug:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 