import api from './api';

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
    items: { variantId: string; quantity: number }[];
  }) {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async getMyOrders() {
      const response = await api.get('/orders');
      return response.data;
  },

  async getOrderById(id: string) {
      const response = await api.get(`/orders/${id}`);
      return response.data;
  }
};
