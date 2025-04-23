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

    // Pegar parâmetros do request
    const { action, quizId, indicationSlug, createMissing } = await request.json();

    // Para reparar o link de um quiz específico
    if (action === 'fix-quiz-link' && quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          indications: true
        }
      });
      
      if (!quiz || quiz.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Quiz não encontrado ou não pertence ao usuário' },
          { status: 404 }
        );
      }

      // Buscar o usuário para obter o slug
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true }
      });

      const userSlug = user?.slug || session.user.userSlug || session.user.email?.split('@')[0] || 'user';
      
      // Se não tem indicação associada, criar uma
      if (quiz.indications.length === 0 && createMissing) {
        // Criar slug a partir do nome do quiz
        const slugBase = quiz.name
          ? quiz.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : 'quiz';
        
        // Verificar se o slug já existe
        let uniqueSlug = slugBase;
        let counter = 1;
        
        while (true) {
          const existing = await prisma.indication.findFirst({
            where: { slug: uniqueSlug }
          });
          
          if (!existing) break;
          
          uniqueSlug = `${slugBase}-${counter}`;
          counter++;
        }
        
        // Criar a indicação
        const newIndication = await prisma.indication.create({
          data: {
            userId: session.user.id,
            quizId: quiz.id,
            slug: uniqueSlug,
            name: quiz.name || 'Questionário',
            type: 'quiz',
            fullLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${userSlug}/${uniqueSlug}`
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Nova indicação criada com sucesso',
          indication: newIndication,
          link: `/quiz/${userSlug}/${uniqueSlug}`
        });
      } 
      // Se já tem indicação, apenas atualizar o link
      else if (quiz.indications.length > 0) {
        const indication = quiz.indications[0];
        
        // Atualizar o fullLink para garantir que está correto
        const updatedIndication = await prisma.indication.update({
          where: { id: indication.id },
          data: {
            fullLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${userSlug}/${indication.slug}`
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Link atualizado com sucesso',
          indication: updatedIndication,
          link: `/quiz/${userSlug}/${indication.slug}`
        });
      }
    }
    
    // Para associar manualmente uma indicação a um quiz
    else if (action === 'associate-by-slug' && quizId && indicationSlug) {
      // Verificar se o quiz pertence ao usuário
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
      
      // Buscar a indicação pelo slug
      const indication = await prisma.indication.findFirst({
        where: {
          slug: indicationSlug,
          userId: session.user.id
        }
      });
      
      if (!indication) {
        return NextResponse.json(
          { error: 'Indicação não encontrada' },
          { status: 404 }
        );
      }
      
      // Atualizar a indicação para associar ao quiz
      const updatedIndication = await prisma.indication.update({
        where: { id: indication.id },
        data: { quizId }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Indicação associada ao quiz com sucesso',
        indication: updatedIndication
      });
    }
    
    // Se não houver ação válida
    return NextResponse.json(
      { error: 'Ação inválida ou parâmetros insuficientes' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na API de reparação:', error);
    return NextResponse.json(
      { error: 'Erro ao reparar quiz/indicação', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 