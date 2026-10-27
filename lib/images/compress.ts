// Compresión en el navegador antes de subir (spec §4): máx. 1600 px de lado, WebP ~0.8.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1600;
const QUALITY = 0.8;

export type CompressedImage = { blob: Blob; extension: "webp" | "jpg" };

export class ImageValidationError extends Error {}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageValidationError("Ese archivo no es una imagen.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("La foto pesa más de 5 MB. Prueba con otra.");
  }

  let bitmap: ImageBitmap;
  try {
    // from-image respeta la orientación EXIF de las fotos del celular.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageValidationError("No pudimos leer esa foto. Prueba con otra (JPG o PNG).");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImageValidationError("Tu navegador no pudo procesar la foto.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp");
  // Algunos Safari viejos ignoran WebP y devuelven PNG: en ese caso, JPEG.
  if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };

  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new ImageValidationError("Tu navegador no pudo procesar la foto.");
  return { blob: jpeg, extension: "jpg" };
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}
