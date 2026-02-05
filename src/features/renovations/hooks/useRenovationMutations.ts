import { useState } from 'react';
import { RenovationProject } from '@/types/database';
import { renovationService, CreateRenovationInput, UpdateRenovationInput } from '../services/renovationService';
import { handleError, logger } from '@/shared/utils';

interface UseRenovationMutationsReturn {
    createRenovation: (input: CreateRenovationInput) => Promise<RenovationProject | null>;
    updateRenovation: (id: string, input: UpdateRenovationInput) => Promise<RenovationProject | null>;
    deleteRenovation: (id: string) => Promise<boolean>;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: Error | null;
}

/**
 * Custom hook for renovation project mutations (create, update, delete)
 * @returns Mutation functions and loading states
 */
export function useRenovationMutations(): UseRenovationMutationsReturn {
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createRenovation = async (input: CreateRenovationInput): Promise<RenovationProject | null> => {
        setCreating(true);
        setError(null);

        try {
            const renovation = await renovationService.createRenovation(input);
            logger.info('Renovation created via hook', { id: renovation.id });
            return renovation;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error creating renovation in hook', err);
            return null;
        } finally {
            setCreating(false);
        }
    };

    const updateRenovation = async (id: string, input: UpdateRenovationInput): Promise<RenovationProject | null> => {
        setUpdating(true);
        setError(null);

        try {
            const renovation = await renovationService.updateRenovation(id, input);
            logger.info('Renovation updated via hook', { id });
            return renovation;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error updating renovation in hook', err);
            return null;
        } finally {
            setUpdating(false);
        }
    };

    const deleteRenovation = async (id: string): Promise<boolean> => {
        setDeleting(true);
        setError(null);

        try {
            await renovationService.deleteRenovation(id);
            logger.info('Renovation deleted via hook', { id });
            return true;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error deleting renovation in hook', err);
            return false;
        } finally {
            setDeleting(false);
        }
    };

    return {
        createRenovation,
        updateRenovation,
        deleteRenovation,
        creating,
        updating,
        deleting,
        error,
    };
}
