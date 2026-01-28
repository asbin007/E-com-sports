import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId: string;
  productTypeId: string;
  gender?: string;
  price?: number;
  images?: string[];
  ProductImages?: { id: string; url: string; isPrimary: boolean }[];
  Variants?: { id: string; size: string; color: string; price: number; salePrice?: number; stock: number }[];
  Category?: { id: string; name: string };
  Brand?: { id: string; name: string };
  ProductType?: { id: string; name: string; description?: string };
  createdAt: string;
  // New fields
  originalPrice?: number;
  discount?: number;
  sizes?: string[];
  colors?: string[];
  features?: string[];
  isNew?: boolean;
  sku?: string;
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
    productTypeId?: string;
  }) {
    const response = await api.get<ProductsResponse>('/products', { params });
    return response.data;
  },

  async getProductById(id: string) {
    const response = await api.get<{ message: string; data: Product }>(`/products/${id}`);
    return response.data.data;
  }
};
