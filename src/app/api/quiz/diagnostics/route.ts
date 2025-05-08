import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar todas as indicações do usuário
    const indications = await prisma.indication.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        quiz: true,
        _count: {
          select: {
            leads: true,
            events: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Buscar todos os quizzes do usuário
    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        indications: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Verificar se há quizzes sem indicações ou indicações com quizId mas sem quiz
    const quizzesWithoutIndications = quizzes.filter(quiz => quiz.indications.length === 0);
    const indicationsWithMissingQuiz = indications.filter(ind => ind.quizId && !ind.quiz);

    // Informações gerais do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true
      }
    });

    return NextResponse.json({
      user,
      indications: indications.map(ind => ({
        id: ind.id,
        name: ind.name,
        slug: ind.slug,
        quizId: ind.quizId,
        hasQuiz: !!ind.quiz,
        quizName: ind.quiz?.name,
        fullLink: ind.fullLink,
        type: ind.type,
        leadCount: ind._count.leads,
        eventCount: ind._count.events,
        createdAt: ind.createdAt
      })),
      quizzes: quizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.name,
        description: quiz.description,
        isPublished: quiz.isPublished,
        questionCount: quiz._count.questions,
        indicationCount: quiz.indications.length,
        indicationSlugs: quiz.indications.map(ind => ind.slug)
      })),
      diagnostics: {
        quizzesWithoutIndications: quizzesWithoutIndications.length,
        indicationsWithMissingQuiz: indicationsWithMissingQuiz.length,
        totalIndications: indications.length,
        totalQuizzes: quizzes.length
      }
    });
  } catch (error) {
    console.error('Erro na API de diagnóstico:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar diagnóstico' },
      { status: 500 }
    );
  }
} 