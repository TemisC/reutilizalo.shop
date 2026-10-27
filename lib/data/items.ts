import { createClient } from "@/lib/supabase/server";
import type { Category, Condition, PhotoKind } from "@/lib/catalog";

export type ItemStatus = "active" | "sold" | "hidden" | "removed_by_admin";

export type ItemPhoto = { kind: PhotoKind; url: string; position: number };

export type SellerItem = {
  id: string;
  title: string;
  description: string | null;
  priceUyu: number;
  category: Category;
  condition: Condition;
  defects: string | null;
  status: ItemStatus;
  photos: ItemPhoto[];
  mainPhotoUrl: string | null;
  /** Toques en "Lo quiero" (personas interesadas). */
  interestedCount: number;
  /** Visitas al artículo (una por navegador y por día). Se muestran solo en el plan Pro. */
  viewCount: number;
};

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  price_uyu: number;
  category: Category;
  condition: Condition;
  defects: string | null;
  status: ItemStatus;
  item_photos: ItemPhoto[] | null;
  want_clicks: { count: number }[] | null;
  views: { count: number }[] | null;
};

const ITEM_COLUMNS =
  "id, title, description, price_uyu, category, condition, defects, status, item_photos (kind, url, position), want_clicks:item_events (count), views:item_events (count)";

function toSellerItem(row: ItemRow): SellerItem {
  const photos = [...(row.item_photos ?? [])].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceUyu: row.price_uyu,
    category: row.category,
    condition: row.condition,
    defects: row.defects,
    status: row.status,
    photos,
    mainPhotoUrl: photos.find((photo) => photo.kind === "main")?.url ?? photos[0]?.url ?? null,
    interestedCount: row.want_clicks?.[0]?.count ?? 0,
    viewCount: row.views?.[0]?.count ?? 0,
  };
}

/** Todos los artículos del vendedor (RLS ya limita a los propios). */
export async function getSellerItems(sellerId: string): Promise<SellerItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("seller_id", sellerId)
    .eq("want_clicks.type", "want_click")
    .eq("views.type", "view")
    .order("created_at", { ascending: false })
    .overrideTypes<ItemRow[], { merge: false }>();
  return (data ?? []).map(toSellerItem);
}

export async function getSellerItem(sellerId: string, itemId: string): Promise<SellerItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("seller_id", sellerId)
    .eq("id", itemId)
    .eq("want_clicks.type", "want_click")
    .eq("views.type", "view")
    .maybeSingle()
    .overrideTypes<ItemRow, { merge: false }>();
  return data ? toSellerItem(data) : null;
}

export async function countActiveItems(sellerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("status", "active");
  return count ?? 0;
}
