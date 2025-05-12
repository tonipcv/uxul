import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { leads } = await req.json();

    if (!Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Formato inválido' },
        { status: 400 }
      );
    }

    // Validate and process each lead
    const validLeads = leads.filter(lead => {
      return (
        typeof lead.name === 'string' &&
        lead.name.trim() &&
        typeof lead.phone === 'string' &&
        lead.phone.trim()
      );
    }).map(lead => ({
      ...lead,
      userId: session.user.id,
      status: lead.status || 'Novo',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (validLeads.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lead válido encontrado' },
        { status: 400 }
      );
    }

    // Import leads in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < validLeads.length; i += batchSize) {
      const batch = validLeads.slice(i, i + batchSize);
      const result = await prisma.lead.createMany({
        data: batch,
        skipDuplicates: true, // Skip if phone number already exists
      });
      imported += result.count;
    }

    return NextResponse.json({
      success: true,
      imported,
      total: validLeads.length
    });
  } catch (error) {
    console.error('Erro ao importar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a importação' },
      { status: 500 }
    );
  }
} 