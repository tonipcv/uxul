import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cycles = await prisma.cycle.findMany({
      include: {
        weeks: {
          include: {
            goals: true,
            keyResults: true,
            days: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });
    return NextResponse.json(cycles);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching cycles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const cycle = await prisma.cycle.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        vision: data.vision,
        weeks: {
          create: data.weeks.map((week: any) => ({
            weekNumber: week.weekNumber,
            vision: week.vision,
            reflection: week.reflection,
            isExpanded: week.isExpanded,
            goals: {
              create: week.goals.map((goal: string) => ({
                title: goal
              }))
            },
            keyResults: {
              create: week.keyResults.map((kr: any) => ({
                title: kr.title,
                target: kr.target,
                current: kr.current
              }))
            },
            days: {
              create: week.days.map((day: any) => ({
                date: new Date(day.date),
                notes: day.notes,
                tasks: {
                  create: day.tasks.map((task: any) => ({
                    title: task.title,
                    completed: task.completed,
                    timeBlock: task.timeBlock,
                    scheduledTime: task.scheduledTime
                  }))
                }
              }))
            }
          }))
        }
      },
      include: {
        weeks: {
          include: {
            goals: true,
            keyResults: true,
            days: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });
    return NextResponse.json(cycle);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating cycle' }, { status: 500 });
  }
} 