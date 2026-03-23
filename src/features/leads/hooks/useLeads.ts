import useSWR from 'swr';
import { leadsService, LeadWithAsset } from '../services/leadsService';

interface UseLeadsReturn {
  leads: LeadWithAsset[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLeads(): UseLeadsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'leads',
    () => leadsService.getLeads(),
    { revalidateOnFocus: false }
  );

  return {
    leads: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: async () => { await mutate(); },
  };
}
