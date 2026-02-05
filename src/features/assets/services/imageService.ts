import { supabase } from '@/lib/supabase';
import { AssetImage, ImageCategory } from '@/types/database';
import { AppError, ErrorCodes, logger } from '@/shared/utils';

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

            const { data, error } = await supabase
                .from('asset_images')
                .select('*')
                .eq('asset_id', assetId)
                .order('created_at', { ascending: false });

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
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${assetId}/${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('asset-files')
                .upload(fileName, file);

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

            // Save to database
            const { data, error: dbError } = await supabase
                .from('asset_images')
                .insert({
                    asset_id: assetId,
                    url: publicUrl,
                    category,
                    is_primary: isFirst,
                    renovation_project_id: renovationProjectId || null,
                })
                .select()
                .single();

            if (dbError) {
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

            // Extract file path from URL and remove from storage
            const urlParts = image.url.split('/asset-files/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from('asset-files').remove([filePath]);
            }

            // Delete from database
            const { error } = await supabase
                .from('asset_images')
                .delete()
                .eq('id', image.id);

            if (error) {
                throw new AppError(
                    'Failed to delete image',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
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
