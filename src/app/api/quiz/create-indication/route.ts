import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Parâmetros do request
    const { quizId, customSlug } = await request.json();

    if (!quizId) {
      return NextResponse.json(
        { error: 'ID do quiz é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o quiz existe e pertence ao usuário
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Buscar o usuário para obter o slug
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        slug: true,
        email: true
      }
    });

    // Determinar o slug do usuário
    const userSlug = user?.slug || session.user.userSlug || user?.email?.split('@')[0] || 'user';

    // Determinar o slug para a indicação
    let indicationSlug = customSlug;
    
    // Se não tiver um slug customizado, usar o nome do quiz
    if (!indicationSlug) {
      indicationSlug = quiz.name 
        ? quiz.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : 'questionario';
    }

    // Verificar se já existe uma indicação com esse slug
    const existingIndication = await prisma.indication.findFirst({
      where: {
        slug: indicationSlug,
        userId: session.user.id
      }
    });

    if (existingIndication) {
      // Se a indicação já existir, verificar se já está associada a um quiz
      if (existingIndication.quizId) {
        // Se já estiver associada ao mesmo quiz, retornar sucesso
        if (existingIndication.quizId === quizId) {
          return NextResponse.json({
            success: true,
            message: 'Indicação já existe e está associada a este quiz',
            indication: existingIndication,
            link: `/quiz/${userSlug}/${indicationSlug}`
          });
        }
        
        // Se estiver associada a outro quiz, adicionar um sufixo numérico
        let uniqueSlug = indicationSlug;
        let counter = 1;
        
        while (true) {
          uniqueSlug = `${indicationSlug}-${counter}`;
          
          const checkIndication = await prisma.indication.findFirst({
            where: {
              slug: uniqueSlug,
              userId: session.user.id
            }
          });
          
          if (!checkIndication) break;
          counter++;
        }
        
        indicationSlug = uniqueSlug;
      } else {
        // Se a indicação existir mas não estiver associada a um quiz, atualizar
        const updatedIndication = await prisma.indication.update({
          where: { id: existingIndication.id },
          data: {
            quizId,
            type: 'quiz',
            fullLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${userSlug}/${indicationSlug}`
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Indicação existente atualizada com sucesso',
          indication: updatedIndication,
          link: `/quiz/${userSlug}/${indicationSlug}`
        });
      }
    }

    // Criar uma nova indicação
    const newIndication = await prisma.indication.create({
      data: {
        userId: session.user.id,
        quizId,
        slug: indicationSlug,
        name: quiz.name || 'Questionário',
        type: 'quiz',
        fullLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${userSlug}/${indicationSlug}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Indicação criada com sucesso',
      indication: newIndication,
      link: `/quiz/${userSlug}/${indicationSlug}`
    });
  } catch (error) {
    console.error('Erro ao criar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar indicação', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 