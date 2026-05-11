import { createClient } from "@supabase/supabase-js";
import type { Product, Transaction, WaNumber, SeoSettings } from "@/types";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY  ?? "";

// ── Browser client (anon key, subject to RLS) ──────────────────────────────
// Singleton — satu instance agar WebSocket Realtime bisa terbentuk dengan benar
let _supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return _supabaseClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

// ── Server client (service role, bypasses RLS) ─────────────────────────────
// Use this only in API routes / server components — never expose service key!
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// ── Check if Supabase is configured ────────────────────────────────────────
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co"
  );
}


// ─── PRODUCTS ──────────────────────────────────────────────────────────────

export async function getProducts(activeOnly = true): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Product;
}

// ─── TRANSACTIONS ──────────────────────────────────────────────────────────

export async function createTransaction(payload: {
  invoice_id: string;
  game_id: string;
  game_name: string;
  username?: string;
  whatsapp: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  payment_proof?: string | null;
}) {
  const db = createServerSupabase();
  const insertPayload: any = { ...payload };
  
  // Jika database belum di-migrate, simpan username ke notes
  if (insertPayload.username) {
    insertPayload.notes = `Nama Pengguna: ${insertPayload.username}`;
    delete insertPayload.username;
  }

  const { data, error } = await db
    .from("transactions")
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function getTransactionByQuery(query: string): Promise<Transaction | null> {
  const db = createServerSupabase();
  const { data, error } = await db
    .from("transactions")
    .select("*")
    .or(`invoice_id.eq.${query},game_id.eq.${query}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as Transaction | null;
}

export async function getTransactions(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  const db = createServerSupabase();
  let q = db
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters?.limit) q = q.limit(filters.limit);
  if (filters?.offset) q = q.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1);

  const { data, error } = await q;
  if (error) throw error;
  return (data as Transaction[]) ?? [];
}

export async function updateTransactionStatus(id: string, status: string, is_processed?: boolean) {
  const db = createServerSupabase();
  const update: Record<string, unknown> = { status };
  if (is_processed !== undefined) update.is_processed = is_processed;

  const { error } = await db.from("transactions").update(update).eq("id", id);
  if (error) throw error;
}

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = createServerSupabase();
  const { data, error } = await db.from("v_transaction_stats").select("*").single();
  if (error) throw error;
  return data;
}

// ─── WA NUMBERS ────────────────────────────────────────────────────────────

export async function getNextWaNumber(): Promise<{ id: string; label: string; number: string } | null> {
  const db = createServerSupabase();
  const { data, error } = await db.rpc("get_next_wa_number");
  if (error || !data?.[0]) return null;
  return data[0] as { id: string; label: string; number: string };
}

export async function getAllWaNumbers(): Promise<WaNumber[]> {
  const db = createServerSupabase();
  const { data, error } = await db
    .from("wa_numbers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as WaNumber[]) ?? [];
}

export async function upsertWaNumber(wa: Partial<WaNumber> & { label: string; number: string }) {
  const db = createServerSupabase();
  const { error } = await db.from("wa_numbers").upsert(wa);
  if (error) throw error;
}

export async function deleteWaNumber(id: string) {
  const db = createServerSupabase();
  const { error } = await db.from("wa_numbers").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleWaNumber(id: string, is_active: boolean) {
  const db = createServerSupabase();
  const { error } = await db.from("wa_numbers").update({ is_active }).eq("id", id);
  if (error) throw error;
}

// ─── SEO SETTINGS ──────────────────────────────────────────────────────────

export async function getSeoSettings(): Promise<SeoSettings | null> {
  const { data, error } = await supabase
    .from("seo_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as SeoSettings | null;
}

export async function updateSeoSettings(settings: Partial<SeoSettings>) {
  const db = createServerSupabase();

  // Upsert: update if exists, insert if not
  const { data: existing } = await db.from("seo_settings").select("id").limit(1).maybeSingle();

  if (existing?.id) {
    const { error } = await db.from("seo_settings").update(settings).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("seo_settings").insert(settings);
    if (error) throw error;
  }
}

// ─── ADMINS ────────────────────────────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  const db = createServerSupabase();
  const { data, error } = await db
    .from("admins")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data;
}

export async function updateAdminLastLogin(id: string) {
  const db = createServerSupabase();
  await db.from("admins").update({ last_login: new Date().toISOString() }).eq("id", id);
}

export async function getAllAdmins() {
  const db = createServerSupabase();
  const { data, error } = await db
    .from("admins")
    .select("id, username, email, role, is_active, last_login, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAdmin(payload: {
  username: string;
  email: string;
  password_hash: string;
  role: string;
}) {
  const db = createServerSupabase();
  const { error } = await db.from("admins").insert(payload);
  if (error) throw error;
}

export async function deleteAdmin(id: string) {
  const db = createServerSupabase();
  const { error } = await db.from("admins").delete().eq("id", id);
  if (error) throw error;
}

// ─── ACTIVITY LOGS ─────────────────────────────────────────────────────────

export async function logActivity(payload: {
  admin_id?: string;
  admin_username: string;
  action: string;
  details?: string;
  ip_address?: string;
}) {
  const db = createServerSupabase();
  await db.from("activity_logs").insert(payload);
}
