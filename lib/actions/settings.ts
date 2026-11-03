"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toE164 } from "@/lib/format";
import { storeTag } from "@/lib/data/store";

// ---------------------------------------------------------------------
// Datos de la tienda: nombre y WhatsApp
// ---------------------------------------------------------------------

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, "Ponle un nombre a tu tienda.").max(60, "Usa hasta 60 caracteres."),
  countryCode: z.string().trim().regex(/^\+?[1-9]\d{0,3}$/, "Prefijo inválido."),
  whatsapp: z.string().trim().min(1, "Necesitamos tu WhatsApp para que te escriban."),
});

export type StoreSettingsField = keyof z.infer<typeof storeSettingsSchema>;

export type StoreSettingsState = {
  errors?: Partial<Record<StoreSettingsField, string>>;
  message?: string;
  /** Momento del último guardado exitoso (para mostrar el aviso unos segundos). */
  savedAt?: number;
};

export async function updateStoreSettings(
  _prev: StoreSettingsState,
  formData: FormData,
): Promise<StoreSettingsState> {
  const parsed = storeSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
      ),
    };
  }

  const whatsapp = toE164(parsed.data.countryCode, parsed.data.whatsapp);
  if (!whatsapp) return { errors: { whatsapp: "Revisa el número: por ejemplo, 099 123 456." } };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { message: "Tu sesión venció. Vuelve a iniciar sesión." };

  // RLS y los permisos por columna solo dejan que cada vendedor cambie lo suyo.
  const [{ error: profileError }, { error: privateError }] = await Promise.all([
    supabase.from("profiles").update({ store_name: parsed.data.storeName }).eq("id", userId),
    supabase.from("profile_private").update({ whatsapp }).eq("id", userId),
  ]);
  if (profileError || privateError) {
    return { message: "No pudimos guardar los cambios. Prueba de nuevo en un rato." };
  }

  revalidatePath("/panel", "layout");
  updateTag(storeTag(userId));
  return { savedAt: Date.now() };
}

// ---------------------------------------------------------------------
// Contraseña
// ---------------------------------------------------------------------

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual."),
    newPassword: z.string().min(8, "Usa al menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las dos contraseñas nuevas no coinciden.",
  });

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export type PasswordState = {
  errors?: Partial<Record<PasswordField, string>>;
  message?: string;
  /** Momento del último guardado exitoso (para mostrar el aviso unos segundos). */
  savedAt?: number;
};

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
      ),
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email;
  if (typeof email !== "string") return { message: "Tu sesión venció. Vuelve a iniciar sesión." };

  // Pedimos la contraseña actual para que nadie la cambie desde una sesión olvidada abierta.
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword,
  });
  if (checkError) {
    if (checkError.code === "over_request_rate_limit") {
      return { message: "Hubo muchos intentos seguidos. Espera unos minutos." };
    }
    return { errors: { currentPassword: "La contraseña actual no es correcta." } };
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { errors: { newPassword: "La nueva contraseña tiene que ser distinta de la actual." } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    if (error.code === "weak_password") return { errors: { newPassword: "Elige una contraseña más segura." } };
    if (error.code === "same_password") {
      return { errors: { newPassword: "La nueva contraseña tiene que ser distinta de la actual." } };
    }
    return { message: "No pudimos cambiar la contraseña. Prueba de nuevo en un rato." };
  }

  return { savedAt: Date.now() };
}
