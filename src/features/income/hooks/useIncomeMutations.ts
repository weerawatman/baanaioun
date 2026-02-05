import { useState } from 'react';
import { Income } from '@/types/database';
import { incomeService, CreateIncomeInput, UpdateIncomeInput } from '../services/incomeService';
import { handleError, logger } from '@/shared/utils';

interface UseIncomeMutationsReturn {
    createIncome: (input: CreateIncomeInput) => Promise<Income | null>;
    updateIncome: (id: string, input: UpdateIncomeInput) => Promise<Income | null>;
    deleteIncome: (id: string) => Promise<boolean>;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: Error | null;
}

/**
 * Custom hook for income mutations (create, update, delete)
 * @returns Mutation functions and loading states
 */
export function useIncomeMutations(): UseIncomeMutationsReturn {
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createIncome = async (input: CreateIncomeInput): Promise<Income | null> => {
        setCreating(true);
        setError(null);

        try {
            const income = await incomeService.createIncome(input);
            logger.info('Income created via hook', { id: income.id });
            return income;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error creating income in hook', err);
            return null;
        } finally {
            setCreating(false);
        }
    };

    const updateIncome = async (id: string, input: UpdateIncomeInput): Promise<Income | null> => {
        setUpdating(true);
        setError(null);

        try {
            const income = await incomeService.updateIncome(id, input);
            logger.info('Income updated via hook', { id });
            return income;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error updating income in hook', err);
            return null;
        } finally {
            setUpdating(false);
        }
    };

    const deleteIncome = async (id: string): Promise<boolean> => {
        setDeleting(true);
        setError(null);

        try {
            await incomeService.deleteIncome(id);
            logger.info('Income deleted via hook', { id });
            return true;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error deleting income in hook', err);
            return false;
        } finally {
            setDeleting(false);
        }
    };

    return {
        createIncome,
        updateIncome,
        deleteIncome,
        creating,
        updating,
        deleting,
        error,
    };
}
