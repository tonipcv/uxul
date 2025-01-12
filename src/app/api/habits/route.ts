import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString();
    const start = startOfMonth(new Date(month));
    const end = endOfMonth(new Date(month));

    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        progress: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          },
          select: {
            date: true,
            isChecked: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Formatar os dados para o formato esperado pelo frontend
    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0],
        isChecked: p.isChecked
      }))
    }));

    return NextResponse.json(formattedHabits);
  } catch (error) {
    console.error('Error in GET /api/habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits', data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o prisma está disponível
    if (!prisma || !prisma.habit) {
      console.error('Prisma client not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Teste de conexão
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (connError) {
      console.error('Database connection error:', connError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const data = await request.json();
    console.log('Received data:', data);
    
    if (!data.title || !data.category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Tentar criar o hábito
    console.log('Attempting to create habit...');
    const habit = await prisma.habit.create({
      data: {
        title: data.title.trim(),
        category: data.category,
        userId: session.user.id
      }
    });

    console.log('Habit created successfully:', habit);

    const formattedHabit = {
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: []
    };

    return NextResponse.json(formattedHabit, { status: 201 });

  } catch (error) {
    console.error('Detailed error in POST /api/habits:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({ 
      error: 'Error creating habit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 