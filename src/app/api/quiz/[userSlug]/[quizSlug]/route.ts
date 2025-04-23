import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string, quizSlug: string } }
) {
  try {
    const { userSlug, quizSlug } = params;
    console.log(`API - Recebendo solicitação para quiz: userSlug=${userSlug}, quizSlug=${quizSlug}`);

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

    // Find the indication by slug that contains a quiz
    const indication = await prisma.indication.findFirst({
      where: {
        slug: quizSlug,
        userId: user.id,
        quizId: { not: null } // Ensure it has a quiz
      },
      include: { 
        // Include the associated quiz
        quiz: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!indication) {
      console.log(`API - Indicação/Quiz não encontrado: ${quizSlug}`);
      return NextResponse.json(
        { error: "Questionário não encontrado" },
        { status: 404 }
      );
    }

    console.log(`API - Indicação encontrada: ${indication.id}, com quiz: ${indication.quizId}`);

    // Register view event
    await prisma.event.create({
      data: {
        type: 'QUIZ_VIEW',
        userId: user.id,
        indicationId: indication.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Prepare response data
    let responseData: any = { 
      ...indication,
      user: user
    };
    
    // Process quiz data
    if (indication.quiz) {
      responseData.isQuiz = true;
      
      // Format questions for the frontend
      if (indication.quiz.questions) {
        responseData.quiz = {
          ...indication.quiz,
          openingScreen: indication.quiz.openingScreen ? JSON.parse(indication.quiz.openingScreen as string) : null,
          completionScreen: indication.quiz.completionScreen ? JSON.parse(indication.quiz.completionScreen as string) : null,
          questions: indication.quiz.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            required: q.required,
            variableName: q.variableName,
            options: q.options ? JSON.parse(q.options) : []
          }))
        };
      }
    } else {
      responseData.isQuiz = false;
      responseData.quiz = null;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar questionário:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 