// mobile/hooks/useReceiptStats.ts
import { useState, useEffect, useCallback } from 'react';
import receiptService, { ReceiptStats } from '../services/receiptService';

export const useReceiptStats = () => {
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await receiptService.getReceiptStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching receipt stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
};