/**
 * Imagen para historias de Instagram (1080 × 1920), dibujada en el navegador con canvas.
 * Se arma en el celular de quien comparte: no gasta servidor y usa las mismas fuentes de la app.
 * Arriba y abajo quedan márgenes libres porque Instagram tapa esas zonas con su interfaz.
 */

/**
 * Frases de la línea chica del recuadro negro, donde se pega el sticker "Enlace".
 * Varían entre historia e historia para que no se vean todas iguales. Van con voseo uruguayo
 * ("tocá", "escribime") porque son la voz de quien comparte en su propia historia.
 */
export const STORY_PHRASES = [
  "Tocá el enlace para verlo",
  "¿Lo querés? Tocá el enlace",
  "Tocá el enlace y escribime",
  "Más fotos y detalles en el enlace",
  "Tocá el enlace antes de que vuele",
  "Miralo en mi tienda: tocá el enlace",
  "Tocá el enlace para ver el precio y más",
  "¿Te interesa? Tocá el enlace",
  "Tocá el enlace y mirá más cosas",
  "Lo vendo: tocá el enlace",
] as const;

/** Una frase al azar, distinta de `previous` si se pasa. */
export function randomPhrase(previous?: string) {
  const options = STORY_PHRASES.filter((phrase) => phrase !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

export type StoryData = {
  photoUrl: string | null;
  title: string;
  price: string;
  condition: string;
  /** "reutilizalo.shop/nick" */
  linkLabel: string;
  /** Una de STORY_PHRASES. */
  phrase: string;
  accent: string;
};

const W = 1080;
const H = 1920;
const COLORS = { canvas: "#f3f5f1", surface: "#ffffff", ink: "#14201a", muted: "#4f5b54", chip: "#eef0ec" };

/** Familias reales de next/font (definidas como variables CSS en <html>). */
function fontFamilies() {
  const style = getComputedStyle(document.documentElement);
  const display = style.getPropertyValue("--font-bricolage").trim() || "sans-serif";
  const sans = style.getPropertyValue("--font-dm-sans").trim() || "sans-serif";
  return { display, sans };
}

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("foto: tardó demasiado")), 12000);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error("foto: no cargó"));
    };
    image.src = src;
  });
}

/**
 * La foto pasa primero por el optimizador de Next (mismo dominio, el canvas la puede exportar);
 * si falla, se pide directo a Supabase con CORS. Sin foto, la historia sale igual.
 */
async function loadPhoto(url: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(`/_next/image?url=${encodeURIComponent(url)}&w=1080&q=75`, false);
  } catch {
    return loadImage(url, true).catch(() => null);
  }
}

/** Rectángulo redondeado sin ctx.roundRect, que algunos navegadores de celular no tienen. */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Espera las fuentes de la app, pero sin trabar la imagen si el navegador no responde. */
async function loadFonts(display: string, sans: string) {
  if (!document.fonts?.load) return;
  const fonts = Promise.all([document.fonts.load(`800 100px ${display}`), document.fonts.load(`700 40px ${sans}`)]);
  await Promise.race([fonts.catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 3000))]);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const fromDataUrl = () => {
      try {
        const [header, base64] = canvas.toDataURL("image/png").split(",");
        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        resolve(new Blob([bytes], { type: header.match(/:(.*?);/)?.[1] ?? "image/png" }));
      } catch (error) {
        reject(new Error(`exportar: ${error instanceof Error ? error.message : "falló"}`));
      }
    };
    if (!canvas.toBlob) return fromDataUrl();
    canvas.toBlob((blob) => (blob ? resolve(blob) : fromDataUrl()), "image/png");
  });
}

/** Corta el texto en hasta `maxLines` renglones; el último lleva "…" si no entra. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/** Achica la fuente hasta que el texto entre en `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxWidth: number) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (current > 20 && ctx.measureText(text).width > maxWidth) {
    current -= 2;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

export async function renderStoryImage(data: StoryData): Promise<Blob> {
  const { display, sans } = fontFamilies();
  const [, photo] = await Promise.all([loadFonts(display, sans), data.photoUrl ? loadPhoto(data.photoUrl) : null]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas: no disponible");
  ctx.textBaseline = "top";

  ctx.fillStyle = COLORS.canvas;
  ctx.fillRect(0, 0, W, H);

  // Logo: reutilizalo.shop
  ctx.font = `800 58px ${display}`;
  const brand = "reutilizalo";
  const brandWidth = ctx.measureText(brand).width;
  const totalWidth = brandWidth + ctx.measureText(".shop").width;
  const brandX = (W - totalWidth) / 2;
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(brand, brandX, 150);
  ctx.fillStyle = data.accent;
  ctx.fillText(".shop", brandX + brandWidth, 150);

  // Tarjeta con la foto.
  const card = { x: 90, y: 250, w: 900, h: 900 };
  ctx.save();
  ctx.shadowColor = "rgba(20, 32, 26, 0.12)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = COLORS.surface;
  roundedRect(ctx, card.x, card.y, card.w, card.h, 64);
  ctx.fill();
  ctx.restore();

  const inner = { x: card.x + 20, y: card.y + 20, w: card.w - 40, h: card.h - 40 };
  ctx.save();
  roundedRect(ctx, inner.x, inner.y, inner.w, inner.h, 48);
  ctx.clip();
  ctx.fillStyle = COLORS.chip;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  if (photo) {
    // object-fit: cover
    const scale = Math.max(inner.w / photo.naturalWidth, inner.h / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.drawImage(photo, inner.x + (inner.w - w) / 2, inner.y + (inner.h - h) / 2, w, h);
  }
  ctx.restore();

  // Estado del artículo, arriba a la izquierda de la foto.
  ctx.font = `700 34px ${sans}`;
  const chipWidth = ctx.measureText(data.condition).width + 56;
  ctx.fillStyle = COLORS.surface;
  roundedRect(ctx, inner.x + 28, inner.y + 28, chipWidth, 68, 34);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(data.condition, inner.x + 56, inner.y + 44);

  // Título y precio.
  ctx.fillStyle = COLORS.ink;
  ctx.font = `800 70px ${display}`;
  const lines = wrapLines(ctx, data.title, 900, 2);
  lines.forEach((line, index) => ctx.fillText(line, 90, 1210 + index * 82));
  const priceTop = 1210 + lines.length * 82 + 18;
  ctx.fillStyle = data.accent;
  ctx.font = `800 104px ${display}`;
  ctx.fillText(data.price, 90, priceTop);

  // Dónde encontrarlo.
  const pill = { x: 90, y: 1560, w: 900, h: 150 };
  ctx.fillStyle = COLORS.ink;
  roundedRect(ctx, pill.x, pill.y, pill.w, pill.h, 44);
  ctx.fill();
  ctx.fillStyle = "#ffd45c";
  fitFont(ctx, data.phrase, 700, 34, sans, pill.w - 96);
  ctx.fillText(data.phrase, pill.x + 48, pill.y + 24);
  ctx.fillStyle = COLORS.surface;
  fitFont(ctx, data.linkLabel, 800, 52, display, pill.w - 96);
  ctx.fillText(data.linkLabel, pill.x + 48, pill.y + 72);

  return canvasToBlob(canvas);
}
