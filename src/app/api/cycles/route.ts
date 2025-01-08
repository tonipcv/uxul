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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching cycles' }, { status: 500 });
  }
}

interface Week {
  weekNumber: number;
  vision: string;
  reflection: string;
  isExpanded: boolean;
  goals: string[];
  keyResults: {
    title: string;
    target: number;
    current: number;
  }[];
  days: {
    date: string;
    notes: string;
    tasks: {
      title: string;
      completed: boolean;
      timeBlock: string;
      scheduledTime?: string;
    }[];
  }[];
}

interface CycleData {
  startDate: Date;
  endDate: Date;
  vision?: string;
  weeks: Week[];
}

interface Day {
  date: string;
  notes: string;
  tasks: {
    title: string;
    completed: boolean;
    timeBlock: string;
    scheduledTime?: string;
  }[];
}

interface Task {
  title: string;
  completed: boolean;
  timeBlock: string;
  scheduledTime?: string;
}

async function handlePost(data: CycleData) {
  try {
    const cycle = await prisma.cycle.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        vision: data.vision,
        weeks: {
          create: data.weeks.map((week: Week) => ({
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
              create: week.keyResults.map((kr) => ({
                title: kr.title,
                target: kr.target,
                current: kr.current
              }))
            },
            days: {
              create: week.days.map((day: Day) => ({
                date: new Date(day.date),
                notes: day.notes,
                tasks: {
                  create: day.tasks.map((task: Task) => ({
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error creating cycle' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    return handlePost(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error creating cycle' }, { status: 500 });
  }
} 