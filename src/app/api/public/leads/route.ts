import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Pipeline {
  userId: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  pipelineId: string;
  userId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, pipelineId } = body;

    if (!name || !phone || !pipelineId) {
      return NextResponse.json(
        { error: 'Nome, telefone e pipelineId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o pipeline para verificar se existe e obter o userId
    const pipelines = await prisma.$queryRaw<Pipeline[]>`
      SELECT "userId" FROM "Pipeline" WHERE id = ${pipelineId};
    `;

    if (!pipelines || pipelines.length === 0) {
      return NextResponse.json(
        { error: 'Pipeline não encontrado' },
        { status: 404 }
      );
    }

    const pipeline = pipelines[0];

    // Criar o lead usando SQL direto
    const leads = await prisma.$queryRaw<Lead[]>`
      INSERT INTO "Lead" (
        "id",
        "name",
        "email",
        "phone",
        "pipelineId",
        "userId",
        "status",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${name},
        ${email || null},
        ${phone},
        ${pipelineId},
        ${pipeline.userId},
        'Novo',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    return NextResponse.json(leads[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lead' },
      { status: 500 }
    );
  }
} 