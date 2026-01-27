import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sportType?: string;
  categoryId: string;
  brandId: string;
  price?: number; // Backend model doesn't show price in getAll query attributes but usually it's there? - checking controller it selects all cols. will check Variants for price later if needed. Assume product level price or variant logic. 
  // Wait, backend controller getAllProducts returns Product model. Product model usually has price?
  // Let's assume Product has base price or we display range.
  // Actually, let's look at what the backend returns. The backend getAllProducts returns { count, rows: products }.
  // And it includes Category, Brand, ProductImage.
  // We can add price property if it exists in the Product model later. For now, let's include basic fields.
  ProductImages?: { id: string; url: string; isPrimary: boolean }[];
  Variants?: { id: string; size: string; color: string; price: number; stock: number }[];
  Category?: { id: string; name: string };
  Brand?: { id: string; name: string };
  createdAt: string;
}

export interface ProductsResponse {
  message: string;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export const productService = {
  async getAllProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    sportType?: string;
  }) {
    const response = await api.get<ProductsResponse>('/products', { params });
    return response.data;
  },

  async getProductById(id: string) {
    const response = await api.get<{ message: string; data: Product }>(`/products/${id}`);
    return response.data.data;
  }
};
