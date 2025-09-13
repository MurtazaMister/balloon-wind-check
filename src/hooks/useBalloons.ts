import { useQuery } from '@tanstack/react-query';
import { fetchLast24h } from '../lib/windborne';
import type { Sample } from '../types/balloon';

export function useBalloons(): { 
  data?: Sample[]; 
  isLoading: boolean; 
  error?: unknown; 
  refetch(): void 
} {
  const query = useQuery({
    queryKey: ['balloons', 'last24h'],
    queryFn: fetchLast24h,
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  console.log('useBalloons hook state:', {
    isLoading: query.isLoading,
    error: query.error,
    dataLength: query.data?.length || 0,
    hasData: !!query.data
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
