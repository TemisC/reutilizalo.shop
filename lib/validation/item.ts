import { z } from "zod";
import { CATEGORIES, CONDITIONS, PHOTO_MAX, PHOTO_MIN, type Category, type Condition } from "@/lib/catalog";

const categoryKeys = Object.keys(CATEGORIES) as [Category, ...Category[]];
const conditionKeys = Object.keys(CONDITIONS) as [Condition, ...Condition[]];

/** Ruta dentro del bucket item-photos: <user_id>/<archivo>. */
export const photoPathPattern = /^[0-9a-f-]{36}\/[A-Za-z0-9-]{1,64}\.(webp|jpg|png)$/;

export const itemInputSchema = z.object({
  title: z.string().trim().min(1, "Ponle un título.").max(80, "Usa hasta 80 caracteres."),
  description: z.string().trim().max(600, "Usa hasta 600 caracteres.").default(""),
  price: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().min(1, "Ponle un precio."))
    .transform(Number)
    .pipe(z.number().int().min(0).max(100_000_000, "Revisa el precio.")),
  category: z.enum(categoryKeys, "Elige una categoría."),
  condition: z.enum(conditionKeys, "Elige el estado."),
  defects: z.string().trim().max(600, "Usa hasta 600 caracteres.").default(""),
  honestyConfirmed: z.literal(true, "Confirma que las fotos son reales para publicar."),
  /** En orden: la primera es la principal. */
  photos: z
    .array(z.object({ path: z.string().regex(photoPathPattern) }))
    .min(PHOTO_MIN, `Sube al menos ${PHOTO_MIN} fotos.`)
    .max(PHOTO_MAX, `Puedes subir hasta ${PHOTO_MAX} fotos.`)
    .refine(
      (photos) => new Set(photos.map((photo) => photo.path)).size === photos.length,
      "Hay fotos repetidas.",
    ),
});

/** Lo que manda el formulario; el servidor lo valida con itemInputSchema. */
export type ItemInput = {
  title: string;
  description: string;
  price: string;
  category: Category | "";
  condition: Condition | "";
  defects: string;
  honestyConfirmed: boolean;
  photos: { path: string }[];
};

export type ItemFieldErrors = Partial<Record<keyof ItemInput, string>>;
