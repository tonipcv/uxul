import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const taskId = segments[segments.length - 2]; // -2 because the last segment is 'toggle'

    const task = await prisma.eisenhowerTask.findFirst({
      where: { 
        id: taskId,
        userId: session.user.id 
      }
    });

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    const updatedTask = await prisma.eisenhowerTask.update({
      where: { id: taskId },
      data: { isCompleted: !task.isCompleted }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
