import { supabase } from '@/lib/supabase/client';
import { Lead, LeadStatus } from '@/types/database';

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

  async updateLead(id: string, data: { status?: LeadStatus; admin_notes?: string | null }): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update(data)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const leadsService = new LeadsService();
