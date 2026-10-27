import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Cliente anónimo, sin cookies ni sesión: lee solo lo público (lo que permite RLS a `anon`).
 * Se puede usar dentro de funciones con 'use cache', porque no depende del request.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
