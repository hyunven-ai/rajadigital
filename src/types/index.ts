export type ProductCategory = "diamond" | "koin" | "item" | "top-up";

export type TransactionStatus = "pending" | "selesai" | "batal";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | string;
  game_name: string;
  price: number;
  original_price?: number;
  description?: string;
  amount?: string;
  is_active: boolean;
  is_popular?: boolean;
  sort_order?: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  game_id: string;
  game_name: string;
  whatsapp: string;
  product_id: string;
  product_name: string;
  product_price: number;
  status: TransactionStatus;
  is_processed: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface WaNumber {
  id: string;
  label: string;
  number: string;
  is_active: boolean;
  sort_order: number;
  last_used_at?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin";
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface SeoSettings {
  id: string;
  meta_title: string;
  meta_description: string;
  meta_keywords?: string;
  og_image?: string;
  ga_script?: string;
  pixel_script?: string;
  widget_script?: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  total_today: number;
  total_week: number;
  total_month: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  pending_count: number;
  completed_count: number;
}
