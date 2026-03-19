import { AppError, ErrorCodes } from './errorHandler';
import { API } from './constants';

/**
 * Wraps a promise with a timeout that rejects after the specified duration.
 *
 * Eliminates the need for manual Promise.race + inline timeout boilerplate
 * across service files, and avoids the `as any` type cast.
 *
 * @example
 * const { data, error } = await withTimeout(supabase.from('assets').select('*'));
 */
export async function withTimeout<T>(
    promise: PromiseLike<T>,
    ms: number = API.TIMEOUT_MS,
): Promise<T> {
    const timer = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject(new AppError('Request timed out', ErrorCodes.TIMEOUT, 408)),
            ms,
        )
    );
    return Promise.race([promise as Promise<T>, timer]);
}
