import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Condition } from "@/lib/catalog";
import type { ItemPhoto } from "@/lib/data/items";
import { toReputation, type Reputation } from "@/lib/reputation";
import { nickProblem } from "@/lib/nick";

/** Los vendidos se siguen mostrando 14 días con el sello "¡Vendido!" (spec §7.4). */
const SOLD_VISIBLE_DAYS = 14;

export type PublicStore = {
  id: string;
  nick: string;
  storeName: string;
  bio: string | null;
  avatarUrl: string | null;
  paymentLink: string | null;
  city: string;
  zone: string | null;
  isPro: boolean;
  /** Solo se aplica si la tienda es Pro. */
  accentColor: string | null;
  showExploreLink: boolean;
};

export type PublicItem = {
  id: string;
  title: string;
  description: string | null;
  priceUyu: number;
  category: Category;
  condition: Condition;
  defects: string | null;
  status: "active" | "sold";
  photos: ItemPhoto[];
  mainPhotoUrl: string | null;
};

export type PublicReview = {
  id: string;
  score: number;
  comment: string | null;
  sellerReply: string | null;
  createdAt: string;
};

export type StorePage = {
  store: PublicStore;
  items: PublicItem[];
  reputation: Reputation;
  reviews: PublicReview[];
};

export const storeTag = (sellerId: string) => `store:${sellerId}`;

type ProfileRow = {
  id: string;
  nick: string;
  store_name: string;
  bio: string | null;
  avatar_url: string | null;
  payment_link: string | null;
  city: string;
  zone: string | null;
  plan: "free" | "pro";
  plan_expires_at: string | null;
  accent_color: string | null;
  show_explore_link: boolean;
};

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  price_uyu: number;
  category: Category;
  condition: Condition;
  defects: string | null;
  status: "active" | "sold";
  item_photos: ItemPhoto[] | null;
};

function toStore(row: ProfileRow): PublicStore {
  const isPro =
    row.plan === "pro" && (!row.plan_expires_at || new Date(row.plan_expires_at) > new Date());
  return {
    id: row.id,
    nick: row.nick,
    storeName: row.store_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    paymentLink: row.payment_link,
    city: row.city,
    zone: row.zone,
    isPro,
    accentColor: isPro ? row.accent_color : null,
    // Solo los Pro pueden ocultar el link a Explorar.
    showExploreLink: isPro ? row.show_explore_link : true,
  };
}

function toItem(row: ItemRow): PublicItem {
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
  };
}

const PROFILE_COLUMNS =
  "id, nick, store_name, bio, avatar_url, payment_link, city, zone, plan, plan_expires_at, accent_color, show_explore_link";
const ITEM_COLUMNS =
  "id, title, description, price_uyu, category, condition, defects, status, item_photos (kind, url, position)";

/** Todo lo que necesita la tienda pública. Cacheado; se invalida con storeTag(sellerId). */
export async function getStorePage(nick: string): Promise<StorePage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`store-nick:${nick}`);

  if (nickProblem(nick) === "too_short" || nickProblem(nick) === "invalid") return null;

  const supabase = createPublicClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("nick", nick)
    .maybeSingle<ProfileRow>();
  if (!profile) return null;

  cacheTag(storeTag(profile.id));

  const soldSince = new Date(Date.now() - SOLD_VISIBLE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [itemsResult, reputationResult, reviewsResult] = await Promise.all([
    supabase
      .from("items")
      .select(ITEM_COLUMNS)
      .eq("seller_id", profile.id)
      .or(`status.eq.active,and(status.eq.sold,sold_at.gte.${soldSince})`)
      .order("created_at", { ascending: false })
      .overrideTypes<ItemRow[], { merge: false }>(),
    supabase.rpc("seller_reputation", { p_seller_id: profile.id }),
    supabase
      .from("reviews")
      .select("id, score, comment, seller_reply, created_at")
      .eq("seller_id", profile.id)
      .eq("received", "yes")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items = (itemsResult.data ?? []).map(toItem);
  // Disponibles primero; los vendidos al final.
  items.sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold"));

  return {
    store: toStore(profile),
    items,
    reputation: toReputation(reputationResult.data),
    reviews: (reviewsResult.data ?? []).map((review) => ({
      id: review.id as string,
      score: Number(review.score),
      comment: review.comment as string | null,
      sellerReply: review.seller_reply as string | null,
      createdAt: review.created_at as string,
    })),
  };
}
