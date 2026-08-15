import api from './api';

export interface ProductAttribute {
  id: string;
  attributeName: string;
  attributeValue: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brandId: string;
  productTypeId: string;
  sportId?: string;
  gender?: string;
  isActive: boolean;
  isFeatured?: boolean;

  // Relations
  Category?: { id: string; name: string; needsSize: boolean; sizeType: "clothing" | "shoe" | null; slug: string };
  Brand?: { id: string; name: string; slug: string; logo?: string };
  ProductType?: { id: string; name: string; description?: string; slug: string };
  Sport?: { id: string; name: string; slug: string; iconUrl?: string };
  variants?: {
    id: string;
    size: string;
    color: string;
    price: number;
    originalPrice?: number;
    salePrice?: number;
    stock: number;
    isActive: boolean;
  }[];
  images?: Array<
    | string
    | {
        id?: string;
        url?: string | null;
        altText?: string;
        isThumbnail?: boolean;
        sortOrder?: number;
      }
  >;
  ProductAttributes?: ProductAttribute[];
  attributes?: ProductAttribute[];

  // Legacy/Derived
  price?: number;
  originalPrice?: number;
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
