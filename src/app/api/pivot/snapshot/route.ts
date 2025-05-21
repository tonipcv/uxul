import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SnapshotSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  config: z.object({
    filters: z.object({
      scenario: z.string().optional(),
      version: z.array(z.string()).optional(),
      period: z.array(z.string()).optional(),
      bu: z.array(z.string()).optional(),
    }).optional(),
    rows: z.array(z.string()),
    columns: z.array(z.string()),
    metrics: z.array(z.string()),
  }),
  data: z.array(z.record(z.any())),
  totals: z.record(z.number()),
  metadata: z.object({
    createdBy: z.string(),
    createdAt: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const snapshot = SnapshotSchema.parse(body);

    const result = await prisma.pivotSnapshot.create({
      data: {
        name: snapshot.name,
        description: snapshot.description,
        config: snapshot.config,
        data: snapshot.data,
        totals: snapshot.totals,
        metadata: snapshot.metadata,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao salvar snapshot:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao salvar snapshot' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const createdBy = searchParams.get('createdBy');

    const snapshots = await prisma.pivotSnapshot.findMany({
      where: {
        ...(tag && { metadata: { path: ['tags'], array_contains: tag } }),
        ...(createdBy && { metadata: { path: ['createdBy'], equals: createdBy } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Erro ao buscar snapshots:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar snapshots' },
      { status: 500 }
    );
  }
} 