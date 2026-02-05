import { supabase } from '@/lib/supabase';
import { Asset, AssetStatus, PropertyType } from '@/types/database';
import { AppError, ErrorCodes, logger } from '@/shared/utils';

export interface AssetFilters {
    status?: AssetStatus | 'all';
    propertyType?: PropertyType;
    search?: string;
}

export type CreateAssetInput = Omit<Asset, 'id' | 'created_at'>;
export type UpdateAssetInput = Partial<CreateAssetInput>;

/**
 * Service layer for Asset data access
 * Centralizes all Supabase queries for assets
 */
export class AssetService {
    /**
     * Fetch assets with optional filters
     */
    async getAssets(filters?: AssetFilters): Promise<Asset[]> {
        try {
            logger.info('Fetching assets', { filters });

            let query = supabase
                .from('assets')
                .select(`
          id,
          name,
          title_deed_number,
          property_type,
          status,
          purchase_price,
          appraised_value,
          mortgage_bank,
          mortgage_amount,
          fire_insurance_expiry,
          land_tax_due_date,
          tenant_name,
          tenant_contact,
          created_at
        `)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters?.propertyType) {
                query = query.eq('property_type', filters.propertyType);
            }

            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,title_deed_number.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error fetching assets', error);
                throw new AppError(
                    'Failed to fetch assets',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Assets fetched successfully', { count: data?.length || 0 });
            return data || [];
        } catch (error) {
            logger.error('Unexpected error in getAssets', error);
            throw error;
        }
    }

    /**
     * Get a single asset by ID
     */
    async getAssetById(id: string): Promise<Asset> {
        try {
            logger.info('Fetching asset by ID', { id });

            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching asset', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Asset not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to fetch asset',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Asset fetched successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in getAssetById', error);
            throw error;
        }
    }

    /**
     * Create a new asset
     */
    async createAsset(input: CreateAssetInput): Promise<Asset> {
        try {
            logger.info('Creating asset', { input });

            const { data, error } = await supabase
                .from('assets')
                .insert(input)
                .select()
                .single();

            if (error) {
                logger.error('Error creating asset', error);
                throw new AppError(
                    'Failed to create asset',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Asset created successfully', { id: data.id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in createAsset', error);
            throw error;
        }
    }

    /**
     * Update an existing asset
     */
    async updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
        try {
            logger.info('Updating asset', { id, input });

            const { data, error } = await supabase
                .from('assets')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating asset', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Asset not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to update asset',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Asset updated successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in updateAsset', error);
            throw error;
        }
    }

    /**
     * Delete an asset
     */
    async deleteAsset(id: string): Promise<void> {
        try {
            logger.info('Deleting asset', { id });

            const { error } = await supabase
                .from('assets')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('Error deleting asset', error, { id });
                throw new AppError(
                    'Failed to delete asset',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Asset deleted successfully', { id });
        } catch (error) {
            logger.error('Unexpected error in deleteAsset', error);
            throw error;
        }
    }
}

// Export singleton instance
export const assetService = new AssetService();
