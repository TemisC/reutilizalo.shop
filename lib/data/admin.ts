import { createClient } from "@/lib/supabase/server";

export type AdminStats = {
  storesTotal: number;
  stores7d: number;
  stores30d: number;
  storesWithItems: number;
  storesPro: number;
  itemsActive: number;
  items7d: number;
  itemsSold: number;
  wantClicksTotal: number;
  wantClicks7d: number;
  views7d: number;
  reviewsTotal: number;
  reportsOpen: number;
  /** Altas de tiendas por día, últimos 30 días (hora de Montevideo), del más viejo al de hoy. */
  signupsByDay: { day: string; count: number }[];
};

export type AdminStore = {
  id: string;
  nick: string;
  storeName: string;
  email: string;
  whatsapp: string;
  plan: "free" | "pro";
  createdAt: string;
  itemsActive: number;
  itemsSold: number;
  wantClicks: number;
};

/** Indicadores del tablero. La función de la base rechaza a quien no sea admin. */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error || !data) throw new Error(`No se pudieron leer los indicadores: ${error?.message ?? "sin datos"}`);

  const raw = data as Record<string, unknown>;
  const n = (key: string) => Number(raw[key] ?? 0);
  return {
    storesTotal: n("stores_total"),
    stores7d: n("stores_7d"),
    stores30d: n("stores_30d"),
    storesWithItems: n("stores_with_items"),
    storesPro: n("stores_pro"),
    itemsActive: n("items_active"),
    items7d: n("items_7d"),
    itemsSold: n("items_sold"),
    wantClicksTotal: n("want_clicks_total"),
    wantClicks7d: n("want_clicks_7d"),
    views7d: n("views_7d"),
    reviewsTotal: n("reviews_total"),
    reportsOpen: n("reports_open"),
    signupsByDay: ((raw.signups_by_day as { day: string; count: number }[] | null) ?? []).map((row) => ({
      day: row.day,
      count: Number(row.count),
    })),
  };
}

export async function getAdminStores(limit = 100): Promise<AdminStore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_stores", { p_limit: limit });
  if (error) throw new Error(`No se pudo leer la lista de tiendas: ${error.message}`);

  type Row = {
    id: string;
    nick: string;
    store_name: string;
    email: string | null;
    whatsapp: string;
    plan: "free" | "pro";
    created_at: string;
    items_active: number;
    items_sold: number;
    want_clicks: number;
  };
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    nick: row.nick,
    storeName: row.store_name,
    email: row.email ?? "",
    whatsapp: row.whatsapp,
    plan: row.plan,
    createdAt: row.created_at,
    itemsActive: Number(row.items_active),
    itemsSold: Number(row.items_sold),
    wantClicks: Number(row.want_clicks),
  }));
}
