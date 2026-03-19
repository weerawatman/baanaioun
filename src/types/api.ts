/**
 * Generic API response wrapper types.
 *
 * These are used when wrapping Supabase results or building
 * Next.js Route Handler responses in a consistent shape.
 */

// ---------------------------------------------------------------------------
// Standard single-item response
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

// ---------------------------------------------------------------------------
// Paginated list response
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
    data: T[];
    count: number;       // total records matching query
    page: number;        // current page (1-indexed)
    pageSize: number;
    totalPages: number;
}

// ---------------------------------------------------------------------------
// Mutation result (create / update / delete)
// ---------------------------------------------------------------------------

export interface MutationResult<T = void> {
    data: T | null;
    error: string | null;
    success: boolean;
}

// ---------------------------------------------------------------------------
// Server Action result (used in forms with useFormState)
// ---------------------------------------------------------------------------

export interface ActionResult {
    success: boolean;
    message?: string;
    errors?: Record<string, string>;
}
