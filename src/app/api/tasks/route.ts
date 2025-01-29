import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tasks = await prisma.eisenhowerTask.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { importance: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[TASKS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const { title, dueDate, importance } = body;
    console.log('Extracted values:', { title, dueDate, importance });

    if (!title || !dueDate || typeof importance !== 'number') {
      console.log('Validation failed:', { 
        hasTitle: !!title, 
        hasDueDate: !!dueDate, 
        importanceType: typeof importance 
      });
      return new NextResponse('Missing or invalid required fields', { status: 400 });
    }

    // Garantir que a data está no formato correto
    const parsedDate = new Date(dueDate);
    console.log('Parsed date:', { 
      original: dueDate,
      parsed: parsedDate,
      isValid: !isNaN(parsedDate.getTime())
    });

    if (isNaN(parsedDate.getTime())) {
      return new NextResponse('Invalid date format', { status: 400 });
    }

    const task = await prisma.eisenhowerTask.create({
      data: {
        title: String(title),
        dueDate: parsedDate,
        importance: Number(importance),
        userId: session.user.id
      }
    });

    console.log('Created task:', task);
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[TASKS_POST] Detailed error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return new NextResponse(error.message, { status: 500 });
    }
    console.error('[TASKS_POST] Unknown error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 
