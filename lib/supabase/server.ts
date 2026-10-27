import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

// Cliente para Server Components, Server Actions y Route Handlers.
// Lee cookies, así que en Server Components debe usarse dentro de <Suspense>.
export async function createClient() {
  // Primero cookies(): marca la ruta como dinámica antes de cualquier otra cosa.
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Desde un Server Component no se pueden escribir cookies;
          // el proxy ya se encarga de refrescar la sesión.
        }
      },
    },
  });
}
