"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { nickProblem, normalizeNick, NICK_PROBLEM_MESSAGES, type NickProblem } from "@/lib/nick";
import { toE164 } from "@/lib/format";
import { safeNextPath } from "@/lib/safe-next";

// ---------------------------------------------------------------------
// Disponibilidad del nick (se llama en vivo desde /crear)
// ---------------------------------------------------------------------

export type NickStatus = "available" | "taken" | NickProblem | "unavailable_service";

export async function checkNickAvailability(raw: string): Promise<{ nick: string; status: NickStatus }> {
  const nick = normalizeNick(raw);
  const problem = nickProblem(nick);
  if (problem) return { nick, status: problem };
  if (!hasSupabaseEnv()) return { nick, status: "unavailable_service" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nick_available", { p_nick: nick });
  if (error) return { nick, status: "unavailable_service" };
  return { nick, status: data ? "available" : "taken" };
}

// ---------------------------------------------------------------------
// Crear tienda (registro)
// ---------------------------------------------------------------------

const createStoreSchema = z.object({
  nick: z.string().transform(normalizeNick),
  storeName: z
    .string()
    .trim()
    .min(1, "Ponle un nombre a tu tienda.")
    .max(60, "Usa hasta 60 caracteres."),
  countryCode: z.string().trim().regex(/^\+?[1-9]\d{0,3}$/, "Prefijo inválido."),
  whatsapp: z.string().trim().min(1, "Necesitamos tu WhatsApp para que te escriban."),
  email: z.email("Revisa tu email."),
  password: z.string().min(8, "Usa al menos 8 caracteres."),
  // Casilla obligatoria: el navegador manda "on" solo si está marcada.
  acceptTerms: z.literal("on", "Para crear tu tienda tienes que aceptar los Términos de uso."),
});

export type CreateStoreField = keyof z.infer<typeof createStoreSchema>;

export type CreateStoreState = {
  errors?: Partial<Record<CreateStoreField, string>>;
  message?: string;
  confirmEmailSentTo?: string;
};

export async function createStore(
  _prev: CreateStoreState,
  formData: FormData,
): Promise<CreateStoreState> {
  const parsed = createStoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
      ),
    };
  }

  const { nick, storeName, countryCode, email, password } = parsed.data;
  const errors: CreateStoreState["errors"] = {};

  const problem = nickProblem(nick);
  if (problem) errors.nick = NICK_PROBLEM_MESSAGES[problem];

  const whatsapp = toE164(countryCode, parsed.data.whatsapp);
  if (!whatsapp) errors.whatsapp = "Revisa el número: por ejemplo, 099 123 456.";

  if (Object.keys(errors).length > 0) return { errors };

  if (!hasSupabaseEnv()) {
    return { message: "Todavía no conectamos la base de datos. Vuelve a intentarlo más tarde." };
  }

  const supabase = await createClient();

  // Chequeo previo para dar un error claro (el trigger igual lo valida).
  const { data: available } = await supabase.rpc("nick_available", { p_nick: nick });
  if (available === false) {
    return { errors: { nick: NICK_PROBLEM_MESSAGES.taken } };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // terms_accepted_at queda en los metadatos del usuario como constancia de la aceptación.
      data: { nick, store_name: storeName, whatsapp, terms_accepted_at: new Date().toISOString() },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/panel`,
    },
  });

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return { errors: { email: "Ya hay una cuenta con ese email. Inicia sesión." } };
      case "weak_password":
        return { errors: { password: "Elige una contraseña más segura." } };
      case "email_address_invalid":
        return { errors: { email: "Revisa tu email." } };
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return { message: "Hubo muchos intentos seguidos. Espera unos minutos y prueba de nuevo." };
      default: {
        // Si falló el trigger, lo más probable es que alguien tomó el nick recién.
        const { data: stillAvailable } = await supabase.rpc("nick_available", { p_nick: nick });
        if (stillAvailable === false) return { errors: { nick: NICK_PROBLEM_MESSAGES.taken } };
        return { message: "No pudimos crear tu tienda. Prueba de nuevo en un rato." };
      }
    }
  }

  // Con "Confirm email" activo, Supabase no avisa que el email ya existe:
  // devuelve un usuario sin identidades.
  if (data.user && data.user.identities?.length === 0) {
    return { errors: { email: "Ya hay una cuenta con ese email. Inicia sesión." } };
  }

  if (!data.session) {
    return { confirmEmailSentTo: email };
  }

  redirect("/panel");
}

// ---------------------------------------------------------------------
// Iniciar y cerrar sesión
// ---------------------------------------------------------------------

export type LoginState = { message?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { message: "Completa tu email y tu contraseña.", email };
  }
  if (!hasSupabaseEnv()) {
    return { message: "Todavía no conectamos la base de datos. Vuelve a intentarlo más tarde.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { message: "Primero confirma tu email: te mandamos un link a tu correo.", email };
    }
    if (error.code === "over_request_rate_limit") {
      return { message: "Hubo muchos intentos seguidos. Espera unos minutos.", email };
    }
    return { message: "El email o la contraseña no coinciden.", email };
  }

  redirect(next);
}

export async function logout() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
