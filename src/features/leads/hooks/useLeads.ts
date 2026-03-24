import useSWR from 'swr';
import { leadsService, LeadWithAsset } from '../services/leadsService';
import { LeadStatus } from '@/types/database';

interface UseLeadsReturn {
  leads: LeadWithAsset[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateLead: (id: string, data: { status?: LeadStatus; admin_notes?: string | null }) => Promise<void>;
}

export function useLeads(): UseLeadsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'leads',
    () => leadsService.getLeads(),
    { revalidateOnFocus: false }
  );

  const updateLead = async (id: string, patch: { status?: LeadStatus; admin_notes?: string | null }) => {
    // Optimistic update
    await mutate(
      async (current) => {
        await leadsService.updateLead(id, patch);
        return current?.map(l => l.id === id ? { ...l, ...patch } : l);
      },
      { revalidate: false }
    );
  };

  return {
    leads: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: async () => { await mutate(); },
    updateLead,
  };
}
