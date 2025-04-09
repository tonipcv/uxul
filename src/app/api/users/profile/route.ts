import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Configuração para cache e revalidação
export const revalidate = 60; // Revalidar a cada 60 segundos

// Marcar rota como dinâmica
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const noCache = req.nextUrl.searchParams.get('noCache') === 'true';

    // Obter a sessão atual
    const session = await getServerSession(authOptions);

    // Se não tiver userId como parâmetro, usar o userId da sessão
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou ID não fornecido' },
        { status: 401 }
      );
    }

    // Se o usuário estiver tentando acessar dados de outro usuário sem ser admin
    if (userId && userId !== session?.user?.id) {
      // Verificar se o usuário atual tem permissão (implementar lógica de admins se necessário)
      // Por enquanto, só permitimos acessar o próprio perfil
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Buscar o usuário pelo ID com as informações essenciais
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        specialty: true,
        image: true,
        pageTemplate: true,
        _count: {
          select: {
            indications: true,
            leads: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Configurar cabeçalhos para cache
    const headers = new Headers();
    if (!noCache) {
      headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    } else {
      headers.set('Cache-Control', 'no-store');
    }

    return NextResponse.json(user, { 
      headers,
      status: 200 
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 