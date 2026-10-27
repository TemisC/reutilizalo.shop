"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_SLOTS } from "@/lib/catalog";
import { itemInputSchema, type ItemFieldErrors } from "@/lib/validation/item";
import { ITEM_PHOTOS_BUCKET, photoPathFromUrl, publicPhotoUrl } from "@/lib/images/storage";
import { storeTag } from "@/lib/data/store";

export type ItemActionResult = { fieldErrors?: ItemFieldErrors; message?: string };

const PLAN_LIMIT_MESSAGE =
  "Llegaste al límite de artículos activos de tu plan. Marca alguno como vendido u ocúltalo, o pásate a Pro.";

function dbErrorMessage(error: { message: string }): string {
  if (error.message.includes("plan_limit_reached")) return PLAN_LIMIT_MESSAGE;
  if (error.message.includes("item_removed_by_admin")) {
    return "Este artículo fue retirado por moderación y no se puede volver a publicar.";
  }
  if (error.message.includes("photo_limit_reached")) return "Puedes subir hasta 4 fotos.";
  return "No pudimos guardar los cambios. Prueba de nuevo en un rato.";
}

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function parseItem(input: unknown, userId: string) {
  const parsed = itemInputSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    return {
      error: {
        fieldErrors: Object.fromEntries(
          Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
        ) as ItemFieldErrors,
        message: formErrors[0],
      } satisfies ItemActionResult,
    };
  }
  // Cada vendedor solo puede referenciar fotos de su propia carpeta.
  if (parsed.data.photos.some((photo) => !photo.path.startsWith(`${userId}/`))) {
    return { error: { message: "Hay fotos que no son tuyas." } satisfies ItemActionResult };
  }
  return { data: parsed.data };
}

function photoRows(itemId: string, photos: { kind: string; path: string }[]) {
  return photos.map((photo) => ({
    item_id: itemId,
    kind: photo.kind,
    url: publicPhotoUrl(photo.path),
    position: PHOTO_SLOTS.findIndex((slot) => slot.kind === photo.kind),
  }));
}

function revalidateSellerPages(sellerId: string) {
  revalidatePath("/panel");
  // Tienda pública cacheada (lib/data/store.ts): el vendedor ve su cambio enseguida.
  updateTag(storeTag(sellerId));
}

// ---------------------------------------------------------------------

export async function createItem(input: unknown): Promise<ItemActionResult> {
  const { supabase, userId } = await requireUserId();
  const parsed = parseItem(input, userId);
  if (parsed.error) return parsed.error;
  const item = parsed.data;

  const { data: created, error } = await supabase
    .from("items")
    .insert({
      seller_id: userId,
      title: item.title,
      description: item.description || null,
      price_uyu: item.price,
      category: item.category,
      condition: item.condition,
      defects: item.defects || null,
      honesty_confirmed: item.honestyConfirmed,
    })
    .select("id")
    .single();

  if (error || !created) return { message: dbErrorMessage(error ?? { message: "" }) };

  const { error: photosError } = await supabase
    .from("item_photos")
    .insert(photoRows(created.id, item.photos));

  if (photosError) {
    await supabase.from("items").delete().eq("id", created.id);
    return { message: dbErrorMessage(photosError) };
  }

  revalidateSellerPages(userId);
  redirect("/panel");
}

export async function updateItem(itemId: string, input: unknown): Promise<ItemActionResult> {
  const { supabase, userId } = await requireUserId();
  const parsed = parseItem(input, userId);
  if (parsed.error) return parsed.error;
  const item = parsed.data;

  const { data: updated, error } = await supabase
    .from("items")
    .update({
      title: item.title,
      description: item.description || null,
      price_uyu: item.price,
      category: item.category,
      condition: item.condition,
      defects: item.defects || null,
      honesty_confirmed: item.honestyConfirmed,
    })
    .eq("id", itemId)
    .eq("seller_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { message: dbErrorMessage(error) };
  if (!updated) return { message: "No encontramos ese artículo." };

  const { data: existing } = await supabase
    .from("item_photos")
    .select("kind, url")
    .eq("item_id", itemId);

  const keptKinds = item.photos.map((photo) => photo.kind);
  const removedKinds = (existing ?? [])
    .map((photo) => photo.kind as string)
    .filter((kind) => !keptKinds.includes(kind as (typeof keptKinds)[number]));

  if (removedKinds.length > 0) {
    await supabase.from("item_photos").delete().eq("item_id", itemId).in("kind", removedKinds);
  }

  const { error: photosError } = await supabase
    .from("item_photos")
    .upsert(photoRows(itemId, item.photos), { onConflict: "item_id,kind" });
  if (photosError) return { message: dbErrorMessage(photosError) };

  // Borra del Storage los archivos que ya no se usan.
  const newPaths = new Set(item.photos.map((photo) => photo.path));
  const orphaned = (existing ?? [])
    .map((photo) => photoPathFromUrl(photo.url as string))
    .filter((path): path is string => Boolean(path) && !newPaths.has(path!));
  if (orphaned.length > 0) {
    await supabase.storage.from(ITEM_PHOTOS_BUCKET).remove(orphaned);
  }

  revalidateSellerPages(userId);
  redirect("/panel");
}

const statusSchema = z.enum(["active", "hidden", "sold"]);

/** Ocultar, volver a publicar o marcar vendido. Pensado para usarse con .bind en un <form>. */
export async function setItemStatus(
  itemId: string,
  status: z.infer<typeof statusSchema>,
): Promise<ItemActionResult> {
  const nextStatus = statusSchema.parse(status);
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("items")
    .update({ status: nextStatus })
    .eq("id", itemId)
    .eq("seller_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { message: dbErrorMessage(error) };
  if (!data) return { message: "No encontramos ese artículo." };

  revalidateSellerPages(userId);
  return {};
}
