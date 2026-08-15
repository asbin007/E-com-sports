import api from './api';

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  message: string;
  data: Review[];
  stats: ReviewStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewResponse {
  message: string;
  data: Review;
}

export const reviewService = {
  async getProductReviews(productId: string, page = 1, limit = 10) {
    const response = await api.get<ReviewsResponse>(`/reviews/product/${productId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  async createReview(data: { productId: string; rating: number; title?: string; comment?: string }) {
    const response = await api.post<ReviewResponse>('/reviews', data);
    return response.data;
  },

  async updateReview(reviewId: string, data: { rating?: number; title?: string; comment?: string }) {
    const response = await api.put<ReviewResponse>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  async deleteReview(reviewId: string) {
    const response = await api.delete<{ message: string }>(`/reviews/${reviewId}`);
    return response.data;
  },

  async getMyReviews() {
    const response = await api.get<{ message: string; data: Review[] }>('/reviews/me');
    return response.data;
  },
};