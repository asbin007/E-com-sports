import api from './api';
import type { Product } from './productService';

/**
 * Client for the `/recommendations` endpoints (backend: recommendationRoute.ts).
 *
 * Two things differ from `/products` and are handled here so callers never have
 * to care:
 *
 * 1. Envelope. Most endpoints answer `{ message, data: Product[] }`, but
 *    `/all-collections` answers `{ message, data: { newArrivals, onSale,
 *    featured } }` and `/personalized` adds an `isPersonalized` flag.
 * 2. Shape. `/products` normalises its rows before responding (it renames the
 *    associations to `variants`/`images` and derives `price`/`originalPrice`
 *    from the first variant). The recommendation controller does not — it
 *    returns raw Sequelize rows, so associations can arrive under their
 *    capitalised aliases and the derived price fields are absent. Every row is
 *    funnelled through `normalizeProduct` so the rest of the app keeps seeing
 *    the single `Product` shape that ProductCard and friends already expect.
 */

type ProductVariant = NonNullable<Product['variants']>[number];
type ProductImageEntry = NonNullable<Product['images']>[number];

/** A product row exactly as the recommendation controller serialises it. */
interface RawProduct extends Product {
  Variants?: ProductVariant[];
  ProductImages?: ProductImageEntry[];
}

const normalizeProduct = (raw: RawProduct): Product => {
  const variants = raw.variants?.length ? raw.variants : raw.Variants ?? [];
  const images = raw.images?.length ? raw.images : raw.ProductImages ?? [];

  const normalized: Product = {
    ...raw,
    variants,
    images,
    price: raw.price ?? variants[0]?.price ?? 0,
    originalPrice: raw.originalPrice ?? variants[0]?.originalPrice,
  };

  // Drop the raw association keys so a normalised product is indistinguishable
  // from one that came out of `/products`.
  delete (normalized as RawProduct).Variants;
  delete (normalized as RawProduct).ProductImages;

  return normalized;
};

const normalizeList = (rows: RawProduct[] | undefined): Product[] =>
  (rows ?? []).map(normalizeProduct);

export interface RecommendationListResponse {
  message: string;
  data: RawProduct[];
}

export interface PersonalizedResponse extends RecommendationListResponse {
  isPersonalized: boolean;
}

export interface AllCollectionsResponse {
  message: string;
  data: {
    newArrivals: RawProduct[];
    onSale: RawProduct[];
    featured: RawProduct[];
  };
}

export interface PersonalizedResult {
  products: Product[];
  isPersonalized: boolean;
}

export interface AllCollectionsResult {
  newArrivals: Product[];
  onSale: Product[];
  featured: Product[];
}

export const recommendationService = {
  /** Most-ordered products of the last 30 days. */
  async getTrending(params: { limit?: number } = {}) {
    const response = await api.get<RecommendationListResponse>('/recommendations/trending', { params });
    return normalizeList(response.data.data);
  },

  /**
   * Products created within the last `days` days (backend default: 30).
   * A store that has not added stock inside that window legitimately returns
   * an empty list.
   */
  async getNewArrivals(params: { limit?: number; days?: number } = {}) {
    const response = await api.get<RecommendationListResponse>('/recommendations/new-arrivals', { params });
    return normalizeList(response.data.data);
  },

  /** Highest all-time ordered quantity. */
  async getBestSellers(params: { limit?: number } = {}) {
    const response = await api.get<RecommendationListResponse>('/recommendations/best-sellers', { params });
    return normalizeList(response.data.data);
  },

  /** Products that have at least one variant whose originalPrice exceeds its price. */
  async getOnSale(params: { limit?: number } = {}) {
    const response = await api.get<RecommendationListResponse>('/recommendations/on-sale', { params });
    return normalizeList(response.data.data);
  },

  /**
   * Category/brand affinity from the caller's last 5 orders, falling back to a
   * random selection for anonymous users. `isPersonalized` only reports whether
   * a user was authenticated, not whether affinity data was actually found.
   */
  async getPersonalized(params: { limit?: number } = {}): Promise<PersonalizedResult> {
    const response = await api.get<PersonalizedResponse>('/recommendations/personalized', { params });
    return {
      products: normalizeList(response.data.data),
      isPersonalized: response.data.isPersonalized,
    };
  },

  /** New arrivals, on-sale and a random "featured" set in a single round trip. */
  async getAllCollections(params: { limit?: number } = {}): Promise<AllCollectionsResult> {
    const response = await api.get<AllCollectionsResponse>('/recommendations/all-collections', { params });
    const { newArrivals, onSale, featured } = response.data.data;
    return {
      newArrivals: normalizeList(newArrivals),
      onSale: normalizeList(onSale),
      featured: normalizeList(featured),
    };
  },
};
