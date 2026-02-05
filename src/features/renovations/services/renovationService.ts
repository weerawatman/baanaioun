import { supabase } from '@/lib/supabase';
import { RenovationProject, RenovationStatus, ProjectType } from '@/types/database';
import { AppError, ErrorCodes, logger } from '@/shared/utils';

export interface RenovationFilters {
    status?: RenovationStatus;
    assetId?: string;
    projectType?: ProjectType;
}

export type CreateRenovationInput = Omit<RenovationProject, 'id' | 'created_at'>;
export type UpdateRenovationInput = Partial<CreateRenovationInput>;

/**
 * Service layer for Renovation Project data access
 * Centralizes all Supabase queries for renovation projects
 */
export class RenovationService {
    /**
     * Fetch renovation projects with optional filters
     */
    async getRenovations(filters?: RenovationFilters): Promise<RenovationProject[]> {
        try {
            logger.info('Fetching renovations', { filters });

            let query = supabase
                .from('renovation_projects')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.assetId) {
                query = query.eq('asset_id', filters.assetId);
            }

            if (filters?.projectType) {
                query = query.eq('project_type', filters.projectType);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error fetching renovations', error);
                throw new AppError(
                    'Failed to fetch renovation projects',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Renovations fetched successfully', { count: data?.length || 0 });
            return data || [];
        } catch (error) {
            logger.error('Unexpected error in getRenovations', error);
            throw error;
        }
    }

    /**
     * Get a single renovation project by ID
     */
    async getRenovationById(id: string): Promise<RenovationProject> {
        try {
            logger.info('Fetching renovation by ID', { id });

            const { data, error } = await supabase
                .from('renovation_projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching renovation', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Renovation project not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to fetch renovation project',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Renovation fetched successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in getRenovationById', error);
            throw error;
        }
    }

    /**
     * Create a new renovation project
     */
    async createRenovation(input: CreateRenovationInput): Promise<RenovationProject> {
        try {
            logger.info('Creating renovation', { input });

            const { data, error } = await supabase
                .from('renovation_projects')
                .insert(input)
                .select()
                .single();

            if (error) {
                logger.error('Error creating renovation', error);
                throw new AppError(
                    'Failed to create renovation project',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Renovation created successfully', { id: data.id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in createRenovation', error);
            throw error;
        }
    }

    /**
     * Update an existing renovation project
     */
    async updateRenovation(id: string, input: UpdateRenovationInput): Promise<RenovationProject> {
        try {
            logger.info('Updating renovation', { id, input });

            const { data, error } = await supabase
                .from('renovation_projects')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating renovation', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Renovation project not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to update renovation project',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Renovation updated successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in updateRenovation', error);
            throw error;
        }
    }

    /**
     * Delete a renovation project
     */
    async deleteRenovation(id: string): Promise<void> {
        try {
            logger.info('Deleting renovation', { id });

            const { error } = await supabase
                .from('renovation_projects')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('Error deleting renovation', error, { id });
                throw new AppError(
                    'Failed to delete renovation project',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Renovation deleted successfully', { id });
        } catch (error) {
            logger.error('Unexpected error in deleteRenovation', error);
            throw error;
        }
    }
}

// Export singleton instance
export const renovationService = new RenovationService();
