import { useState, useEffect } from 'react';
import { RenovationProject } from '@/types/database';
import { renovationService, RenovationFilters } from '../services/renovationService';
import { handleError, logger } from '@/shared/utils';

interface UseRenovationsReturn {
    renovations: RenovationProject[];
    loading: boolean;
    error: Error | null;
    refetch: (showLoading?: boolean) => Promise<void>;
}

/**
 * Custom hook for fetching renovation projects
 * @param filters - Optional filters for renovations
 * @returns Renovations data, loading state, error, and refetch function
 */
export function useRenovations(filters?: RenovationFilters): UseRenovationsReturn {
    const [renovations, setRenovations] = useState<RenovationProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRenovations = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const data = await renovationService.getRenovations(filters);
            setRenovations(data);
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error in useRenovations', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRenovations();
    }, [JSON.stringify(filters)]);

    return {
        renovations,
        loading,
        error,
        refetch: fetchRenovations,
    };
}
