/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

/**
 * Predefined error codes
 */
export const ErrorCodes = {
    // Authentication errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Database errors
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    DATABASE_ERROR: 'DATABASE_ERROR',

    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',

    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Handle and normalize errors
 */
export function handleError(error: unknown): AppError {
    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Standard Error
    if (error instanceof Error) {
        return new AppError(
            error.message,
            ErrorCodes.UNKNOWN_ERROR,
            500,
            { originalError: error }
        );
    }

    // String error
    if (typeof error === 'string') {
        return new AppError(error, ErrorCodes.UNKNOWN_ERROR);
    }

    // Unknown error type
    return new AppError(
        'An unknown error occurred',
        ErrorCodes.UNKNOWN_ERROR,
        500,
        { originalError: error }
    );
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error: unknown, code: string): boolean {
    return error instanceof AppError && error.code === code;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    const appError = handleError(error);

    // Map error codes to user-friendly messages
    const messageMap: Record<string, string> = {
        [ErrorCodes.UNAUTHORIZED]: 'กรุณาเข้าสู่ระบบ',
        [ErrorCodes.FORBIDDEN]: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
        [ErrorCodes.NOT_FOUND]: 'ไม่พบข้อมูลที่ต้องการ',
        [ErrorCodes.VALIDATION_ERROR]: 'ข้อมูลไม่ถูกต้อง',
        [ErrorCodes.NETWORK_ERROR]: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        [ErrorCodes.DATABASE_ERROR]: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
    };

    return messageMap[appError.code] || appError.message || 'เกิดข้อผิดพลาด';
}
