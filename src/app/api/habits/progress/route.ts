import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { habitId, date } = await request.json();
    
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
      return NextResponse.json(progress);
    } else {
      const progress = await prisma.dayProgress.create({
        data: {
          habitId,
          date: new Date(date),
          isChecked: true
        }
      });
      return NextResponse.json(progress);
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error updating progress' }, { status: 500 });
  }
} 