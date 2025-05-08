import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppmaxWebhookPayload } from '@/types/appmax';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AppmaxWebhookPayload;
    
    // Registrar webhook recebido (para debug)
    console.log('Webhook Appmax recebido:', JSON.stringify(payload));
    
    // Verificar tipo de evento
    const eventType = payload.event;
    
    // Tratar pagamento aprovado
    if (eventType === 'payment.approved' || eventType === 'order.paid') {
      const orderId = payload.order?.id;
      const reference = payload.order?.reference; // userId
      
      if (!reference) {
        console.error('Webhook sem referência de usuário');
        return NextResponse.json({ received: true });
      }
      
      // Atualizar status do link de pagamento
      await prisma.paymentLink.updateMany({
        where: {
          userId: reference,
          status: 'pending'
        },
        data: {
          status: 'paid',
          paidAt: new Date(),
          transactionId: orderId
        }
      });
      
      // Atualizar status premium do usuário
      await prisma.user.update({
        where: { id: reference },
        data: { 
          isPremium: true,
          premiumSince: new Date()
        }
      });
      
      console.log(`Usuário ${reference} atualizado para premium com sucesso`);
    }
    
    // Tratar pagamento recusado ou cancelamento
    if (eventType === 'payment.refused' || eventType === 'order.canceled') {
      const reference = payload.order?.reference;
      
      if (reference) {
        // Atualizar status do link de pagamento
        await prisma.paymentLink.updateMany({
          where: {
            userId: reference,
            status: 'pending'
          },
          data: {
            status: eventType === 'order.canceled' ? 'canceled' : 'refused'
          }
        });

        // Se for cancelamento, remover acesso premium
        if (eventType === 'order.canceled') {
          await prisma.user.update({
            where: { id: reference },
            data: {
              isPremium: false,
              premiumSince: null
            }
          });
          
          console.log(`Assinatura do usuário ${reference} foi cancelada`);
        }
      }
    }
    
    // Sempre responder com 200 para confirmar recebimento
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    // Mesmo com erro interno, responder 200 para evitar reenvios
    return NextResponse.json({ received: true, error: 'Erro interno' });
  }
} 