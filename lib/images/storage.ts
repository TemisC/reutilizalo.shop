export const ITEM_PHOTOS_BUCKET = "item-photos";

export function publicPhotoUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${ITEM_PHOTOS_BUCKET}/${path}`;
}

/** Inverso de publicPhotoUrl: extrae "<user_id>/<archivo>" de la URL pública. */
export function photoPathFromUrl(url: string): string | null {
  const marker = `/object/public/${ITEM_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}
