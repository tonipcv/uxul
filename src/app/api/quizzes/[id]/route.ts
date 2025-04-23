import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Buscar detalhes de um quiz específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const quizId = params.id;
    
    // Buscar o quiz e verificar se pertence ao usuário
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        },
        indications: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Questionário não encontrado' },
        { status: 404 }
      );
    }

    // Formatar os dados para o frontend
    const formattedQuiz = {
      id: quiz.id,
      name: quiz.name,
      description: quiz.description,
      isPublished: quiz.isPublished,
      openingScreen: quiz.openingScreen ? JSON.parse(JSON.stringify(quiz.openingScreen)) : {
        title: '',
        subtitle: '',
        description: '',
        startButtonText: 'Começar',
        showTimeEstimate: false,
        showQuestionCount: false
      },
      completionScreen: quiz.completionScreen ? JSON.parse(JSON.stringify(quiz.completionScreen)) : {
        title: 'Obrigado por participar!',
        message: 'Suas respostas foram registradas com sucesso.',
        redirectUrl: '',
        redirectButtonText: 'Concluir'
      },
      questions: quiz.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        required: q.required,
        variableName: q.variableName,
        options: q.options ? JSON.parse(q.options) : []
      }))
    };

    return NextResponse.json(formattedQuiz);
  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar questionário' },
      { status: 500 }
    );
  }
}

/**
 * Atualizar um quiz
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const quizId = params.id;
    const { 
      name, 
      description, 
      isPublished, 
      questions, 
      createIndicationIfMissing,
      openingScreen,
      completionScreen 
    } = await req.json();

    console.log('Received opening screen data:', openingScreen); // Debug log

    // Verificar se o quiz existe e pertence ao usuário
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id
      },
      include: {
        indications: true
      }
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Questionário não encontrado' },
        { status: 404 }
      );
    }

    // Iniciar uma transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar informações básicas do quiz
      const quiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          name,
          description,
          isPublished,
          openingScreen: openingScreen ? JSON.stringify(openingScreen) : undefined,
          completionScreen: completionScreen ? JSON.stringify(completionScreen) : undefined,
          updatedAt: new Date()
        },
        include: {
          indications: {
            select: {
              id: true,
              name: true,
              slug: true,
              fullLink: true
            }
          }
        }
      });

      // Criar uma indicação se não existir e a flag estiver ativa
      if (createIndicationIfMissing && quiz.indications.length === 0) {
        console.log("Criando nova indication para o quiz:", quizId);
        
        // Buscar informações completas do usuário
        const user = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { 
            id: true,
            email: true,
            slug: true
          }
        });
        
        // Usar o slug do usuário se disponível, caso contrário derivar do email
        const userSlug = user?.slug || session.user.userSlug || session.user.email?.split('@')[0] || 'user';
        const slug = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'questionario';
        
        // Gerar slug único
        const slugBase = slug;
        let uniqueSlug = slugBase;
        let counter = 1;
        
        // Verificar se o slug já existe
        while (true) {
          const existingIndication = await tx.indication.findFirst({
            where: { slug: uniqueSlug }
          });
          
          if (!existingIndication) break;
          
          uniqueSlug = `${slugBase}-${counter}`;
          counter++;
        }
        
        const newIndication = await tx.indication.create({
          data: {
            userId: session.user.id,
            quizId: quiz.id,
            slug: uniqueSlug,
            name: name || 'Questionário de Triagem',
            type: 'quiz',
            fullLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quiz/${userSlug}/${uniqueSlug}`
          }
        });
        
        // Adicionar a nova indication ao resultado
        quiz.indications.push(newIndication);
      }

      if (questions) {
        // Remover perguntas existentes
        await tx.quizQuestion.deleteMany({
          where: { quizId }
        });

        // Criar novas perguntas
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          
          // Garantir que variableName seja válido
          const variableName = q.variableName || `question_${i + 1}`;
          
          await tx.quizQuestion.create({
            data: {
              quizId,
              text: q.text,
              type: q.type,
              required: q.required,
              variableName: variableName,
              options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,  // Correctly serialize options as JSON string
              order: i
            }
          });
        }
      }

      return quiz;
    });

    // Format the response
    const formattedResult = {
      ...result,
      openingScreen: result.openingScreen ? JSON.parse(result.openingScreen as string) : null,
      completionScreen: result.completionScreen ? JSON.parse(result.completionScreen as string) : null
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error('Erro ao atualizar quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar questionário' },
      { status: 500 }
    );
  }
}

/**
 * Excluir um quiz
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const quizId = params.id;

    // Verificar se o quiz existe e pertence ao usuário
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id
      },
      include: {
        indications: true
      }
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Questionário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se existem indicações usando este quiz
    if (existingQuiz.indications.length > 0) {
      // Atualizar as indicações para remover a referência ao quiz
      await prisma.indication.updateMany({
        where: {
          id: {
            in: existingQuiz.indications.map(ind => ind.id)
          }
        },
        data: {
          chatbotFlowId: null // Remover referência ao chatbot também
        }
      });
    }

    // Excluir o quiz (a exclusão em cascata removerá perguntas)
    await prisma.quiz.delete({
      where: { id: quizId }
    });

    return NextResponse.json({
      success: true,
      message: 'Questionário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir questionário' },
      { status: 500 }
    );
  }
} 