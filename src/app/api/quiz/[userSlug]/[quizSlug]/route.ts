import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string, quizSlug: string } }
) {
  try {
    const { userSlug, quizSlug } = params;
    console.log(`API - Recebendo solicitação para página: userSlug=${userSlug}, slug=${quizSlug}`);

    // Find the user by slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug },
      select: {
        id: true,
        name: true,
        specialty: true,
        image: true,
        slug: true
      }
    });

    if (!user) {
      console.log(`API - Usuário não encontrado: ${userSlug}`);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log(`API - Usuário encontrado: ${user.name} (${user.id})`);

    // Find the indication by slug
    const indication = await prisma.indication.findFirst({
      where: {
        slug: quizSlug,
        userId: user.id
      }
    });

    if (!indication) {
      console.log(`API - Página não encontrada: ${quizSlug}`);
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      );
    }

    console.log(`API - Indicação encontrada: ${indication.id}`);

    // Register view event
    await prisma.event.create({
      data: {
        type: 'PAGE_VIEW',
        userId: user.id,
        indicationId: indication.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Prepare response data
    const responseData = { 
      ...indication,
      user: user
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar página:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 