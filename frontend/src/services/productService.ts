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
  Category?: { id: string; name: string; needsSize: boolean; sizeType: "clothing" | "shoe" | "ball" | "trophy" | null; slug: string };
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
    /** Absent on thin API projections — missing means *unknown*, not zero. */
    stock?: number;
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

/** One variant row, exactly as the API serialises it. */
export type ProductVariant = NonNullable<Product['variants']>[number];

/**
 * A thin API projection can omit `stock` altogether, so an absent field is
 * *unknown*, never zero. Summing it as zero printed "Sold out" over real,
 * buyable kit, which is why nothing below reads `variant.stock` directly.
 */
export const variantStock = (variant?: ProductVariant): number | null =>
  typeof variant?.stock === 'number' ? variant.stock : null;

/** Sellable unless the row actually reports a count of zero or less. */
export const isVariantSellable = (variant: ProductVariant): boolean =>
  (variantStock(variant) ?? 1) > 0;

/**
 * Sold out only when the product has variants and not one active row reports
 * stock left. A row carrying no `stock` field keeps the product buyable.
 */
export const isProductSoldOut = (variants?: ProductVariant[]): boolean => {
  if (!variants || variants.length === 0) return false;
  const sellable = variants.filter((v) => v.isActive !== false);
  if (sellable.length === 0) return true;
  return !sellable.some(isVariantSellable);
};

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
