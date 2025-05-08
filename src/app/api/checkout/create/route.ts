import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentLink } from '@/lib/appmax';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    // Mapear os planos com seus preços anuais
    const plans = {
      personal: { name: 'Pessoal', price: 197 * 12 }, // 12x R$ 197 = R$ 2.364
      scale: { name: 'Escala', price: 497 * 12 }, // 12x R$ 497 = R$ 5.964
      business: { name: 'Business', price: 997 * 12 }, // 12x R$ 997 = R$ 11.964
    };

    const plan = plans[planId as keyof typeof plans];
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    console.log('Criando link de pagamento para:', { planId, plan }); // Debug

    const paymentLink = await createPaymentLink({
      userId: session.user.id,
      planId,
      planName: plan.name,
      price: plan.price,
      customerEmail: session.user.email!,
      customerName: session.user.name || undefined,
    });

    console.log('Resposta da Appmax:', paymentLink); // Debug da resposta

    if (!paymentLink.paymentUrl || !paymentLink.linkId) {
      throw new Error('Resposta inválida da Appmax');
    }

    // Salvar link de pagamento no banco
    const savedPaymentLink = await prisma.paymentLink.create({
      data: {
        userId: session.user.id,
        planId,
        externalId: paymentLink.linkId,
        paymentUrl: paymentLink.paymentUrl,
        status: 'pending',
      }
    });

    console.log('Link de pagamento salvo:', savedPaymentLink); // Debug

    return NextResponse.json({
      success: true,
      init_point: paymentLink.paymentUrl
    });
  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
} 