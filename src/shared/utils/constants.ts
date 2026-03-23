import type {
    PropertyType,
    AssetStatus,
    RenovationStatus,
    ExpenseCategory,
    ImageCategory,
    ProjectType,
} from '@/types/database';

/**
 * Application constants
 */

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
} as const;

// File upload
export const FILE_UPLOAD = {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

// API
export const API = {
    TIMEOUT_MS: 30000, // 30 seconds — Cloudflare cold start can take up to ~20s
    RETRY_ATTEMPTS: 3,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    VIEW_MODE: 'view_mode',
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    DASHBOARD: '/dashboard',
    ASSETS: '/assets',
    RENOVATIONS: '/renovations',
    EXPENSES: '/expenses',
    INCOME: '/income',
} as const;

// ---------------------------------------------------------------------------
// Domain Label Maps (centralized from duplicates across pages/components)
// ---------------------------------------------------------------------------

export const PROPERTY_TYPE_LABELS: Record<PropertyType, { label: string; icon: string }> = {
    land: { label: 'ที่ดินเปล่า', icon: '🏞️' },
    house: { label: 'บ้านเดี่ยว', icon: '🏠' },
    semi_detached_house: { label: 'บ้านแฝด', icon: '🏘️' },
    condo: { label: 'คอนโดมิเนียม', icon: '🏢' },
    townhouse: { label: 'ทาวน์เฮาส์', icon: '🏡' },
    commercial: { label: 'อาคารพาณิชย์', icon: '🏬' },
    other: { label: 'อื่นๆ', icon: '📦' },
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
    developing: { label: 'ว่างรอการพัฒนา', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    ready_for_sale: { label: 'พร้อมขาย', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    ready_for_rent: { label: 'พร้อมเช่า', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    rented: { label: 'มีคนเช่าอยู่', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    sold: { label: 'ขายไปแล้ว', color: 'bg-warm-200 text-warm-700 dark:bg-warm-700 dark:text-warm-300' },
};

export const RENOVATION_STATUS_LABELS: Record<RenovationStatus, { label: string; color: string }> = {
    planned: { label: 'วางแผน', color: 'bg-warm-100 text-warm-800 dark:bg-warm-700 dark:text-warm-300' },
    in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, { label: string; color: string; group: 'general' | 'construction' }> = {
    materials: { label: 'ค่าวัสดุ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', group: 'general' },
    labor: { label: 'ค่าแรง', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', group: 'general' },
    service: { label: 'ค่าบริการช่าง', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', group: 'general' },
    electricity: { label: 'ค่าไฟฟ้า', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', group: 'general' },
    land_filling: { label: 'ถมดิน', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', group: 'construction' },
    building_permit: { label: 'ขออนุญาต', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', group: 'construction' },
    foundation: { label: 'งานฐานราก', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', group: 'construction' },
    architect_fee: { label: 'ค่าสถาปนิก', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', group: 'construction' },
};

export const IMAGE_CATEGORY_LABELS: Record<ImageCategory, { label: string; color: string }> = {
    purchase: { label: 'รูปตอนซื้อ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    before_renovation: { label: 'ก่อนรีโนเวท', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    in_progress: { label: 'ระหว่างดำเนินการ', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    after_renovation: { label: 'หลังรีโนเวท', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    final: { label: 'รูปสุดท้าย', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, { label: string; color: string; icon: string }> = {
    renovation: { label: 'ปรับปรุง', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: '🔧' },
    new_construction: { label: 'สร้างใหม่', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '🏗️' },
};

// Form option arrays (derived from label maps)
export const PROPERTY_TYPE_OPTIONS = Object.entries(PROPERTY_TYPE_LABELS).map(
    ([value, { label, icon }]) => ({ value: value as PropertyType, label, icon })
);

export const ASSET_STATUS_OPTIONS = Object.entries(ASSET_STATUS_LABELS).map(
    ([value, { label }]) => ({ value: value as AssetStatus, label })
);

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
    materials: '🧱',
    labor: '👷',
    service: '🔧',
    electricity: '⚡',
    land_filling: '🚜',
    building_permit: '📋',
    foundation: '🏗️',
    architect_fee: '📐',
};

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(
    ([value, { label, group }]) => ({
        value: value as ExpenseCategory,
        label,
        icon: EXPENSE_CATEGORY_ICONS[value as ExpenseCategory],
        group,
    })
);
