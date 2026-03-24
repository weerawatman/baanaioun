/**
 * Validation utilities
 */

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if phone number is valid (Thai format)
 * Accepts: 0XXXXXXXXX (local) or +66XXXXXXXXX / 0066XXXXXXXXX (international)
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Local: 10 digits starting with 0
    if (/^0\d{9}$/.test(cleaned)) return true;

    // International: +66 or 0066 followed by 9 digits (without leading 0)
    if (/^(\+66|0066)\d{9}$/.test(cleaned)) return true;

    return false;
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        return value.trim().length === 0;
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
}

/**
 * Check if number is in range
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Check if string length is in range
 */
export function isLengthInRange(value: string, min: number, max: number): boolean {
    const length = value.trim().length;
    return length >= min && length <= max;
}

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
        if (isEmpty(data[field])) {
            missingFields.push(String(field));
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Sanitize string (remove special characters)
 */
export function sanitizeString(value: string): string {
    return value.replace(/[<>]/g, '');
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
