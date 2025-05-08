import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

export interface CreatePreferenceParams {
  planId: string;
  planName: string;
  price: number;
  userId: string;
  userEmail: string;
}

export async function createPaymentPreference({
  planId,
  planName,
  price,
  userId,
  userEmail,
}: CreatePreferenceParams) {
  try {
    const preferenceClient = new Preference(mpClient);
    
    const result = await preferenceClient.create({
      body: {
        items: [
          {
            id: planId,
            title: `Plano ${planName} - Med1 (Pagamento Anual)`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: price,
          },
        ],
        payer: {
          email: userEmail,
        },
        payment_methods: {
          installments: 12,
          default_installments: 1,
          default_payment_method_id: "pix",
          excluded_payment_methods: [
            { id: "bolbradesco" },
            { id: "pec" },
            { id: "debit_card" }
          ]
        },
        binary_mode: false,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/pending`,
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        external_reference: `${userId}-${planId}`,
        statement_descriptor: "Med1.app",
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      },
    });

    // Retornar apenas os dados necessários
    return {
      init_point: result.init_point,
      id: result.id
    };
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw error;
  }
}

export async function verifyPayment(paymentId: string) {
  try {
    const paymentClient = new Payment(mpClient);
    const result = await paymentClient.get({ id: paymentId });
    return result;
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    throw error;
  }
} 