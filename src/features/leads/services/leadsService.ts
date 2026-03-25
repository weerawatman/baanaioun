import { supabase } from '@/lib/supabase/client';
import { Lead, LeadStatus } from '@/types/database';
import { AppError, ErrorCodes, logger, withTimeout } from '@/shared/utils';

export interface LeadWithAsset extends Lead {
  assets: { name: string } | null;
}

class LeadsService {
  async getLeads(): Promise<LeadWithAsset[]> {
    try {
      logger.info('Fetching leads');

      const { data, error } = await withTimeout(
        supabase
          .from('leads')
          .select('*, assets(name)')
          .order('created_at', { ascending: false })
      );

      if (error) {
        logger.error('Error fetching leads', error);
        throw new AppError(
          'Failed to fetch leads',
          ErrorCodes.DATABASE_ERROR,
          500,
          { originalError: error }
        );
      }

      return (data ?? []) as LeadWithAsset[];
    } catch (error) {
      logger.error('Unexpected error in getLeads', error);
      throw error;
    }
  }

  async updateLead(id: string, data: { status?: LeadStatus; admin_notes?: string | null }): Promise<void> {
    try {
      logger.info('Updating lead', { id, data });

      const { error } = await withTimeout(
        supabase
          .from('leads')
          .update(data)
          .eq('id', id)
      );

      if (error) {
        logger.error('Error updating lead', error, { id });
        throw new AppError(
          'Failed to update lead',
          ErrorCodes.DATABASE_ERROR,
          500,
          { originalError: error }
        );
      }

      logger.info('Lead updated successfully', { id });
    } catch (error) {
      logger.error('Unexpected error in updateLead', error);
      throw error;
    }
  }
}

export const leadsService = new LeadsService();
