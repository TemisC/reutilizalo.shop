import { createClient } from "@/lib/supabase/server";
import { toReputation, type Reputation } from "@/lib/reputation";

export async function getReputation(sellerId: string): Promise<Reputation> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("seller_reputation", { p_seller_id: sellerId });
  return toReputation(data);
}

export type SellerReview = {
  id: string;
  score: number;
  comment: string | null;
  buyerName: string | null;
  itemTitle: string | null;
  createdAt: string;
};

type ReviewRow = {
  id: string;
  score: number | string;
  comment: string | null;
  created_at: string;
  sales: { buyer_name: string | null; items: { title: string } | null } | null;
};

/** Últimas calificaciones recibidas, para el panel (el vendedor puede leer sus ventas). */
export async function getRecentReviews(sellerId: string, limit = 3): Promise<SellerReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, score, comment, created_at, sales (buyer_name, items (title))")
    .eq("seller_id", sellerId)
    .eq("received", "yes")
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<ReviewRow[], { merge: false }>();

  return (data ?? []).map((row) => ({
    id: row.id,
    score: Number(row.score),
    comment: row.comment,
    buyerName: row.sales?.buyer_name ?? null,
    itemTitle: row.sales?.items?.title ?? null,
    createdAt: row.created_at,
  }));
}
