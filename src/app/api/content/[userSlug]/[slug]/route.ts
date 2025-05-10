import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string, slug: string } }
) {
  try {
    const { userSlug, slug } = params;

    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Primeiro tentar encontrar uma página
    const page = await prisma.page.findFirst({
      where: {
        slug,
        userId: user.id
      },
      include: {
        blocks: {
          orderBy: {
            order: 'asc',
          },
        },
        socialLinks: true,
      },
    });

    if (page) {
      // Registrar visualização
      await prisma.event.create({
        data: {
          type: 'PAGE_VIEW',
          userId: user.id,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        type: 'page',
        content: page
      });
    }

    // Se não encontrou página, tentar encontrar indicação
    const indication = await prisma.indication.findFirst({
      where: {
        slug,
        userId: user.id
      }
    });

    if (indication) {
      // Registrar visualização
      await prisma.event.create({
        data: {
          type: 'LINK_VIEW',
          userId: user.id,
          indicationId: indication.id,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        type: 'indication',
        content: indication
      });
    }

    // Se não encontrou nem página nem indicação
    return NextResponse.json(
      { error: "Conteúdo não encontrado" },
      { status: 404 }
    );

  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 