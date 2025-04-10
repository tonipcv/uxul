import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se existe token do Google para este usuário
    const googleAuth = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
        access_token: {
          not: null
        }
      }
    });

    const isConnected = !!googleAuth;

    return NextResponse.json({ isConnected });
  } catch (error) {
    console.error('Erro ao verificar status de autenticação Google:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status de autenticação', isConnected: false },
      { status: 500 }
    );
  }
} 