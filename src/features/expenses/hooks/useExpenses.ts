import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/types/database';
import { expenseService, ExpenseFilters } from '../services/expenseService';
import { handleError, logger } from '@/shared/utils';

interface UseExpensesReturn {
    expenses: Expense[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching expenses
 * @param filters - Optional filters for expenses
 * @returns Expenses data, loading state, error, and refetch function
 */
export function useExpenses(filters?: ExpenseFilters): UseExpensesReturn {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchExpenses = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const data = await expenseService.getExpenses(filters);
            setExpenses(data);
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error in useExpenses', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters?.category,
        filters?.assetId,
        filters?.renovationProjectId,
        filters?.startDate,
        filters?.endDate,
    ]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return {
        expenses,
        loading,
        error,
        refetch: fetchExpenses,
    };
}
