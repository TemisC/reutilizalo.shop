// Compresión en el navegador antes de subir (spec §4): máx. 1600 px de lado, WebP ~0.8.

/**
 * Tope del archivo original. Es alto porque las fotos de cámara de hoy pesan 5–15 MB y acá se achican
 * a unos cientos de KB antes de subir (el bucket limita el archivo ya comprimido).
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 1600;
const QUALITY = 0.8;

export type CompressedImage = { blob: Blob; extension: "webp" | "jpg" };

export class ImageValidationError extends Error {}

/** Algunas galerías de Android mandan el archivo sin tipo: ahí se mira la extensión. */
function looksLikeImage(file: File) {
  if (file.type) return file.type.startsWith("image/");
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name);
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

/**
 * Lee la foto con el método más moderno que tenga el navegador y, si falla, con uno más compatible.
 * imageOrientation "from-image" respeta la orientación EXIF de las fotos del celular.
 */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    for (const options of [{ imageOrientation: "from-image" } as const, undefined]) {
      try {
        const bitmap = options ? await createImageBitmap(file, options) : await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
      } catch {
        // Sigue con la próxima forma.
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageValidationError("No pudimos leer esa foto. Prueba con otra (JPG o PNG).");
  }
}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!looksLikeImage(file)) {
    throw new ImageValidationError("Ese archivo no es una imagen.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("La foto pesa más de 25 MB. Prueba con otra.");
  }

  const image = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    image.release();
    throw new ImageValidationError("Tu navegador no pudo procesar la foto.");
  }
  context.drawImage(image.source, 0, 0, width, height);
  image.release();

  try {
    const webp = await toBlob(canvas, "image/webp");
    // Algunos Safari viejos ignoran WebP y devuelven PNG: en ese caso, JPEG.
    if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };

    const jpeg = await toBlob(canvas, "image/jpeg");
    if (!jpeg) throw new ImageValidationError("Tu navegador no pudo procesar la foto.");
    return { blob: jpeg, extension: "jpg" };
  } finally {
    // Libera la memoria del canvas enseguida: al subir varias fotos seguidas, el celular la necesita.
    canvas.width = 0;
    canvas.height = 0;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}
