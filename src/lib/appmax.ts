import axios from 'axios';
import { CreatePaymentLinkParams, PaymentLinkResponse } from '@/types/appmax';

const APPMAX_API_URL = 'https://admin.appmax.com.br/api/v3';
const APPMAX_TOKEN = '8FD89136-4E6B7173-BC9E8E06-A0E333A5';

export async function createPaymentLink({
  userId,
  planId,
  planName,
  price,
  customerName,
  customerEmail,
  customerPhone,
}: CreatePaymentLinkParams): Promise<PaymentLinkResponse> {
  try {
    const payload = {
      name: `Plano ${planName} - Med1`,
      price: price,
      installments_limit: 12,
      payment_methods: ['credit_card', 'pix'],
      expiration_days: 7,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?userId=${userId}`,
      reference: userId,
      product_id: planId,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/appmax`
    };

    console.log('Enviando requisição para Appmax:', payload); // Debug

    const response = await axios.post(`${APPMAX_API_URL}/payment-links`, payload, {
      headers: {
        'Authorization': `Bearer ${APPMAX_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Resposta bruta da Appmax:', response.data); // Debug

    // Garantir que temos os campos necessários
    if (!response.data?.id || !response.data?.url) {
      console.error('Resposta inválida da Appmax:', response.data);
      throw new Error('Resposta inválida da API da Appmax');
    }

    return {
      success: true,
      paymentUrl: response.data.url,
      linkId: response.data.id
    };
  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalhes do erro Appmax:', error.response?.data);
    }
    throw new Error('Falha ao gerar link de pagamento');
  }
} 