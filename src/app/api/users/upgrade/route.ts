import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const { plan, duration } = await req.json();
    
    if (!plan || !duration) {
      return NextResponse.json(
        { error: 'Dados de plano e duração são obrigatórios' },
        { status: 400 }
      );
    }

    // Aqui você integraria com um sistema de pagamento real
    // Implementação de exemplo (simulando pagamento bem-sucedido)
    
    // Calcular data de expiração
    const expiryDate = addDays(new Date(), Number(duration));
    
    // Atualizar plano do usuário
    const planType = plan.startsWith('premium') ? 'premium' : 'free';
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: planType,
        planExpiresAt: planType === 'premium' ? expiryDate : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan: planType,
      planExpiresAt: planType === 'premium' ? expiryDate : null
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
} 