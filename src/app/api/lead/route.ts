import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      phone, 
      interest, 
      userSlug, 
      indicationSlug, 
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = body;

    // Validação dos campos obrigatórios
    if (!name || !phone || !userSlug) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, phone, userSlug' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Buscar a indicação (se existir)
    let indication: { id: string; name: string | null; slug: string; createdAt: Date; userId: string; } | null = null;
    if (indicationSlug) {
      indication = await prisma.indication.findFirst({
        where: {
          slug: indicationSlug,
          userId: user.id
        }
      });
    }

    // Obter IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Criar o lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        interest,
        userId: user.id,
        indicationId: indication?.id,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent
      }
    });

    // Registrar o evento de lead
    await prisma.event.create({
      data: {
        type: 'lead',
        userId: user.id,
        indicationId: indication?.id,
        ip: ip.toString(),
        userAgent,
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 