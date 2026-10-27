import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;

// Registra una visita a un artículo. La llama ViewTracker desde el navegador (una vez por día y
// por navegador), así los robots que no ejecutan JavaScript no suman. No guarda quién visita.
export async function POST(request: Request, { params }: RouteContext<"/api/visto/[itemId]">) {
  const { itemId } = await params;
  const userAgent = request.headers.get("user-agent") ?? "";

  if (UUID.test(itemId) && userAgent && !BOT.test(userAgent)) {
    try {
      await createPublicClient().rpc("register_item_view", { p_item_id: itemId });
    } catch {
      // Una visita que no se pudo contar no debe romper nada.
    }
  }
  return new Response(null, { status: 204 });
}
