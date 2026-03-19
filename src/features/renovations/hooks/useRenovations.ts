import { useState, useEffect, useCallback } from 'react';
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

    const fetchRenovations = useCallback(async (showLoading = true) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters?.status,
        filters?.assetId,
        filters?.projectType,
    ]);

    useEffect(() => {
        fetchRenovations();
    }, [fetchRenovations]);

    return {
        renovations,
        loading,
        error,
        refetch: fetchRenovations,
    };
}
