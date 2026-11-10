/**
 * Dominio público, sin espacios ni barra final: un salto de línea pegado por error en la variable
 * de Vercel rompía todos los links copiados ("https://reutilizalo.shop
/temis").
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://reutilizalo.shop").trim().replace(/\/+$/, "");

/** Link completo de una tienda, para copiar o compartir. */
export function storeUrl(nick: string) {
  return `${SITE_URL}/${nick}`;
}

/** Link para invitar a otra persona a crear su tienda. */
export function inviteUrl(nick: string) {
  return `${SITE_URL}/crear?ref=${nick}`;
}

/** Link tal como se muestra en pantalla: siempre "reutilizalo.shop/nick". */
export function storeLinkLabel(nick: string) {
  return `reutilizalo.shop/${nick}`;
}

/** "La tiendita de Paola" → "Paola"; si no sigue ese patrón, el nombre completo. */
export function greetingName(storeName: string) {
  const match = storeName.match(/\bde\s+(\p{L}[\p{L}\s-]*)$/iu);
  return match ? match[1].trim() : storeName;
}

/** Inicial para el avatar: "La tiendita de Paola" → "P". */
export function initialOf(text: string) {
  return (greetingName(text).trim()[0] ?? "R").toUpperCase();
}
