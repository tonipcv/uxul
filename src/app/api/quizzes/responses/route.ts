import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Interface para respostas de questionário
interface QuizResponse {
  id: string; // ID do lead
  name: string; // Nome da pessoa que respondeu
  quizName: string; // Nome do questionário
  indicationName: string; // Nome da indicação
  phone: string;
  createdAt: string;
  medicalNotes?: string;
  source: string;
  quizId: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar leads com limit para evitar timeout
    const quizLeads = await prisma.lead.findMany({
      where: {
        userId: session.user.id,
        source: 'quiz',
      },
      include: {
        indication: {
          select: {
            id: true,
            name: true,
            slug: true,
            quizId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limitar para 100 resultados mais recentes
    });

    // Buscar informações dos quizzes separadamente para reduzir a complexidade da consulta
    const quizIds = quizLeads
      .map(lead => lead.indication?.quizId)
      .filter(id => id) as string[];
    
    const uniqueQuizIds = [...new Set(quizIds)];
    
    const quizzes = uniqueQuizIds.length > 0 
      ? await prisma.quiz.findMany({
          where: { 
            id: { in: uniqueQuizIds } 
          },
          select: {
            id: true,
            name: true
          }
        })
      : [];
    
    // Criar um mapa para fácil acesso
    const quizMap = new Map(quizzes.map(quiz => [quiz.id, quiz]));

    // Formatar os dados para o frontend
    const responses = quizLeads.map(lead => {
      const quizId = lead.indication?.quizId || 'unknown';
      const quiz = quizMap.get(quizId);
      
      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        quizId: quizId,
        quizName: quiz?.name || 'Questionário sem nome',
        indicationName: lead.indication?.name || 'Indicação não identificada',
        indicationId: lead.indicationId || 'unknown',
        createdAt: lead.createdAt,
        medicalNotes: lead.medicalNotes || undefined,
        source: lead.source || 'quiz'
      };
    });

    return NextResponse.json({
      success: true,
      responses,
      total: responses.length
    });
  } catch (error) {
    console.error('Erro ao buscar respostas de questionários:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 