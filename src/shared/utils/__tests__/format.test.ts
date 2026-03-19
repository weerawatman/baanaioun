import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatNumber,
    formatFileSize,
    truncate,
    capitalize,
    isDateExpired,
} from '../format';

describe('formatCurrency', () => {
    it('formats positive amount', () => {
        expect(formatCurrency(1000)).toContain('1,000');
    });

    it('returns "-" for null', () => {
        expect(formatCurrency(null)).toBe('-');
    });

    it('returns "-" for undefined', () => {
        expect(formatCurrency(undefined)).toBe('-');
    });

    it('formats zero', () => {
        expect(formatCurrency(0)).toContain('0');
    });
});

describe('formatNumber', () => {
    it('formats with thousand separator', () => {
        expect(formatNumber(1000000)).toContain('1,000,000');
    });

    it('returns "-" for null', () => {
        expect(formatNumber(null)).toBe('-');
    });
});

describe('formatFileSize', () => {
    it('formats bytes', () => {
        expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats KB', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('formats MB', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('returns "0 Bytes" for 0', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
    });
});

describe('truncate', () => {
    it('returns full text if within limit', () => {
        expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates and appends ellipsis', () => {
        expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('returns text unchanged at exact length', () => {
        expect(truncate('hello', 5)).toBe('hello');
    });
});

describe('capitalize', () => {
    it('capitalizes first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
    });

    it('returns empty string for empty input', () => {
        expect(capitalize('')).toBe('');
    });
});

describe('isDateExpired', () => {
    it('returns true for past date', () => {
        expect(isDateExpired('2000-01-01')).toBe(true);
    });

    it('returns false for future date', () => {
        expect(isDateExpired('2099-12-31')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isDateExpired(null)).toBe(false);
    });
});
