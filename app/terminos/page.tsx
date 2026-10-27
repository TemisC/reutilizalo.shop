import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_LIMITS, PRO_PRICE_UYU } from "@/lib/catalog";
import { formatUYU } from "@/lib/format";
import { LEGAL_PLACEHOLDERS, LegalPage, LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Las reglas para usar Reutilizalo: qué es la plataforma, qué se puede publicar y cómo cuidamos la comunidad.",
  alternates: { canonical: "/terminos" },
};

// Texto base para revisar con alguien con conocimiento legal antes del lanzamiento.
export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      intro={
        <p>
          Reutilizalo es una plataforma que conecta personas que quieren vender las cosas que ya no usan con quienes
          las están buscando. Al crear una tienda o usar el sitio aceptas estas reglas.
        </p>
      }
    >
      <aside className="rounded-3xl bg-highlight/40 p-5 text-ink ring-2 ring-highlight">
        <p className="font-bold">
          El equipo de reutilizalo.shop solo ofrece un espacio para que las personas puedan vender sus pertenencias
          de segunda mano. No nos hacemos responsables de las negociaciones ni de las transacciones que se realicen
          entre las partes.
        </p>
      </aside>

      <LegalSection title="1. Qué es Reutilizalo">
        <p>
          Reutilizalo te da una tiendita con un link propio (reutilizalo.shop/tunombre) para mostrar tus artículos
          usados. Cuando alguien toca “Lo quiero”, se abre WhatsApp para que hable directamente contigo.
        </p>
        <ul>
          <li>No somos parte de la compraventa: el acuerdo es entre quien vende y quien compra.</li>
          <li>
            <strong>No procesamos pagos.</strong> El precio, la forma de pago y la entrega se coordinan entre las
            partes. Reutilizalo no cobra comisiones sobre las ventas.
          </li>
          <li>No garantizamos que un artículo se venda, ni la calidad, el estado o la entrega de lo que se publica.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Tu cuenta">
        <ul>
          <li>Para crear una tienda tienes que ser mayor de 18 años o contar con la autorización de un adulto responsable.</li>
          <li>Los datos que ingresas (email, WhatsApp, nombre de la tienda) tienen que ser reales y estar al día.</li>
          <li>Cuidas tu contraseña y eres responsable de lo que se haga desde tu cuenta.</li>
          <li>
            El link de tu tienda es personal. Podemos recuperar nombres que suplanten a otra persona o marca, o que
            sean ofensivos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Qué puedes publicar">
        <p>
          Cada vendedor es responsable de lo que publica y de la venta. Solo puedes publicar artículos propios, usados
          o nuevos, que tengas en tu poder y que puedas vender legalmente en Uruguay.
        </p>
        <p>Está prohibido publicar:</p>
        <ul>
          <li>Armas, municiones, explosivos y sus partes.</li>
          <li>Medicamentos, drogas, sustancias controladas y productos de tabaco o vapeo.</li>
          <li>Animales vivos.</li>
          <li>Alimentos y bebidas.</li>
          <li>Productos falsificados, réplicas o que infrinjan marcas o derechos de autor.</li>
          <li>Artículos robados o de origen dudoso.</li>
          <li>Contenido para adultos o que promueva la violencia o la discriminación.</li>
          <li>Documentos personales, datos de terceros o servicios en lugar de artículos.</li>
          <li>Productos retirados del mercado o que no cumplan normas de seguridad (por ejemplo, sillas de auto vencidas).</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Reglas de la comunidad">
        <p>Queremos una comunidad de economía circular sana, donde todos quedemos contentos. Por eso:</p>
        <ul>
          <li>
            <strong>Fotos reales:</strong> sube fotos tuyas del artículo que vendes, nunca imágenes de internet.
          </li>
          <li>
            <strong>Descripciones honestas:</strong> muestra y cuenta los detalles, manchas o roturas tal como están.
          </li>
          <li>
            <strong>Precios claros:</strong> el precio publicado es el que pides.
          </li>
          <li>
            <strong>Trato respetuoso:</strong> responde con amabilidad y cumple lo que acuerdas.
          </li>
          <li>
            <strong>Mantén tu tienda al día:</strong> marca como vendido lo que ya no está disponible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Calificaciones y reputación">
        <ul>
          <li>
            Después de una venta, quien compra puede calificarte con un link único. La reputación se muestra cuando
            tienes al menos 3 calificaciones.
          </li>
          <li>Las calificaciones tienen que basarse en compras reales. No se permite calificarse a uno mismo ni manipularlas.</li>
          <li>Puedes responder a los comentarios. Podemos ocultar comentarios ofensivos o que no cumplan estas reglas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Reportes y moderación">
        <p>
          Cualquier persona puede reportar un artículo. Podemos revisar, ocultar o retirar publicaciones, y suspender
          o cerrar cuentas que no cumplan estos términos, con o sin aviso previo según la gravedad.
        </p>
      </LegalSection>

      <LegalSection title="7. Planes">
        <ul>
          <li>
            El plan Gratis permite tener hasta {PLAN_LIMITS.free} artículos activos, sin costo y sin vencimiento.
          </li>
          <li>
            El Plan Pro permite hasta {PLAN_LIMITS.pro} artículos activos y suma beneficios como aparecer en Explorar,
            elegir el color de la tienda y ver estadísticas. Cuesta {formatUYU(PRO_PRICE_UYU)} por mes.
          </li>
          <li>
            Si un Plan Pro vence, la tienda vuelve al plan Gratis. Ningún artículo se borra y los que ya estaban
            publicados siguen visibles, pero no podrás publicar nuevos ni volver a mostrar ocultos hasta tener menos
            de {PLAN_LIMITS.free} activos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Responsabilidad">
        <p>
          Reutilizalo se ofrece tal como está. Hacemos lo posible para que funcione bien y sea seguro, pero no
          respondemos por los acuerdos entre usuarios, los artículos publicados, los pagos ni las entregas. Te
          recomendamos encontrarte en lugares públicos y revisar el artículo antes de pagar.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios y contacto">
        <p>
          Podemos actualizar estos términos. Si el cambio es importante, te avisaremos por email o en tu panel.
          Estos términos se rigen por las leyes de la República Oriental del Uruguay.
        </p>
        <p>
          Responsable: {LEGAL_PLACEHOLDERS.owner}. Para consultas escribe a {LEGAL_PLACEHOLDERS.email}. También
          puedes leer nuestra <Link href="/privacidad">Política de privacidad</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
