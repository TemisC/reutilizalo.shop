// Etiquetas en español de los enums de la base de datos.

export const CATEGORIES = {
  ropa: "Ropa",
  hogar: "Hogar",
  ninos: "Niños",
  libros: "Libros",
  deporte: "Deporte",
  tecnologia: "Tecnología",
  otros: "Otros",
} as const;

export type Category = keyof typeof CATEGORIES;

export const CONDITIONS = {
  nuevo_con_etiqueta: "Nuevo con etiqueta",
  como_nuevo: "Como nuevo",
  muy_buen_estado: "Muy buen estado",
  buen_estado: "Buen estado",
  con_detalles: "Con detalles",
} as const;

export type Condition = keyof typeof CONDITIONS;

/** Estados en los que conviene mostrar los detalles (regla suave de honestidad). */
export const CONDITIONS_NEEDING_DETAILS: readonly Condition[] = ["buen_estado", "con_detalles"];

export const PHOTO_SLOTS = [
  { kind: "main", label: "Principal", required: true },
  { kind: "angle", label: "Otro ángulo", required: false },
  { kind: "label", label: "Etiqueta o talle", required: false },
  { kind: "defect", label: "Detalles o desgaste", required: false, recommended: true },
] as const;

export type PhotoKind = (typeof PHOTO_SLOTS)[number]["kind"];

export const PLAN_LIMITS = { free: 5, pro: 50 } as const;

/**
 * Invitaciones: cada tienda invitada que publica su primer artículo le suma 1 lugar gratis a quien
 * la invitó (hasta 5), y la invitada también gana 1. El plan gratis nunca pasa de 10.
 * Deben coincidir con plan_item_limit() en supabase/migrations; la base es la que decide.
 */
export const REFERRAL_MAX_BONUS = 5;
export const FREE_MAX_WITH_REFERRALS = 10;

/** Precio mensual del Plan Pro en pesos uruguayos. Cambiarlo acá lo actualiza en toda la app. */
export const PRO_PRICE_UYU = 490;
