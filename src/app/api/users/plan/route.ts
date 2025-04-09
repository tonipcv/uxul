import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Configuração para cache e revalidação
export const revalidate = 300; // Revalidar a cada 5 minutos

// Marcar rota como dinâmica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar se deve ignorar o cache
    const noCache = request.nextUrl.searchParams.get('noCache') === 'true';
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpiresAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o plano premium expirou
    let planData;
    if (user.plan === 'premium' && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      // Atualizar usuário para plano gratuito
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: 'free',
          planExpiresAt: null
        }
      });

      planData = {
        plan: 'free',
        planExpiresAt: null
      };
    } else {
      planData = {
        plan: user.plan,
        planExpiresAt: user.planExpiresAt
      };
    }

    // Configurar cabeçalhos para cache
    const headers = new Headers();
    if (!noCache) {
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    } else {
      headers.set('Cache-Control', 'no-store');
    }

    return NextResponse.json(planData, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 