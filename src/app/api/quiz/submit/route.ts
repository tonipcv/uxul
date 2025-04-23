import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processQuizAnswers, generateQuizMetadata } from '@/lib/quiz/answer-processing';

// Interface para as respostas do questionário
interface QuizAnswer {
  questionId: string;
  questionText: string;
  variableName?: string;
  value: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, indicationId, answers } = body;

    if (!name || !phone || !indicationId || !answers) {
      return NextResponse.json(
        { error: "Dados incompletos. Nome, telefone e respostas são obrigatórios." },
        { status: 400 }
      );
    }

    // Primeiro, procurar por um Lead ou Patient existente com o mesmo telefone
    const existingLead = await prisma.lead.findFirst({
      where: { phone },
      include: {
        patient: true,
        indication: {
          include: {
            quiz: {
              include: {
                questions: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    // Find the indication for the current quiz
    const indication = await prisma.indication.findUnique({
      where: { id: indicationId },
      include: { 
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: "Questionário não encontrado" },
        { status: 404 }
      );
    }

    if (!indication.quiz) {
      return NextResponse.json(
        { error: "Questionário não está configurado para esta indicação" },
        { status: 400 }
      );
    }

    // Processar as respostas
    const quizQuestions = indication.quiz.questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      required: q.required,
      variableName: q.variableName || '',
      options: q.options ? JSON.parse(q.options as string) : []
    }));

    const answersObject: Record<string, any> = {};
    answers.forEach((answer: QuizAnswer) => {
      answersObject[answer.questionId] = answer.value;
    });

    const processedAnswers = processQuizAnswers(answersObject, quizQuestions);
    const metadata = generateQuizMetadata(processedAnswers);

    let lead;
    let patient;

    if (existingLead) {
      // Atualizar Lead existente
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name, // Atualizar nome se mudou
          medicalNotes: JSON.stringify(metadata),
          // Criar uma nova indicação para este quiz
          indication: {
            connect: { id: indicationId }
          }
        }
      });

      if (existingLead.patient) {
        // Atualizar Patient existente
        patient = await prisma.patient.update({
          where: { id: existingLead.patient.id },
          data: {
            name, // Atualizar nome se mudou
            // Adicionar a nova indicação ao paciente
            indications: {
              connect: { id: indicationId }
            }
          }
        });
      } else {
        // Criar Patient se não existir
        patient = await prisma.patient.create({
          data: {
            name,
            phone,
            email: '', // Email obrigatório, mas pode ser vazio inicialmente
            userId: indication.userId,
            leadId: existingLead.id,
            indications: {
              connect: { id: indicationId }
            }
          }
        });
      }
    } else {
      // Criar novo Lead e Patient
      lead = await prisma.lead.create({
        data: {
          name,
          phone,
          indicationId,
          userId: indication.userId,
          source: 'quiz',
          medicalNotes: JSON.stringify(metadata),
          utmSource: 'quiz',
          utmMedium: indication.slug,
        }
      });

      // Criar Patient automaticamente
      patient = await prisma.patient.create({
        data: {
          name,
          phone,
          email: '', // Email obrigatório, mas pode ser vazio inicialmente
          userId: indication.userId,
          leadId: lead.id,
          indications: {
            connect: { id: indicationId }
          }
        }
      });
    }

    // Registrar evento de submissão
    await prisma.event.create({
      data: {
        type: 'QUIZ_SUBMIT',
        userId: indication.userId,
        indicationId: indication.id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: existingLead ? "Dados atualizados com sucesso" : "Respostas enviadas com sucesso",
      leadId: lead.id,
      patientId: patient.id,
      isUpdate: !!existingLead
    });
  } catch (error) {
    console.error('Erro ao processar envio do questionário:', error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 