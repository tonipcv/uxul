export interface AppmaxConfig {
  username: string;
  password: string;
  apiUrl: string;
}

export interface AppmaxPaymentResponse {
  success: boolean;
  url: string;
  id: string;
}

export interface AppmaxWebhookPayload {
  event: 'payment.approved' | 'payment.refused' | 'order.paid' | 'order.canceled' | 'subscription.canceled';
  order?: {
    id: string;
    reference: string;
    status: string;
  };
  subscription?: {
    id: string;
    reference: string;
    status: string;
  };
}

export interface CreatePaymentLinkParams {
  userId: string;
  planId: string;
  planName: string;
  price: number;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface PaymentLinkResponse {
  success: boolean;
  paymentUrl: string;
  linkId: string;
} 