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
  is_approved: boolean; 
  created_by?: number;  
  created_by_username?: string;  
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
  is_approved: boolean;  // NEW
  created_by?: number;  // NEW
  created_by_username?: string;  // NEW
  created_at: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  is_approved: boolean;  // NEW
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
  is_approved: boolean;  // NEW
  created_by?: number;  // NEW
  created_by_username?: string;  // NEW
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
  is_approved: boolean;  // NEW
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
  is_approved: boolean;  // NEW
  source: string;
  created_by?: number;  // NEW
  created_by_username?: string;  // NEW
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

export interface StoreCreateData {
  name: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parent?: number;
}

export interface ProductCreateData {
  name: string;
  normalized_name: string;
  category?: number;
  brand: string;
  unit: string;
  barcode?: string;
  description?: string;
}

export interface AddPriceData {
  product: number;
  store: number;
  price: number;
  date_recorded?: string;
  source?: string;
}

// NEW: Pending approvals summary
export interface PendingApprovalsCount {
  pending_stores: number;
  pending_categories: number;
  pending_products: number;
  pending_prices: number;
  total_pending: number;
}

// NEW: All pending items
export interface AllPendingItems {
  stores: Store[];
  categories: Category[];
  products: Product[];
  prices: PriceHistory[];
}

class ProductService {
  // ===================== STORE ENDPOINTS =====================

  // Get all stores
  async getStores(): Promise<Store[]> {
    try {
      const response = await api.get<Store[]>('/products/stores/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get pending stores (staff only)
  async getPendingStores(): Promise<Store[]> {
    try {
      const response = await api.get<Store[]>('/products/stores/pending/');
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

  // Create store
  async createStore(data: StoreCreateData): Promise<Store> {
    try {
      const response = await api.post<Store>('/products/stores/create/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Approve store (staff only)
  async approveStore(id: number): Promise<Store> {
    try {
      const response = await api.patch<Store>(`/products/stores/${id}/approve/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reject store (staff only)
  async rejectStore(id: number): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/products/stores/${id}/reject/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update store
  async updateStore(id: number, data: Partial<StoreCreateData>): Promise<Store> {
    try {
      const response = await api.patch<Store>(`/products/stores/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete store
  async deleteStore(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/products/stores/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ===================== CATEGORY ENDPOINTS =====================

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>('/products/categories/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get pending categories (staff only)
  async getPendingCategories(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>('/products/categories/pending/');
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

  // Create category
  async createCategory(data: CategoryCreateData): Promise<Category> {
    try {
      const response = await api.post<Category>('/products/categories/create/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Approve category (staff only)
  async approveCategory(id: number): Promise<Category> {
    try {
      const response = await api.patch<Category>(`/products/categories/${id}/approve/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reject category (staff only)
  async rejectCategory(id: number): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/products/categories/${id}/reject/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update category
  async updateCategory(id: number, data: Partial<CategoryCreateData>): Promise<Category> {
    try {
      const response = await api.patch<Category>(`/products/categories/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete category
  async deleteCategory(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/products/categories/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ===================== PRODUCT ENDPOINTS =====================

  // Get all products with filters
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<ProductSummary>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category.toString());
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.page) params.append('page', filters.page.toString());
      
      const response = await api.get<PaginatedResponse<ProductSummary>>(
        `/products/products/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get pending products (staff only)
  async getPendingProducts(): Promise<Product[]> {
    try {
      const response = await api.get<Product[]>('/products/products/pending/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await api.get<Product>(`/products/products/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create product
  async createProduct(data: ProductCreateData): Promise<Product> {
    try {
      const response = await api.post<Product>('/products/products/create/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Approve product (staff only)
  async approveProduct(id: number): Promise<Product> {
    try {
      const response = await api.patch<Product>(`/products/products/${id}/approve/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reject product (staff only)
  async rejectProduct(id: number): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/products/products/${id}/reject/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update product
  async updateProduct(id: number, data: Partial<ProductCreateData>): Promise<Product> {
    try {
      const response = await api.patch<Product>(`/products/products/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete product
  async deleteProduct(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/products/products/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Search products
  async searchProducts(params: ProductSearchParams): Promise<ProductSummary[]> {
    try {
      const response = await api.post<ProductSummary[]>('/products/products/search/', params);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ===================== PRICE ENDPOINTS =====================

  // Get product price history
  async getProductPrices(productId: number, storeId?: number): Promise<PriceHistory[]> {
    try {
      const params = storeId ? `?store=${storeId}` : '';
      const response = await api.get<PriceHistory[]>(
        `/products/products/${productId}/prices/${params}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get pending prices (staff only)
  async getPendingPrices(): Promise<PriceHistory[]> {
    try {
      const response = await api.get<PriceHistory[]>('/products/prices/pending/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add price for a product
  async addPrice(data: AddPriceData): Promise<PriceHistory> {
    try {
      const response = await api.post<PriceHistory>('/products/prices/add/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Approve price (staff only)
  async approvePrice(id: number): Promise<PriceHistory> {
    try {
      const response = await api.patch<PriceHistory>(`/products/prices/${id}/approve/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reject price (staff only)
  async rejectPrice(id: number): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/products/prices/${id}/reject/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update price
  async updatePrice(id: number, data: Partial<AddPriceData>): Promise<PriceHistory> {
    try {
      const response = await api.patch<PriceHistory>(`/products/prices/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete price
  async deletePrice(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/products/prices/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Compare product prices across stores
  async compareProductPrices(productId: number): Promise<ProductPriceComparison> {
    try {
      const response = await api.get<ProductPriceComparison>(
        `/products/products/${productId}/compare/`
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
      const response = await api.post('/products/products/compare-multiple/', {
        product_ids: productIds,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ===================== ADMIN DASHBOARD ENDPOINTS =====================

  // Get pending approvals count (staff only)
  async getPendingApprovalsCount(): Promise<PendingApprovalsCount> {
    try {
      const response = await api.get<PendingApprovalsCount>('/products/admin/pending-count/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get all pending items (staff only)
  async getAllPendingItems(): Promise<AllPendingItems> {
    try {
      const response = await api.get<AllPendingItems>('/products/admin/pending-items/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new ProductService();