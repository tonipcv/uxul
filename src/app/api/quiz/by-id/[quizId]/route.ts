import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params;
    console.log(`API - Buscando quiz por ID: ${quizId}`);

    // Buscar diretamente o quiz pelo ID
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            specialty: true,
            image: true,
            slug: true
          }
        },
        indications: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!quiz) {
      console.log(`API - Quiz não encontrado com ID: ${quizId}`);
      return NextResponse.json(
        { error: "Questionário não encontrado" },
        { status: 404 }
      );
    }

    console.log(`API - Quiz encontrado: ${quiz.name}`);

    // Preparar dados da resposta
    const responseData: any = {
      id: quiz.indications[0]?.id || null,
      quiz: {
        ...quiz,
        questions: quiz.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          variableName: q.variableName,
          options: q.options || []
        }))
      },
      user: quiz.user
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Erro ao buscar quiz por ID:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 