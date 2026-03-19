import { useState, useEffect, useCallback } from 'react';
import { Income } from '@/types/database';
import { incomeService, IncomeFilters } from '../services/incomeService';
import { handleError, logger } from '@/shared/utils';

interface UseIncomeReturn {
    income: Income[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching income
 * @param filters - Optional filters for income
 * @returns Income data, loading state, error, and refetch function
 */
export function useIncome(filters?: IncomeFilters): UseIncomeReturn {
    const [income, setIncome] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchIncome = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const data = await incomeService.getIncome(filters);
            setIncome(data);
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error in useIncome', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters?.assetId,
        filters?.source,
        filters?.startDate,
        filters?.endDate,
    ]);

    useEffect(() => {
        fetchIncome();
    }, [fetchIncome]);

    return {
        income,
        loading,
        error,
        refetch: fetchIncome,
    };
}
