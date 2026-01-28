import api from './api';

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface ProductType {
  id: string;
  name: string;
  description?: string;
}

export const categoryService = {
  async getAllCategories() {
    const response = await api.get<{ message: string; data: Category[] }>('/categories');
    return response.data.data;
  }
};

export const brandService = {
  async getAllBrands() {
    const response = await api.get<{ message: string; data: Brand[] }>('/brands');
    return response.data.data;
  }
};

export const productTypeService = {
  async getAllProductTypes() {
    const response = await api.get<{ message: string; data: ProductType[] }>('/product-types');
    return response.data.data;
  }
};
