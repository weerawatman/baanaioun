import { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types/database';
import { assetService, AssetFilters } from '../services/assetService';
import { handleError, logger } from '@/shared/utils';

interface UseAssetsReturn {
    assets: Asset[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching and managing assets
 * @param filters - Optional filters to apply
 * @returns Assets data, loading state, error, and refetch function
 */
export function useAssets(filters?: AssetFilters): UseAssetsReturn {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAssets = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const data = await assetService.getAssets(filters);
            setAssets(data);
        } catch (err) {
            const appError = handleError(err);
            setError(appError);
            logger.error('Error in useAssets', err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [filters]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return {
        assets,
        loading,
        error,
        refetch: fetchAssets,
    };
}
