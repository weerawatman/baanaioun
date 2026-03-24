import { useCallback } from 'react';
import useSWR from 'swr';
import { Asset } from '@/types/database';
import { assetService, AssetFilters, AssetPagination } from '../services/assetService';

interface UseAssetsReturn {
    assets: Asset[];
    loading: boolean;
    error: Error | null;
    isRetrying: boolean;
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

    const { data: result, error, isLoading, isValidating, mutate } = useSWR(
        key,
        () => assetService.getAssets(filters, pagination),
        {
            revalidateOnFocus: true,
            focusThrottleInterval: 60000, // revalidate at most once per minute on tab focus
            keepPreviousData: true,       // show cached data while refetching (no blank screen)
            errorRetryCount: 3,           // retry up to 3 times on error (handles Supabase cold start)
            errorRetryInterval: 5000,     // wait 5s between retries
            // AbortErrors are intentional cancellations — not real failures, don't retry or surface them
            shouldRetryOnError: (err: Error) => err.name !== 'AbortError',
        }
    );

    const refetch = useCallback(async (_showLoading?: boolean) => {
        await mutate();
    }, [mutate]);

    // Surface AbortErrors only as a retrying state, never as a hard error banner
    const isAbort = error instanceof Error && error.name === 'AbortError';
    const displayError = isAbort ? null : (error instanceof Error ? error : error ? new Error(String(error)) : null);

    // isRetrying: a previous fetch failed (non-abort) and SWR is currently making another attempt
    const isRetrying = !!displayError && isValidating;

    return {
        assets: result?.data ?? [],
        loading: isLoading,
        error: displayError,
        isRetrying,
        totalCount: result?.count ?? 0,
        refetch,
    };
}
