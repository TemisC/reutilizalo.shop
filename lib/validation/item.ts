import { z } from "zod";
import { CATEGORIES, CONDITIONS, PHOTO_SLOTS, type Category, type Condition } from "@/lib/catalog";

const categoryKeys = Object.keys(CATEGORIES) as [Category, ...Category[]];
const conditionKeys = Object.keys(CONDITIONS) as [Condition, ...Condition[]];
const photoKinds = PHOTO_SLOTS.map((slot) => slot.kind) as [
  (typeof PHOTO_SLOTS)[number]["kind"],
  ...(typeof PHOTO_SLOTS)[number]["kind"][],
];

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
  photos: z
    .array(
      z.object({
        kind: z.enum(photoKinds),
        path: z.string().regex(photoPathPattern),
      }),
    )
    .max(4)
    .refine((photos) => photos.some((photo) => photo.kind === "main"), "Sube la foto principal.")
    .refine(
      (photos) => new Set(photos.map((photo) => photo.kind)).size === photos.length,
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
  photos: { kind: (typeof PHOTO_SLOTS)[number]["kind"]; path: string }[];
};

export type ItemFieldErrors = Partial<Record<keyof ItemInput, string>>;
