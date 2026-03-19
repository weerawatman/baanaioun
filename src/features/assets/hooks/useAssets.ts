import { useCallback } from 'react';
import useSWR from 'swr';
import { Asset } from '@/types/database';
import { assetService, AssetFilters, AssetPagination } from '../services/assetService';

interface UseAssetsReturn {
    assets: Asset[];
    loading: boolean;
    error: Error | null;
    totalCount: number;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching and managing assets with SWR caching and server-side pagination
 * @param filters - Optional filters to apply
 * @param pagination - Optional server-side pagination params
 * @returns Assets data, loading state, error, totalCount, and refetch function
 */
export function useAssets(filters?: AssetFilters, pagination?: AssetPagination): UseAssetsReturn {
    const key = [
        'assets',
        filters?.status ?? null,
        filters?.propertyType ?? null,
        filters?.search ?? null,
        pagination?.page ?? null,
        pagination?.pageSize ?? null,
    ];

    const { data: result, error, isLoading, mutate } = useSWR(
        key,
        () => assetService.getAssets(filters, pagination),
        { revalidateOnFocus: false }
    );

    const refetch = useCallback(async (_showLoading?: boolean) => {
        await mutate();
    }, [mutate]);

    return {
        assets: result?.data ?? [],
        loading: isLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
        totalCount: result?.count ?? 0,
        refetch,
    };
}
