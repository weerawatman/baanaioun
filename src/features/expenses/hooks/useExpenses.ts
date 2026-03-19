import { useCallback } from 'react';
import useSWR from 'swr';
import { Expense } from '@/types/database';
import { expenseService, ExpenseFilters } from '../services/expenseService';

interface UseExpensesReturn {
    expenses: Expense[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching expenses with SWR caching
 * @param filters - Optional filters for expenses
 * @returns Expenses data, loading state, error, and refetch function
 */
export function useExpenses(filters?: ExpenseFilters): UseExpensesReturn {
    const key = [
        'expenses',
        filters?.category ?? null,
        filters?.assetId ?? null,
        filters?.renovationProjectId ?? null,
        filters?.startDate ?? null,
        filters?.endDate ?? null,
    ];

    const { data, error, isLoading, mutate } = useSWR(
        key,
        () => expenseService.getExpenses(filters),
        { revalidateOnFocus: false }
    );

    const refetch = useCallback(async (_showLoading?: boolean) => {
        await mutate();
    }, [mutate]);

    return {
        expenses: data ?? [],
        loading: isLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
        refetch,
    };
}
