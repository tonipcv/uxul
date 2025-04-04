import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/indications/generate:
 *   post:
 *     summary: Gera um link de indicação personalizado com parâmetros de rastreamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               indicationId:
 *                 type: string
 *                 description: ID da indicação
 *               utmSource:
 *                 type: string
 *                 description: Fonte do tráfego (ex. instagram, facebook, whatsapp)
 *               utmMedium:
 *                 type: string
 *                 description: Meio de comunicação (ex. bio, post, story, direct)
 *               utmCampaign:
 *                 type: string
 *                 description: Nome da campanha (ex. promo_junho, blackfriday)
 *               utmTerm:
 *                 type: string
 *                 description: Termos de busca paga (opcional)
 *               utmContent:
 *                 type: string
 *                 description: Identificador de conteúdo específico (opcional)
 *     responses:
 *       200:
 *         description: Link gerado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Indicação não encontrada
 */
export async function POST(req: NextRequest) {
  try {
    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const data = await req.json();
    const { 
      indicationId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = data;

    // Validar campos obrigatórios
    if (!indicationId) {
      return NextResponse.json(
        { error: 'ID da indicação é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a indicação existe e pertence ao usuário
    const indication = await prisma.indication.findUnique({
      where: {
        id: indicationId,
        userId: session.user.id
      }
    });

    if (!indication) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Construir a base do URL da indicação
    const baseUrl = process.env.NEXT_PUBLIC_LANDING_PAGE_URL || 'https://med1.app';
    const indicationUrl = `${baseUrl}/${indication.slug}`;

    // Adicionar parâmetros UTM ao URL
    const params = new URLSearchParams();
    
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);
    if (utmTerm) params.append('utm_term', utmTerm);
    if (utmContent) params.append('utm_content', utmContent);

    // Construir o URL final
    const finalUrl = params.toString() 
      ? `${indicationUrl}?${params.toString()}`
      : indicationUrl;

    // Registrar evento de geração de link (opcional)
    await prisma.event.create({
      data: {
        userId: session.user.id,
        indicationId,
        type: 'link_generated',
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent
      }
    });

    return NextResponse.json({
      success: true,
      indication: {
        id: indication.id,
        slug: indication.slug,
        name: indication.name
      },
      link: finalUrl,
      utmParams: {
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent
      }
    });
  } catch (error) {
    console.error('Erro ao gerar link de indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 