import { supabase } from '@/lib/supabase';
import { Expense, ExpenseCategory } from '@/types/database';
import { AppError, ErrorCodes, logger } from '@/shared/utils';

export interface ExpenseFilters {
    category?: ExpenseCategory;
    assetId?: string;
    renovationProjectId?: string;
    startDate?: string;
    endDate?: string;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'created_at'>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

/**
 * Service layer for Expense data access
 * Centralizes all Supabase queries for expenses
 */
export class ExpenseService {
    /**
     * Fetch expenses with optional filters
     */
    async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
        try {
            logger.info('Fetching expenses', { filters });

            let query = supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            // Apply filters
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }

            if (filters?.assetId) {
                query = query.eq('asset_id', filters.assetId);
            }

            if (filters?.renovationProjectId) {
                query = query.eq('renovation_project_id', filters.renovationProjectId);
            }

            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error fetching expenses', error);
                throw new AppError(
                    'Failed to fetch expenses',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Expenses fetched successfully', { count: data?.length || 0 });
            return data || [];
        } catch (error) {
            logger.error('Unexpected error in getExpenses', error);
            throw error;
        }
    }

    /**
     * Get a single expense by ID
     */
    async getExpenseById(id: string): Promise<Expense> {
        try {
            logger.info('Fetching expense by ID', { id });

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching expense', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Expense not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to fetch expense',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Expense fetched successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in getExpenseById', error);
            throw error;
        }
    }

    /**
     * Create a new expense
     */
    async createExpense(input: CreateExpenseInput): Promise<Expense> {
        try {
            logger.info('Creating expense', { input });

            const { data, error } = await supabase
                .from('expenses')
                .insert(input)
                .select()
                .single();

            if (error) {
                logger.error('Error creating expense', error);
                throw new AppError(
                    'Failed to create expense',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Expense created successfully', { id: data.id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in createExpense', error);
            throw error;
        }
    }

    /**
     * Update an existing expense
     */
    async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
        try {
            logger.info('Updating expense', { id, input });

            const { data, error } = await supabase
                .from('expenses')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating expense', error, { id });

                if (error.code === 'PGRST116') {
                    throw new AppError(
                        'Expense not found',
                        ErrorCodes.NOT_FOUND,
                        404,
                        { id }
                    );
                }

                throw new AppError(
                    'Failed to update expense',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Expense updated successfully', { id });
            return data;
        } catch (error) {
            logger.error('Unexpected error in updateExpense', error);
            throw error;
        }
    }

    /**
     * Delete an expense
     */
    async deleteExpense(id: string): Promise<void> {
        try {
            logger.info('Deleting expense', { id });

            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('Error deleting expense', error, { id });
                throw new AppError(
                    'Failed to delete expense',
                    ErrorCodes.DATABASE_ERROR,
                    500,
                    { originalError: error }
                );
            }

            logger.info('Expense deleted successfully', { id });
        } catch (error) {
            logger.error('Unexpected error in deleteExpense', error);
            throw error;
        }
    }

    /**
     * Get total expenses by category
     */
    async getTotalByCategory(filters?: Omit<ExpenseFilters, 'category'>): Promise<Record<ExpenseCategory, number>> {
        try {
            const expenses = await this.getExpenses(filters);

            const totals: Record<string, number> = {};

            expenses.forEach(expense => {
                if (!totals[expense.category]) {
                    totals[expense.category] = 0;
                }
                totals[expense.category] += expense.amount;
            });

            return totals as Record<ExpenseCategory, number>;
        } catch (error) {
            logger.error('Unexpected error in getTotalByCategory', error);
            throw error;
        }
    }
}

// Export singleton instance
export const expenseService = new ExpenseService();
