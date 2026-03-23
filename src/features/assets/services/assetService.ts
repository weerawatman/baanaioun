import { supabase } from '@/lib/supabase';
import { Asset, AssetStatus, PropertyType } from '@/types/database';
import { AppError, ErrorCodes, logger, withTimeout } from '@/shared/utils';

export interface AssetFilters {
    status?: AssetStatus | 'all';
    propertyType?: PropertyType;
    search?: string;
}

export interface AssetPagination {
    page: number;
    pageSize: number;
}

export interface AssetsResult {
    data: Asset[];
    count: number;
}

export type CreateAssetInput = Omit<Asset, 'id' | 'created_at' | 'asset_code'>;
export type UpdateAssetInput = Partial<CreateAssetInput>;

/** Map common Postgres/PostgREST error codes to actionable Thai messages */
function formatDbError(error: { message: string; code?: string; hint?: string; details?: string }): string {
    console.error('--- formatDbError Trace ---', { code: error.code, message: error.message, hint: error.hint, details: error.details });
    switch (error.code) {
        case '42501':  // insufficient_privilege (RLS block)
            return 'ไม่มีสิทธิ์บันทึกข้อมูล — กรุณาออกจากระบบแล้วเข้าใหม่';
        case '23505':  // unique_violation
            return `ข้อมูลซ้ำกัน: ${error.details || error.message}`;
        case '23502':  // not_null_violation
            return `ข้อมูลไม่ครบถ้วน: ${error.details || error.message}`;
        case '23503':  // foreign_key_violation
            return `ข้อมูลอ้างอิงไม่ถูกต้อง: ${error.details || error.message}`;
        case 'PGRST301':  // JWT expired
            return 'เซสชันหมดอายุ — กรุณารีเฟรชหน้าหรือเข้าสู่ระบบใหม่';
        default:
            return error.message || 'เกิดข้อผิดพลาดในฐานข้อมูล';
    }
}

/**
 * Service layer for Asset data access
 * Centralizes all Supabase queries for assets
 */
export class AssetService {
    /**
     * Fetch assets with optional filters and server-side pagination
     */
    async getAssets(filters?: AssetFilters, pagination?: AssetPagination): Promise<AssetsResult> {
        try {
            logger.info('Fetching assets', { filters, pagination });

            let query = supabase
                .from('assets')
                .select(`
          id,
          asset_code,
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
        `, { count: 'exact' })
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

            // Apply server-side pagination
            if (pagination) {
                const from = (pagination.page - 1) * pagination.pageSize;
                const to = from + pagination.pageSize - 1;
                query = query.range(from, to);
            }

            const { data, error, count } = await withTimeout(query);

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
            return { data: data || [], count: count ?? 0 };
        } catch (error) {
            logger.error('Unexpected error in getAssets', error);
            throw error;
        }
    }

    /**
     * Get asset count grouped by status (lightweight query for filter bar badges)
     */
    async getStatusCounts(): Promise<Record<AssetStatus | 'all', number>> {
        try {
            const { data, error } = await withTimeout(
                supabase.from('assets').select('status')
            );

            if (error) {
                logger.error('Error fetching status counts', error);
                throw new AppError('Failed to fetch status counts', ErrorCodes.DATABASE_ERROR, 500, { originalError: error });
            }

            const counts: Record<string, number> = {
                all: 0,
                developing: 0,
                ready_for_sale: 0,
                ready_for_rent: 0,
                rented: 0,
                sold: 0,
            };

            for (const row of data || []) {
                counts.all++;
                if (row.status in counts) counts[row.status]++;
            }

            return counts as Record<AssetStatus | 'all', number>;
        } catch (error) {
            logger.error('Unexpected error in getStatusCounts', error);
            throw error;
        }
    }

    /**
     * Get a single asset by ID
     */
    async getAssetById(id: string): Promise<Asset> {
        try {
            logger.info('Fetching asset by ID', { id });

            const { data, error } = await withTimeout(
                supabase.from('assets').select(`
                    id, asset_code, created_at,
                    title_deed_number, name, address,
                    property_type, status, notes,
                    purchase_price, purchase_date, appraised_value,
                    mortgage_bank, mortgage_amount,
                    fire_insurance_expiry, land_tax_due_date,
                    selling_price, rental_price, description,
                    location_lat_long, tenant_name, tenant_contact
                `).eq('id', id).single()
            );

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
            console.log('--- Database Insert Payload Trace ---');
            console.log('Payload:', JSON.stringify(input, null, 2));
            console.log('Table: assets');
            logger.info('Creating asset', { input });

            // Reduce timeout to 30s for faster feedback during debugging
            const { data, error } = await withTimeout(
                supabase.from('assets').insert(input).select().single(),
                30000
            );

            if (error) {
                console.error('--- Database Insert Error Trace ---');
                console.error('Full Error Object:', JSON.stringify(error, null, 2));
                console.error('Error Code:', error.code);
                console.error('Error Message:', error.message);
                
                // Alert user with specific database error for debugging
                const rawMsg = `DB Error ${error.code}: ${error.message}`;
                alert(`ไม่สามารถบันทึกได้: ${rawMsg}`);

                throw new AppError(
                    formatDbError(error),
                    error.code === '42501' ? ErrorCodes.FORBIDDEN : ErrorCodes.DATABASE_ERROR,
                    error.code === '42501' ? 403 : 500,
                    { originalError: error }
                );
            }

            if (!data) {
                throw new AppError('Failed to retrieve created asset', ErrorCodes.DATABASE_ERROR, 500);
            }

            console.log('--- Database Insert Success ---');
            console.log('Inserted ID:', data.id);
            logger.info('Asset created successfully', { id: data.id });
            return data;
        } catch (error) {
            console.error('--- Unexpected Error in assetService.createAsset ---');
            console.error(error);
            
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'))) {
              alert('การบันทึกค้าง (Timeout) — อาจเกิดจาก Trigger ในฐานข้อมูลมีปัญหา หรือระบบ Lock');
            }
            
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

            const { data, error } = await withTimeout(
                supabase.from('assets').update(input).eq('id', id).select().single()
            );

            if (error) {
                logger.error('Error updating asset', error, { id, code: error.code, details: error.details });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'ไม่พบทรัพย์สินที่ต้องการแก้ไข',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    formatDbError(error),
                    error.code === '42501' ? ErrorCodes.FORBIDDEN : ErrorCodes.DATABASE_ERROR,
                    error.code === '42501' ? 403 : 500,
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

            const { error } = await withTimeout(
                supabase.from('assets').delete().eq('id', id)
            );

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
