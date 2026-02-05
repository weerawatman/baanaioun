import { useState } from 'react';
import { Expense } from '@/types/database';
import { expenseService, CreateExpenseInput, UpdateExpenseInput } from '../services/expenseService';
import { handleError, logger } from '@/shared/utils';

interface UseExpenseMutationsReturn {
    createExpense: (input: CreateExpenseInput) => Promise<Expense | null>;
    updateExpense: (id: string, input: UpdateExpenseInput) => Promise<Expense | null>;
    deleteExpense: (id: string) => Promise<boolean>;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: Error | null;
}

/**
 * Custom hook for expense mutations (create, update, delete)
 * @returns Mutation functions and loading states
 */
export function useExpenseMutations(): UseExpenseMutationsReturn {
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createExpense = async (input: CreateExpenseInput): Promise<Expense | null> => {
        setCreating(true);
        setError(null);

        try {
            const expense = await expenseService.createExpense(input);
            logger.info('Expense created via hook', { id: expense.id });
            return expense;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error creating expense in hook', err);
            return null;
        } finally {
            setCreating(false);
        }
    };

    const updateExpense = async (id: string, input: UpdateExpenseInput): Promise<Expense | null> => {
        setUpdating(true);
        setError(null);

        try {
            const expense = await expenseService.updateExpense(id, input);
            logger.info('Expense updated via hook', { id });
            return expense;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error updating expense in hook', err);
            return null;
        } finally {
            setUpdating(false);
        }
    };

    const deleteExpense = async (id: string): Promise<boolean> => {
        setDeleting(true);
        setError(null);

        try {
            await expenseService.deleteExpense(id);
            logger.info('Expense deleted via hook', { id });
            return true;
        } catch (err) {
            const error = handleError(err);
            setError(error);
            logger.error('Error deleting expense in hook', err);
            return false;
        } finally {
            setDeleting(false);
        }
    };

    return {
        createExpense,
        updateExpense,
        deleteExpense,
        creating,
        updating,
        deleting,
        error,
    };
}
