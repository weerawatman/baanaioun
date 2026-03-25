import { supabase } from '@/lib/supabase/client';
import { AssetImage, ImageCategory } from '@/types/database';
import { AppError, ErrorCodes, logger, withTimeout } from '@/shared/utils';

export interface CreateImageInput {
    asset_id: string;
    url: string;
    category: ImageCategory;
    is_primary: boolean;
    renovation_project_id?: string | null;
}

/**
 * Service layer for Asset Image data access
 * Centralizes all Supabase queries for asset images
 */
export class ImageService {
    /**
     * Fetch images for an asset
     */
    async getImagesByAssetId(assetId: string): Promise<AssetImage[]> {
        try {
            logger.info('Fetching images for asset', { assetId });

            const { data, error } = await withTimeout(
                supabase
                    .from('asset_images')
                    .select('id, asset_id, renovation_project_id, url, caption, is_primary, category, created_at')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false })
            );

            if (error) {
                logger.error('Error fetching images', error);
                throw new AppError(
                    'Failed to fetch images',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            return data || [];
        } catch (error) {
            logger.error('Unexpected error in getImagesByAssetId', error);
            throw error;
        }
    }

    /**
     * Upload a file to storage and create image record
     */
    async uploadImage(
        file: File,
        assetId: string,
        category: ImageCategory,
        isFirst: boolean,
        renovationProjectId?: string | null,
    ): Promise<AssetImage> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${assetId}/${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        try {
            // Phase 1: Upload to storage
            const { error: uploadError } = await withTimeout(
                supabase.storage
                    .from('asset-files')
                    .upload(fileName, file)
            );

            if (uploadError) {
                throw new AppError(
                    `Failed to upload ${file.name}: ${uploadError.message}`,
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: uploadError }
                );
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('asset-files')
                .getPublicUrl(fileName);

            // Phase 2: Save to database
            const { data, error: dbError } = await withTimeout(
                supabase
                    .from('asset_images')
                    .insert({
                        asset_id: assetId,
                        url: publicUrl,
                        category,
                        is_primary: isFirst,
                        renovation_project_id: renovationProjectId || null,
                    })
                    .select()
                    .single()
            );

            if (dbError) {
                // Rollback: remove orphaned file from storage
                await supabase.storage.from('asset-files').remove([fileName]).catch(() => {});
                throw new AppError(
                    `Failed to save image record: ${dbError.message}`,
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: dbError }
                );
            }

            logger.info('Image uploaded successfully', { id: data.id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in uploadImage', error);
            throw error;
        }
    }

    /**
     * Delete an image from storage and database
     */
    async deleteImage(image: AssetImage): Promise<void> {
        try {
            logger.info('Deleting image', { id: image.id });

            // Phase 1: Delete from database first (reversible if storage delete fails)
            const { error } = await withTimeout(
                supabase
                    .from('asset_images')
                    .delete()
                    .eq('id', image.id)
            );

            if (error) {
                throw new AppError(
                    'Failed to delete image',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            // Phase 2: Remove file from storage (best-effort cleanup)
            const urlParts = image.url.split('/asset-files/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from('asset-files').remove([filePath]).catch((err) => {
                    logger.error('Failed to remove file from storage (orphaned)', err);
                });
            }

            logger.info('Image deleted successfully', { id: image.id });
        } catch (error) {
            logger.error('Unexpected error in deleteImage', error);
            throw error;
        }
    }
}

// Export singleton instance
export const imageService = new ImageService();
