import { supabase } from '@/lib/supabase/client';
import { Lead } from '@/types/database';

export interface LeadWithAsset extends Lead {
  assets: { name: string } | null;
}

class LeadsService {
  async getLeads(): Promise<LeadWithAsset[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, assets(name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadWithAsset[];
  }
}

export const leadsService = new LeadsService();
