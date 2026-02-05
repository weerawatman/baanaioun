import { useState, useCallback } from 'react';
import { Asset } from '@/types/database';
import { assetService, CreateAssetInput, UpdateAssetInput } from '../services/assetService';
import { handleError, logger } from '@/shared/utils';

interface UseAssetMutationsReturn {
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: Error | null;
    createAsset: (input: CreateAssetInput) => Promise<Asset | null>;
    updateAsset: (id: string, input: UpdateAssetInput) => Promise<Asset | null>;
    deleteAsset: (id: string) => Promise<boolean>;
}

/**
 * Custom hook for asset mutations (create, update, delete)
 * @returns Mutation functions and loading states
 */
export function useAssetMutations(): UseAssetMutationsReturn {
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createAsset = useCallback(async (input: CreateAssetInput): Promise<Asset | null> => {
        try {
            setCreating(true);
            setError(null);

            const asset = await assetService.createAsset(input);
            logger.info('Asset created via hook', { id: asset.id });
            return asset;
        } catch (err) {
            const appError = handleError(err);
            setError(appError);
            logger.error('Error creating asset in hook', err);
            return null;
        } finally {
            setCreating(false);
        }
    }, []);

    const updateAsset = useCallback(async (id: string, input: UpdateAssetInput): Promise<Asset | null> => {
        try {
            setUpdating(true);
            setError(null);

            const asset = await assetService.updateAsset(id, input);
            logger.info('Asset updated via hook', { id });
            return asset;
        } catch (err) {
            const appError = handleError(err);
            setError(appError);
            logger.error('Error updating asset in hook', err);
            return null;
        } finally {
            setUpdating(false);
        }
    }, []);

    const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
        try {
            setDeleting(true);
            setError(null);

            await assetService.deleteAsset(id);
            logger.info('Asset deleted via hook', { id });
            return true;
        } catch (err) {
            const appError = handleError(err);
            setError(appError);
            logger.error('Error deleting asset in hook', err);
            return false;
        } finally {
            setDeleting(false);
        }
    }, []);

    return {
        creating,
        updating,
        deleting,
        error,
        createAsset,
        updateAsset,
        deleteAsset,
    };
}
