import { supabase } from '@/lib/supabase';
import { Income } from '@/types/database';
import { AppError, ErrorCodes, logger } from '@/shared/utils';

export interface IncomeFilters {
    assetId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
}

export type CreateIncomeInput = Omit<Income, 'id' | 'created_at'>;
export type UpdateIncomeInput = Partial<CreateIncomeInput>;

/**
 * Service layer for Income data access
 * Centralizes all Supabase queries for income
 */
export class IncomeService {
    /**
     * Fetch income with optional filters
     */
    async getIncome(filters?: IncomeFilters): Promise<Income[]> {
        try {
            logger.info('Fetching income', { filters });

            let query = supabase
                .from('income')
                .select('*')
                .order('date', { ascending: false });

            // Apply filters
            if (filters?.assetId) {
                query = query.eq('asset_id', filters.assetId);
            }

            if (filters?.source) {
                query = query.ilike('source', `%${filters.source}%`);
            }

            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }

            // Create a promise that rejects in 10 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new AppError('Request timed out', ErrorCodes.NETWORK_ERROR, 408)), 10000);
            });

            const { data, error } = await Promise.race([
                query,
                timeoutPromise
            ]) as any;

            if (error) {
                logger.error('Error fetching income', error);
                throw new AppError(
                    'Failed to fetch income',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Income fetched successfully', { count: data?.length || 0 });
            return data || [];
        } catch (error) {
            logger.error('Unexpected error in getIncome', error);
            throw error;
        }
    }

    /**
     * Get a single income entry by ID
     */
    async getIncomeById(id: string): Promise<Income> {
        try {
            logger.info('Fetching income by ID', { id });

            const { data, error } = await supabase
                .from('income')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching income', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Income not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to fetch income',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Income fetched successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in getIncomeById', error);
            throw error;
        }
    }

    /**
     * Create a new income entry
     */
    async createIncome(input: CreateIncomeInput): Promise<Income> {
        try {
            logger.info('Creating income', { input });

            const { data, error } = await supabase
                .from('income')
                .insert(input)
                .select()
                .single();

            if (error) {
                logger.error('Error creating income', error);
                throw new AppError(
                    'Failed to create income',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Income created successfully', { id: data.id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in createIncome', error);
            throw error;
        }
    }

    /**
     * Update an existing income entry
     */
    async updateIncome(id: string, input: UpdateIncomeInput): Promise<Income> {
        try {
            logger.info('Updating income', { id, input });

            const { data, error } = await supabase
                .from('income')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating income', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Income not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to update income',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Income updated successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in updateIncome', error);
            throw error;
        }
    }

    /**
     * Delete an income entry
     */
    async deleteIncome(id: string): Promise<void> {
        try {
            logger.info('Deleting income', { id });

            const { error } = await supabase
                .from('income')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('Error deleting income', error, { id });
                throw new AppError(
                    'Failed to delete income',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Income deleted successfully', { id });
        } catch (error) {
            logger.error('Unexpected error in deleteIncome', error);
            throw error;
        }
    }

    /**
     * Get total income by asset
     */
    async getTotalByAsset(assetId: string, filters?: Omit<IncomeFilters, 'assetId'>): Promise<number> {
        try {
            const income = await this.getIncome({ ...filters, assetId });
            return income.reduce((total, entry) => total + entry.amount, 0);
        } catch (error) {
            logger.error('Unexpected error in getTotalByAsset', error);
            throw error;
        }
    }
}

// Export singleton instance
export const incomeService = new IncomeService();
