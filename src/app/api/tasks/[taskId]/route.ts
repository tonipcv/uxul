import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidDate } from '@/lib/utils';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const taskId = segments[segments.length - 1];

    const task = await prisma.eisenhowerTask.findFirst({
      where: {
        id: taskId,
        userId: session.user.id
      }
    });

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    await prisma.eisenhowerTask.delete({
      where: { id: taskId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const taskId = segments[segments.length - 1];

    const body = await request.json();
    const { title, dueDate, importance } = body;

    // Validate input
    if (!title?.trim()) {
      return new NextResponse('Title is required', { status: 400 });
    }

    if (!dueDate || !isValidDate(dueDate)) {
      return new NextResponse('Valid due date is required', { status: 400 });
    }

    if (typeof importance !== 'number' || importance < 1 || importance > 4) {
      return new NextResponse('Valid importance level (1-4) is required', { status: 400 });
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.eisenhowerTask.findFirst({
      where: { 
        id: taskId,
        userId: session.user.id 
      }
    });

    if (!existingTask) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Update task
    const updatedTask = await prisma.eisenhowerTask.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        dueDate: new Date(dueDate),
        importance
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
