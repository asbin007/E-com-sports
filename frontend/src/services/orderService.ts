import api from './api';

export interface OrderItem {
  id: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  Product?: { name: string; ProductImages?: { url: string }[] } | null;
}

export interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  zipcode: string;
  orderStatus: string;
  totalPrice: number;
  subtotal: number | null;
  deliveryCharge: number | null;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentPid: string | null;
  paymentScreenshot: string | null;
  paymentRejectionReason: string | null;
  createdAt: string;
  Payment?: { paymentStatus: string } | null;
  OrderItems?: OrderItem[];
  StatusHistories?: StatusHistory[];
}

export const orderService = {
  async createOrder(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    addressLine: string;
    city: string;
    state: string;
    zipcode: string;
    paymentMethod: string;
    transactionId?: string;
    paymentPid?: string;
    items: {
      productId: string;
      variantId?: string | null;
      size: string | null;
      color?: string | null;
      quantity: number;
      price?: number;
    }[];
  }) {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async uploadPaymentProof(orderId: string, transactionId: string, screenshot?: File) {
    const formData = new FormData();
    if (transactionId) formData.append('transactionId', transactionId);
    if (screenshot) formData.append('screenshot', screenshot);

    const response = await api.post(`/payments/${orderId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get('/orders');
    return response.data.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  async getPaymentStatus(orderId: string) {
    const response = await api.get(`/payments/${orderId}/status`);
    return response.data.data;
  },
};
