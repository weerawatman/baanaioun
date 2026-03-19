import { useCallback } from 'react';
import useSWR from 'swr';
import { Income } from '@/types/database';
import { incomeService, IncomeFilters } from '../services/incomeService';

interface UseIncomeReturn {
    income: Income[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching income with SWR caching
 * @param filters - Optional filters for income
 * @returns Income data, loading state, error, and refetch function
 */
export function useIncome(filters?: IncomeFilters): UseIncomeReturn {
    const key = [
        'income',
        filters?.assetId ?? null,
        filters?.source ?? null,
        filters?.startDate ?? null,
        filters?.endDate ?? null,
    ];

    const { data, error, isLoading, mutate } = useSWR(
        key,
        () => incomeService.getIncome(filters),
        { revalidateOnFocus: false }
    );

    const refetch = useCallback(async (_showLoading?: boolean) => {
        await mutate();
    }, [mutate]);

    return {
        income: data ?? [],
        loading: isLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
        refetch,
    };
}
