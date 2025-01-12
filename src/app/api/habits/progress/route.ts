import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { habitId, date } = await request.json();
    
    if (!habitId || !date) {
      return NextResponse.json(
        { error: 'Habit ID and date are required' },
        { status: 400 }
      );
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existingProgress = await prisma.dayProgress.findFirst({
      where: {
        habitId,
        date: new Date(date)
      }
    });

    if (existingProgress) {
      const progress = await prisma.dayProgress.update({
        where: { id: existingProgress.id },
        data: { isChecked: !existingProgress.isChecked }
      });
      return NextResponse.json({ data: progress });
    } else {
      const progress = await prisma.dayProgress.create({
        data: {
          habitId,
          date: new Date(date),
          isChecked: true
        }
      });
      return NextResponse.json({ data: progress });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Error updating progress' },
      { status: 500 }
    );
  }
} 