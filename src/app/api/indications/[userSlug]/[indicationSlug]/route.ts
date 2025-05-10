import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string, indicationSlug: string } }
) {
  try {
    const { userSlug, indicationSlug } = params;

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

    // Buscar a indicação pelo slug
    const indication = await prisma.indication.findFirst({
      where: {
        slug: indicationSlug,
        userId: user.id
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: "Indicação não encontrada" },
        { status: 404 }
      );
    }

    // Registrar visualização (evento)
    await prisma.event.create({
      data: {
        type: 'LINK_VIEW',
        userId: user.id,
        indicationId: indication.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(indication);
  } catch (error) {
    console.error('Erro ao buscar indicação:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 