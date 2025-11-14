// mobile/services/productService.ts
import api, { handleApiError, PaginatedResponse } from './api';

// Types
export interface Store {
  id: number;
  name: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: number;
  parent_name?: string;
  subcategories?: CategorySummary[];
  created_at: string;
}

export interface CategorySummary {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  normalized_name: string;
  category: number | null;
  category_name: string | null;
  brand: string;
  unit: string;
  barcode: string;
  description: string;
  is_active: boolean;
  current_prices: PriceHistory[];
  lowest_price: {
    price: number;
    store: string;
    store_id: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  brand: string;
  unit: string;
  category_name: string | null;
  lowest_price: number | null;
}

export interface PriceHistory {
  id: number;
  product: number;
  store: number;
  store_name: string;
  store_location: string;
  price: string;
  date_recorded: string;
  is_active: boolean;
  source: string;
  created_at: string;
}

export interface ProductPriceComparison {
  product_id: number;
  product_name: string;
  brand: string;
  prices: Array<{
    store_id: number;
    store_name: string;
    store_location: string;
    price: number;
    date_recorded: string;
  }>;
  lowest_price: number;
  highest_price: number;
  price_difference: number;
  savings_percentage: number;
}

export interface ProductSearchParams {
  query: string;
  category?: number;
  store?: number;
}

export interface ProductFilters {
  category?: number;
  brand?: string;
  page?: number;
}

class ProductService {
  // Get all stores
  async getStores(): Promise<Store[]> {
    try {
      const response = await api.get<Store[]>('/products/stores/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get store by ID
  async getStoreById(id: number): Promise<Store> {
    try {
      const response = await api.get<Store>(`/products/stores/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>('/products/categories/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category> {
    try {
      const response = await api.get<Category>(`/products/categories/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get all products with filters
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductSummary>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category.toString());
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.page) params.append('page', filters.page.toString());
      
      const response = await api.get<PaginatedResponse<ProductSummary>>(
        `/products/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await api.get<Product>(`/products/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Search products
  async searchProducts(params: ProductSearchParams): Promise<ProductSummary[]> {
    try {
      const response = await api.post<ProductSummary[]>('/products/search/', params);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get product price history
  async getProductPrices(productId: number, storeId?: number): Promise<PriceHistory[]> {
    try {
      const params = storeId ? `?store=${storeId}` : '';
      const response = await api.get<PriceHistory[]>(
        `/products/${productId}/prices/${params}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Compare product prices across stores
  async compareProductPrices(productId: number): Promise<ProductPriceComparison> {
    try {
      const response = await api.get<ProductPriceComparison>(
        `/products/${productId}/compare/`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Compare multiple products
  async compareMultipleProducts(
    productIds: number[]
  ): Promise<{ results: ProductPriceComparison[] }> {
    try {
      const response = await api.post('/products/compare-multiple/', {
        product_ids: productIds,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add price for a product
  async addPrice(data: {
    product: number;
    store: number;
    price: number;
    date_recorded?: string;
    source?: string;
  }): Promise<PriceHistory> {
    try {
      const response = await api.post<PriceHistory>('/products/prices/add/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new ProductService();