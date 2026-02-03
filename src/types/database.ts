export type PropertyType = 'land' | 'house' | 'condo' | 'townhouse' | 'commercial' | 'other';
export type AssetStatus = 'owned' | 'sold' | 'under_renovation';
export type RenovationStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ExpenseCategory = 'materials' | 'labor' | 'service' | 'electricity';
export type ImageCategory = 'purchase' | 'before_renovation' | 'after_renovation';

export interface Asset {
  id: string;
  created_at: string;
  title_deed_number: string;
  name: string;
  address?: string | null;
  property_type: PropertyType;
  purchase_price: number;
  purchase_date?: string | null;
  appraised_value?: number | null;
  mortgage_bank?: string | null;
  mortgage_amount?: number | null;
  fire_insurance_expiry?: string | null;
  land_tax_due_date?: string | null;
  status: AssetStatus;
  notes?: string | null;
}

export interface RenovationProject {
  id: string;
  created_at: string;
  asset_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  budget: number;
  status: RenovationStatus;
}

export interface RenovationProjectWithAsset extends RenovationProject {
  assets?: Asset | null;
}

export interface Expense {
  id: string;
  created_at: string;
  asset_id?: string | null;
  renovation_project_id?: string | null;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string | null;
  vendor?: string | null;
}

export interface Income {
  id: string;
  created_at: string;
  asset_id: string;
  source: string;
  amount: number;
  date: string;
  description?: string | null;
}

export interface AssetImage {
  id: string;
  created_at: string;
  asset_id: string;
  url: string;
  caption?: string | null;
  is_primary: boolean;
  category: ImageCategory;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at'>;
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>;
        Relationships: [];
      };
      renovation_projects: {
        Row: RenovationProject;
        Insert: Omit<RenovationProject, 'id' | 'created_at'>;
        Update: Partial<Omit<RenovationProject, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'renovation_projects_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'assets';
            referencedColumns: ['id'];
          }
        ];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'expenses_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'assets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_renovation_project_id_fkey';
            columns: ['renovation_project_id'];
            isOneToOne: false;
            referencedRelation: 'renovation_projects';
            referencedColumns: ['id'];
          }
        ];
      };
      incomes: {
        Row: Income;
        Insert: Omit<Income, 'id' | 'created_at'>;
        Update: Partial<Omit<Income, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'incomes_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'assets';
            referencedColumns: ['id'];
          }
        ];
      };
      asset_images: {
        Row: AssetImage;
        Insert: Omit<AssetImage, 'id' | 'created_at'>;
        Update: Partial<Omit<AssetImage, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'asset_images_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'assets';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
