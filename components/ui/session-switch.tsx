"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Muestra `member` si quien mira tiene la sesión iniciada y `guest` si no. La sesión se lee en el
 * navegador (sin ir al servidor), así las páginas públicas siguen siendo estáticas y rápidas.
 */
export function SessionSwitch({ guest, member }: { guest: ReactNode; member: ReactNode }) {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return hasSession ? member : guest;
}
