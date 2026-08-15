import api from './api';

export type PaymentMethodType = 'qr' | 'bank' | 'cod';

export interface PaymentMethod {
  id: string;
  label: string;
  type: PaymentMethodType;
  qrImage?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  branch?: string | null;
  instructions: string;
  requiresProof: boolean;
  enabled: boolean;
}

export interface PaymentMethodsResponse {
  message: string;
  data: PaymentMethod[];
}

export const paymentService = {
  async getPaymentMethods() {
    const response = await api.get<PaymentMethodsResponse>('/payments/methods');
    return response.data;
  },
};
