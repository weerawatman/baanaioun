/**
 * Form value types — used by modal/form components.
 *
 * These mirror the service-layer Create*Input types but are kept separate so
 * form components can import them without pulling in the entire service module.
 */

import type {
    PropertyType,
    AssetStatus,
    RenovationStatus,
    ProjectType,
    ExpenseCategory,
    ImageCategory,
} from './database';

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

export interface AssetFormValues {
    title_deed_number: string;
    name: string;
    address?: string;
    property_type: PropertyType;
    purchase_price: number;
    purchase_date?: string;
    appraised_value?: number;
    mortgage_bank?: string;
    mortgage_amount?: number;
    fire_insurance_expiry?: string;
    land_tax_due_date?: string;
    status: AssetStatus;
    notes?: string;
    selling_price?: number;
    rental_price?: number;
    description?: string;
    location_lat_long?: string;
    tenant_name?: string;
    tenant_contact?: string;
}

// ---------------------------------------------------------------------------
// Renovation Project
// ---------------------------------------------------------------------------

export interface RenovationFormValues {
    asset_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    budget: number;
    status: RenovationStatus;
    project_type: ProjectType;
    target_property_type?: PropertyType;
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export interface ExpenseFormValues {
    asset_id?: string;
    renovation_project_id?: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    description?: string;
    vendor?: string;
}

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

export interface IncomeFormValues {
    asset_id: string;
    source: string;
    amount: number;
    date: string;
    description?: string;
}

// ---------------------------------------------------------------------------
// Lead (public form — no auth required)
// ---------------------------------------------------------------------------

export interface LeadFormValues {
    asset_id: string;
    customer_name: string;
    customer_phone?: string;
    customer_line_id?: string;
    message?: string;
}

// ---------------------------------------------------------------------------
// Asset Image upload
// ---------------------------------------------------------------------------

export interface ImageUploadFormValues {
    asset_id: string;
    category: ImageCategory;
    renovation_project_id?: string;
    files: File[];
}
