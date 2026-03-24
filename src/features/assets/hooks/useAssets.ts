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
            errorRetryCount: 2,           // 2 SWR retries — service layer refreshes session before each
            errorRetryInterval: 3000,     // 3 s between retries
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

    // isRetrying: failed AND SWR is making another attempt AND there is no data yet to show.
    // If data is already visible on screen, suppress the banner — the retry is transparent to the user.
    const hasData = (result?.data?.length ?? 0) > 0;
    const isRetrying = !!displayError && isValidating && !hasData;

    return {
        assets: result?.data ?? [],
        loading: isLoading,
        error: displayError,
        isRetrying,
        totalCount: result?.count ?? 0,
        refetch,
    };
}
