import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/catalog";

export type Seller = {
  id: string;
  nick: string;
  storeName: string;
  email: string;
  /** Plan vigente: un Pro vencido cuenta como Gratis (igual que effective_plan() en la base). */
  plan: "free" | "pro";
  itemLimit: number;
  /** Cuenta del equipo de Reutilizalo (profile_private.is_admin). */
  isAdmin: boolean;
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

  const { data: privateData } = await supabase
    .from("profile_private")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  const isPro =
    profile.plan === "pro" &&
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());
  const plan = isPro ? "pro" : "free";

  return {
    id: profile.id,
    nick: profile.nick,
    storeName: profile.store_name,
    email: typeof claimsData?.claims?.email === "string" ? claimsData.claims.email : "",
    plan,
    itemLimit: PLAN_LIMITS[plan],
    isAdmin: privateData?.is_admin === true,
  };
});

/** Como requireSeller, pero solo para el equipo de Reutilizalo: al resto lo manda a su panel. */
export async function requireAdmin(): Promise<Seller> {
  const seller = await requireSeller();
  if (!seller.isAdmin) redirect("/panel");
  return seller;
}
