import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
    if (user.plan === 'premium' && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      // Atualizar usuário para plano gratuito
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: 'free',
          planExpiresAt: null
        }
      });

      return NextResponse.json({
        plan: 'free',
        planExpiresAt: null
      });
    }

    return NextResponse.json({
      plan: user.plan,
      planExpiresAt: user.planExpiresAt
    });
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 