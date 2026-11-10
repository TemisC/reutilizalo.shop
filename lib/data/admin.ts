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

/** Tiendas que llegaron con link de invitación frente a las que llegaron solas. */
export type ReferralGroup = {
  total: number;
  /** Publicaron al menos un artículo alguna vez. */
  published: number;
  /** Nunca publicaron y tienen más de 7 días: cuentas fantasma. */
  empty: number;
  /** Nunca publicaron pero tienen menos de 7 días: todavía pueden hacerlo. */
  recent: number;
};

export type AdminReferralStats = {
  referred: ReferralGroup;
  organic: ReferralGroup;
  /** Lugares gratis extra entregados entre todas las tiendas del plan gratis. */
  bonusSlots: number;
};

export type AdminReferrer = {
  id: string;
  nick: string;
  storeName: string;
  invited: number;
  published: number;
  empty: number;
  recent: number;
  bonus: number;
  /** Invitadas con el mismo WhatsApp que quien invita (no suman lugares). */
  sameWhatsapp: number;
  /** Invitadas con un email casi igual al de quien invita o al de otra invitada. */
  similarEmail: number;
  /** Invitadas creadas a menos de 10 minutos de otra invitada. */
  burst: number;
  lastInvitedAt: string;
};

export async function getAdminReferralStats(): Promise<AdminReferralStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_referral_stats");
  if (error || !data) throw new Error(`No se pudieron leer los referidos: ${error?.message ?? "sin datos"}`);

  const raw = data as Record<string, unknown>;
  const group = (prefix: string): ReferralGroup => ({
    total: Number(raw[`${prefix}_total`] ?? 0),
    published: Number(raw[`${prefix}_published`] ?? 0),
    empty: Number(raw[`${prefix}_empty`] ?? 0),
    recent: Number(raw[`${prefix}_recent`] ?? 0),
  });
  return { referred: group("referred"), organic: group("organic"), bonusSlots: Number(raw.bonus_slots ?? 0) };
}

export async function getAdminReferrers(limit = 100): Promise<AdminReferrer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_referrers", { p_limit: limit });
  if (error) throw new Error(`No se pudo leer la lista de referidos: ${error.message}`);

  type Row = {
    id: string;
    nick: string;
    store_name: string;
    invited: number;
    published: number;
    empty: number;
    recent: number;
    bonus: number;
    same_whatsapp: number;
    similar_email: number;
    burst: number;
    last_invited_at: string;
  };
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    nick: row.nick,
    storeName: row.store_name,
    invited: Number(row.invited),
    published: Number(row.published),
    empty: Number(row.empty),
    recent: Number(row.recent),
    bonus: Number(row.bonus),
    sameWhatsapp: Number(row.same_whatsapp),
    similarEmail: Number(row.similar_email),
    burst: Number(row.burst),
    lastInvitedAt: row.last_invited_at,
  }));
}
