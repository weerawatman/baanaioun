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
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Thai phone number: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(cleaned);
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
