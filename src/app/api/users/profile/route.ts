import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

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

    // Buscar o usuário pelo ID
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        specialty: true,
        image: true,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 