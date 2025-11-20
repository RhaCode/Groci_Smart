// mobile/services/shoppingListService.ts
import api, { handleApiError, PaginatedResponse } from './api';

// Types
export interface ShoppingList {
  id: number;
  user: number;
  name: string;
  status: 'active' | 'completed' | 'archived';
  notes: string;
  estimated_total: string;
  items: ShoppingListItem[];
  items_count: number;
  checked_items_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: number;
  shopping_list: number;
  product: number | null;
  product_details: {
    id: number;
    name: string;
    brand: string;
    lowest_price: number | null;
  } | null;
  product_name: string;
  product_brand: string | null;
  quantity: string;
  unit: string;
  estimated_price: string | null;
  notes: string;
  is_checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListSummary {
  id: number;
  name: string;
  status: string;
  estimated_total: string;
  items_count: number;
  checked_items_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListCreateData {
  name: string;
  status?: 'active' | 'completed' | 'archived';
  notes?: string;
}

export interface ShoppingListItemCreateData {
  product?: number;
  product_name: string;
  quantity: number;
  unit?: string;
  estimated_price?: number;
  notes?: string;
  position?: number;
}

export interface PriceComparison {
  list_id: number;
  list_name: string;
  items: PriceComparisonItem[];
  store_totals: Record<string, number>;
  best_store: string;
  potential_savings: string;
  message?: string;
}

export interface PriceComparisonItem {
  item_id: number;
  product_name: string;
  quantity: number;
  stores: StorePrice[];
  best_price: number;
  best_store: string;
}

export interface StorePrice {
  store_id: number;
  store_name: string;
  unit_price: number;
  total_price: number;
}

export interface ListFilters {
  status?: string;
  page?: number;
}

class ShoppingListService {
  // Get all shopping lists
  async getShoppingLists(filters?: ListFilters): Promise<PaginatedResponse<ShoppingListSummary>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      
      const response = await api.get<PaginatedResponse<ShoppingListSummary>>(
        `/shopping-lists/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get shopping list by ID
  async getShoppingListById(id: number): Promise<ShoppingList> {
    try {
      const response = await api.get<ShoppingList>(`/shopping-lists/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create new shopping list
  async createShoppingList(data: ShoppingListCreateData): Promise<ShoppingList> {
    try {
      const response = await api.post<ShoppingList>('/shopping-lists/create/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update shopping list
  async updateShoppingList(
    id: number,
    data: Partial<ShoppingListCreateData>
  ): Promise<ShoppingList> {
    try {
      const response = await api.patch<ShoppingList>(`/shopping-lists/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete shopping list
  async deleteShoppingList(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/shopping-lists/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Duplicate shopping list
  async duplicateShoppingList(id: number): Promise<ShoppingList> {
    try {
      const response = await api.post<ShoppingList>(`/shopping-lists/${id}/duplicate/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get list items
  async getListItems(listId: number, isChecked?: boolean): Promise<ShoppingListItem[]> {
    try {
      const params = isChecked !== undefined ? `?is_checked=${isChecked}` : '';
      const response = await api.get<ShoppingListItem[]>(
        `/shopping-lists/${listId}/items/${params}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add single item to list
  async addListItem(
    listId: number,
    data: ShoppingListItemCreateData
  ): Promise<ShoppingListItem> {
    try {
      const response = await api.post<ShoppingListItem>(
        `/shopping-lists/${listId}/items/add/`,
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add multiple items to list
  async addListItemsBulk(
    listId: number,
    items: ShoppingListItemCreateData[]
  ): Promise<ShoppingListItem[]> {
    try {
      const response = await api.post<ShoppingListItem[]>(
        `/shopping-lists/${listId}/items/bulk/`,
        { items }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update list item
  async updateListItem(
    listId: number,
    itemId: number,
    data: Partial<ShoppingListItemCreateData> & { is_checked?: boolean }
  ): Promise<ShoppingListItem> {
    try {
      const response = await api.patch<ShoppingListItem>(
        `/shopping-lists/${listId}/items/${itemId}/update/`,
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete list item
  async deleteListItem(listId: number, itemId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/shopping-lists/${listId}/items/${itemId}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Toggle item checked status
  async toggleItemChecked(listId: number, itemId: number): Promise<ShoppingListItem> {
    try {
      const response = await api.post<ShoppingListItem>(
        `/shopping-lists/${listId}/items/${itemId}/toggle/`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Clear all checked items
  async clearCheckedItems(listId: number): Promise<{ message: string; deleted_count: number }> {
    try {
      const response = await api.post(`/shopping-lists/${listId}/items/clear-checked/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reorder items
  async reorderItems(
    listId: number,
    itemOrders: Array<{ item_id: number; position: number }>
  ): Promise<{ message: string }> {
    try {
      const response = await api.post(`/shopping-lists/${listId}/items/reorder/`, {
        item_orders: itemOrders,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Generate list from receipt
  async generateListFromReceipt(
    receiptId: number,
    listName?: string
  ): Promise<ShoppingList> {
    try {
      const response = await api.post<ShoppingList>(
        '/shopping-lists/generate-from-receipt/',
        {
          receipt_id: receiptId,
          list_name: listName,
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Compare list prices across stores
  async compareListPrices(listId: number): Promise<PriceComparison> {
    try {
      const response = await api.get<PriceComparison>(
        `/shopping-lists/${listId}/compare-prices/`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Auto-estimate prices for items
  async autoEstimatePrices(
    listId: number
  ): Promise<{ message: string; updated_count: number; estimated_total: number }> {
    try {
      const response = await api.post(`/shopping-lists/${listId}/auto-estimate/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new ShoppingListService();