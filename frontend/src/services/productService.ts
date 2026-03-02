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
  Category?: { id: string; name: string; needsSize: boolean; sizeType: "clothing" | "shoe" | null; slug: string };
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
  sport?: string;

  // Category-specific attributes
  attributes?: {
    // Jersey
    team?: string;
    player?: string;
    season?: string;
    isAuthentic?: boolean;
    // Shoes
    surface?: string;
    shoeType?: string;
    sole?: string;
    // Socks
    length?: string;
    material?: string;
    // Other / Gear / Accessory
    equipmentType?: string;
    ageGroup?: string;
    weight?: string;
  };
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
