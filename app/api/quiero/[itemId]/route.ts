import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { wantMessage, whatsappLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "Lo quiero": registra el toque (want_click) y redirige a WhatsApp con el mensaje armado.
// El número del vendedor no aparece en el HTML de la tienda; solo lo entrega register_want_click().
export async function GET(request: Request, { params }: RouteContext<"/api/quiero/[itemId]">) {
  const { itemId } = await params;
  const home = new URL("/", request.url);
  if (!UUID.test(itemId)) return NextResponse.redirect(home);

  const supabase = createPublicClient();
  const { data: item } = await supabase
    .from("items")
    .select("id, title, price_uyu, profiles (nick)")
    .eq("id", itemId)
    .maybeSingle<{ id: string; title: string; price_uyu: number; profiles: { nick: string } | null }>();

  const nick = item?.profiles?.nick;
  if (!item || !nick) return NextResponse.redirect(home);

  const itemPage = `/${nick}/${item.id}`;
  const { data: whatsapp } = await supabase.rpc("register_want_click", { p_item_id: item.id });

  // Vendido, oculto o retirado: vuelve al artículo, que muestra "Ya tiene dueño".
  if (typeof whatsapp !== "string") return NextResponse.redirect(new URL(itemPage, request.url));

  const text = wantMessage(item.title, item.price_uyu, `${SITE_URL}${itemPage}`);
  return NextResponse.redirect(whatsappLink(whatsapp, text), { status: 303 });
}
