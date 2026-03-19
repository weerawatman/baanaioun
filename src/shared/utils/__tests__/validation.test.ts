import { describe, it, expect } from 'vitest';
import {
    isValidEmail,
    isValidPhoneNumber,
    isEmpty,
    isInRange,
    isLengthInRange,
    validateRequired,
    sanitizeString,
    isValidUrl,
} from '../validation';

describe('isValidEmail', () => {
    it('returns true for valid email', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns false for missing @', () => {
        expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('returns false for missing domain', () => {
        expect(isValidEmail('user@')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidEmail('')).toBe(false);
    });
});

describe('isValidPhoneNumber', () => {
    it('returns true for valid Thai number', () => {
        expect(isValidPhoneNumber('0812345678')).toBe(true);
    });

    it('returns true with spaces/dashes', () => {
        expect(isValidPhoneNumber('081-234-5678')).toBe(true);
    });

    it('returns false for number not starting with 0', () => {
        expect(isValidPhoneNumber('1812345678')).toBe(false);
    });

    it('returns false for too short', () => {
        expect(isValidPhoneNumber('08123456')).toBe(false);
    });

    it('returns false for too long', () => {
        expect(isValidPhoneNumber('081234567890')).toBe(false);
    });
});

describe('isEmpty', () => {
    it('returns true for null', () => {
        expect(isEmpty(null)).toBe(true);
    });

    it('returns true for undefined', () => {
        expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
        expect(isEmpty('')).toBe(true);
    });

    it('returns true for whitespace-only string', () => {
        expect(isEmpty('   ')).toBe(true);
    });

    it('returns false for non-empty string', () => {
        expect(isEmpty('hello')).toBe(false);
    });

    it('returns true for empty array', () => {
        expect(isEmpty([])).toBe(true);
    });

    it('returns false for non-empty array', () => {
        expect(isEmpty([1])).toBe(false);
    });

    it('returns true for empty object', () => {
        expect(isEmpty({})).toBe(true);
    });

    it('returns false for non-empty object', () => {
        expect(isEmpty({ a: 1 })).toBe(false);
    });
});

describe('isInRange', () => {
    it('returns true when value is within range', () => {
        expect(isInRange(5, 1, 10)).toBe(true);
    });

    it('returns true at min boundary', () => {
        expect(isInRange(1, 1, 10)).toBe(true);
    });

    it('returns true at max boundary', () => {
        expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('returns false below range', () => {
        expect(isInRange(0, 1, 10)).toBe(false);
    });

    it('returns false above range', () => {
        expect(isInRange(11, 1, 10)).toBe(false);
    });
});

describe('isLengthInRange', () => {
    it('returns true when length within range', () => {
        expect(isLengthInRange('hello', 1, 10)).toBe(true);
    });

    it('returns false when too short', () => {
        expect(isLengthInRange('hi', 5, 10)).toBe(false);
    });

    it('returns false when too long', () => {
        expect(isLengthInRange('hello world', 1, 5)).toBe(false);
    });

    it('trims whitespace before checking length', () => {
        expect(isLengthInRange('  hi  ', 1, 2)).toBe(true);
    });
});

describe('validateRequired', () => {
    it('returns isValid true when all fields present', () => {
        const result = validateRequired({ name: 'John', email: 'john@example.com' }, ['name', 'email']);
        expect(result.isValid).toBe(true);
        expect(result.missingFields).toHaveLength(0);
    });

    it('returns missing fields when some are empty', () => {
        const result = validateRequired({ name: '', email: 'john@example.com' }, ['name', 'email']);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('name');
    });

    it('returns all missing fields', () => {
        const result = validateRequired({ name: null, email: null }, ['name', 'email']);
        expect(result.missingFields).toHaveLength(2);
    });
});

describe('sanitizeString', () => {
    it('removes < and > characters', () => {
        expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });

    it('returns string unchanged if no special chars', () => {
        expect(sanitizeString('hello world')).toBe('hello world');
    });
});

describe('isValidUrl', () => {
    it('returns true for valid http URL', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('returns true for valid https URL', () => {
        expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
    });

    it('returns false for plain text', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidUrl('')).toBe(false);
    });
});
