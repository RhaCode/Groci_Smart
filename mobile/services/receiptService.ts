// mobile/services/receiptService.ts
import api, { handleApiError, PaginatedResponse, createFormData } from './api';

// Types
export interface Receipt {
  id: number;
  user: number;
  store_name: string;
  store_location: string;
  purchase_date: string | null;
  total_amount: string;
  tax_amount: string | null;
  receipt_image: string;
  receipt_image_url: string;
  receipt_thumbnail_url: string;
  ocr_text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string;
  items: ReceiptItem[];
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReceiptItem {
  id: number;
  receipt: number;
  product_name: string;
  normalized_name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  category: string;
  product: number | null;
  product_name_display: string | null;
  product_brand: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptListItem {
  id: number;
  store_name: string;
  store_location: string;
  purchase_date: string | null;
  total_amount: string;
  status: string;
  items_count: number;
  receipt_thumbnail_url: string;
  created_at: string;
}

export interface ReceiptUploadData {
  receipt_image: {
    uri: string;
    type: string;
    name: string;
  };
  store_name?: string;
  store_location?: string;
  purchase_date?: string;
}

export interface ReceiptUpdateData {
  store_name?: string;
  store_location?: string;
  purchase_date?: string;
  total_amount?: string;
  tax_amount?: string;
}

export interface ReceiptItemCreateData {
  product_name: string;
  normalized_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  category?: string;
  product?: number;
}

export interface ReceiptStats {
  total_receipts: number;
  total_spent: string;
  receipts_this_month: number;
  spent_this_month: string;
  top_stores: Array<{
    store_name: string;
    receipt_count: number;
    total_spent: string;
  }>;
  recent_receipts: ReceiptListItem[];
}

export interface MonthlySpending {
  month: string;
  total: number;
  count: number;
}

export interface ReceiptFilters {
  status?: string;
  store?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

class ReceiptService {
  // Get all receipts with filters
  async getReceipts(filters?: ReceiptFilters): Promise<PaginatedResponse<ReceiptListItem>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.store) params.append('store', filters.store);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.page) params.append('page', filters.page.toString());
      
      const response = await api.get<PaginatedResponse<ReceiptListItem>>(
        `/receipts/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get receipt by ID
  async getReceiptById(id: number): Promise<Receipt> {
    try {
      const response = await api.get<Receipt>(`/receipts/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Upload new receipt
  async uploadReceipt(data: ReceiptUploadData): Promise<Receipt> {
    try {
      const formData = createFormData(data);
      
      const response = await api.post<Receipt>('/receipts/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update receipt
  async updateReceipt(id: number, data: ReceiptUpdateData): Promise<Receipt> {
    try {
      const response = await api.patch<Receipt>(`/receipts/${id}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete receipt
  async deleteReceipt(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/receipts/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Reprocess receipt OCR
  async reprocessReceipt(id: number): Promise<Receipt> {
    try {
      const response = await api.post<Receipt>(`/receipts/${id}/reprocess/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get receipt items
  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    try {
      const response = await api.get<ReceiptItem[]>(`/receipts/${receiptId}/items/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add single item to receipt
  async addReceiptItem(receiptId: number, data: ReceiptItemCreateData): Promise<ReceiptItem> {
    try {
      const response = await api.post<ReceiptItem>(
        `/receipts/${receiptId}/items/add/`,
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add multiple items to receipt
  async addReceiptItemsBulk(
    receiptId: number,
    items: ReceiptItemCreateData[]
  ): Promise<ReceiptItem[]> {
    try {
      const response = await api.post<ReceiptItem[]>(
        `/receipts/${receiptId}/items/bulk/`,
        { items }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update receipt item
  async updateReceiptItem(
    receiptId: number,
    itemId: number,
    data: Partial<ReceiptItemCreateData>
  ): Promise<ReceiptItem> {
    try {
      const response = await api.patch<ReceiptItem>(
        `/receipts/${receiptId}/items/${itemId}/update/`,
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete receipt item
  async deleteReceiptItem(receiptId: number, itemId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/receipts/${receiptId}/items/${itemId}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get receipt statistics
  async getReceiptStats(): Promise<ReceiptStats> {
    try {
      const response = await api.get<ReceiptStats>('/receipts/stats/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get monthly spending
  async getMonthlySpending(): Promise<MonthlySpending[]> {
    try {
      const response = await api.get<MonthlySpending[]>('/receipts/stats/monthly/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new ReceiptService();