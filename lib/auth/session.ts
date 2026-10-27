import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/catalog";

export type Seller = {
  id: string;
  nick: string;
  storeName: string;
  /** Plan vigente: un Pro vencido cuenta como Gratis (igual que effective_plan() en la base). */
  plan: "free" | "pro";
  itemLimit: number;
};

/**
 * Capa de acceso a la sesión: devuelve el vendedor logueado o redirige a /login.
 * Lee cookies, así que se usa dentro de <Suspense>. Memoizado por request con cache().
 */
export const requireSeller = cache(async (): Promise<Seller> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nick, store_name, plan, plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) redirect("/crear");

  const isPro =
    profile.plan === "pro" &&
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());
  const plan = isPro ? "pro" : "free";

  return {
    id: profile.id,
    nick: profile.nick,
    storeName: profile.store_name,
    plan,
    itemLimit: PLAN_LIMITS[plan],
  };
});
