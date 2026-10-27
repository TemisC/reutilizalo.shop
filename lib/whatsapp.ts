import { formatUYU } from "@/lib/format";

/** Mensaje de "Lo quiero" (spec §7.4). */
export function wantMessage(title: string, priceUyu: number, itemUrl: string) {
  return `Hola! Vi en tu tienda de Reutilizalo "${title}" a ${formatUYU(priceUyu)}. ¿Sigue disponible? ${itemUrl}`;
}

/** https://wa.me/<número sin +>?text=<mensaje> */
export function whatsappLink(e164Phone: string, text: string) {
  return `https://wa.me/${e164Phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
