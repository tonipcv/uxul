import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type = 'click', 
      userSlug, 
      indicationSlug,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = body;

    // Validação dos campos obrigatórios
    if (!userSlug) {
      return NextResponse.json(
        { error: 'Campo obrigatório: userSlug' },
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

    // Registrar o evento
    await prisma.event.create({
      data: {
        type,
        userId: user.id,
        indicationId: indication?.id,
        ip: ip.toString(),
        userAgent,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent
      }
    });

    // Retornar 204 (sem conteúdo) para não atrasar o redirecionamento
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    // Mesmo em caso de erro, retornamos 204 para não atrasar o redirecionamento
    return new NextResponse(null, { status: 204 });
  }
}

// Também suportar GET para facilitar o rastreamento via img ou iframe
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userSlug = searchParams.get('userSlug');
  const indicationSlug = searchParams.get('indicationSlug');
  const type = searchParams.get('type') || 'click';
  
  // Capturar parâmetros UTM
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmTerm = searchParams.get('utm_term');
  const utmContent = searchParams.get('utm_content');

  if (!userSlug) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });

    if (!user) {
      return new NextResponse(null, { status: 204 });
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

    // Registrar o evento
    await prisma.event.create({
      data: {
        type,
        userId: user.id,
        indicationId: indication?.id,
        ip: ip.toString(),
        userAgent,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent
      }
    });
  } catch (error) {
    console.error('Erro ao registrar evento via GET:', error);
  }

  // Retornar uma imagem transparente 1x1 para tracking pixel
  const transparent1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  return new NextResponse(transparent1x1, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
} 