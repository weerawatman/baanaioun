import { useCallback } from 'react';
import useSWR from 'swr';
import { RenovationProject } from '@/types/database';
import { renovationService, RenovationFilters } from '../services/renovationService';

interface UseRenovationsReturn {
    renovations: RenovationProject[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching renovation projects with SWR caching
 * @param filters - Optional filters for renovations
 * @returns Renovations data, loading state, error, and refetch function
 */
export function useRenovations(filters?: RenovationFilters): UseRenovationsReturn {
    const key = [
        'renovations',
        filters?.status ?? null,
        filters?.assetId ?? null,
        filters?.projectType ?? null,
    ];

    const { data, error, isLoading, mutate } = useSWR(
        key,
        () => renovationService.getRenovations(filters),
        { revalidateOnFocus: false }
    );

    const refetch = useCallback(async (_showLoading?: boolean) => {
        await mutate();
    }, [mutate]);

    return {
        renovations: data ?? [],
        loading: isLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
        refetch,
    };
}
