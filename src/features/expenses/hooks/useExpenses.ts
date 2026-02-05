import { useState, useEffect } from 'react';
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

    const fetchExpenses = async (showLoading = true) => {
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
    };

    useEffect(() => {
        fetchExpenses();
    }, [JSON.stringify(filters)]);

    return {
        expenses,
        loading,
        error,
        refetch: fetchExpenses,
    };
}
