import { formatUYU } from "@/lib/format";

/** Mensaje de "Lo quiero" (spec §7.4). */
export function wantMessage(title: string, priceUyu: number, itemUrl: string) {
  return `Hola! Vi en tu tienda de Reutilizalo "${title}" a ${formatUYU(priceUyu)}. ¿Sigue disponible? ${itemUrl}`;
}

/** https://wa.me/<número sin +>?text=<mensaje> */
export function whatsappLink(e164Phone: string, text: string) {
  return `https://wa.me/${e164Phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** WhatsApp de Reutilizalo donde se atienden a mano las altas del Plan Pro. */
export const PRO_SALES_WHATSAPP = "+59897200604";

/** Link del botón "Empezar con Plan Pro". */
export const PRO_PLAN_WHATSAPP_LINK = whatsappLink(PRO_SALES_WHATSAPP, "Hola quiero el Plan Pro de Reutilizalo.shop");