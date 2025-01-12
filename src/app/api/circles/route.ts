import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const circles = await prisma.circle.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(circles);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch circles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, maxClicks } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const circle = await prisma.circle.create({
      data: {
        title,
        maxClicks: maxClicks || 5,
        clicks: 0,
        userId: session.user.id
      }
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create circle' },
      { status: 500 }
    );
  }
} 