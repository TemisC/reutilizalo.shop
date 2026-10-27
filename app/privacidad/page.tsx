import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_PLACEHOLDERS, LegalPage, LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos guarda Reutilizalo, para qué los usa y cómo puedes pedir que los borremos.",
  alternates: { canonical: "/privacidad" },
};

// Texto base para revisar con alguien con conocimiento legal antes del lanzamiento (Ley 18.331).
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro={
        <p>
          Guardamos solo los datos necesarios para que tu tienda funcione y para que la gente pueda contactarte. No
          vendemos tus datos ni mostramos publicidad.
        </p>
      }
    >
      <LegalSection title="1. Quién es responsable">
        <p>
          El responsable de la base de datos es {LEGAL_PLACEHOLDERS.owner}, con domicilio en Uruguay. Puedes
          escribirnos a {LEGAL_PLACEHOLDERS.email}. Tratamos tus datos de acuerdo con la Ley N.º 18.331 de
          Protección de Datos Personales.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos guardamos y para qué">
        <p>
          <strong>Si tienes una tienda:</strong>
        </p>
        <ul>
          <li>
            <strong>Email y contraseña:</strong> para que puedas entrar a tu cuenta y para avisarte cosas importantes.
            La contraseña se guarda cifrada; nadie puede verla.
          </li>
          <li>
            <strong>Número de WhatsApp:</strong> para que quien toca “Lo quiero” pueda escribirte. No aparece
            escrito en tu tienda, pero quien te escribe lo ve en WhatsApp, como en cualquier chat.
          </li>
          <li>
            <strong>Datos de tu tienda:</strong> nombre, link, descripción, foto, ciudad y barrio. Son públicos
            porque forman parte de tu tienda.
          </li>
          <li>
            <strong>Tus artículos:</strong> fotos, título, precio, estado y detalles. Son públicos mientras estén
            publicados.
          </li>
        </ul>
        <p>
          <strong>Si compras:</strong>
        </p>
        <ul>
          <li>
            No necesitas cuenta. Si la persona que te vendió registra la venta, puede anotar tu nombre y un contacto
            (opcional) solo para enviarte el link para calificar la compra.
          </li>
          <li>
            Tu calificación y tu comentario se muestran en la tienda sin tu nombre ni tu contacto.
          </li>
        </ul>
        <p>
          <strong>De todos los visitantes:</strong> contamos las visitas a cada artículo y los toques en “Lo quiero”
          para mostrarle estadísticas al vendedor. Esos conteos no guardan quién eres.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies">
        <p>
          Usamos solo las cookies necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni de
          seguimiento de terceros.
        </p>
      </LegalSection>

      <LegalSection title="4. Con quién se comparten">
        <ul>
          <li>
            No vendemos ni cedemos tus datos.
          </li>
          <li>
            Usamos proveedores para que el sitio funcione: Supabase (base de datos, cuentas y fotos) y Vercel
            (alojamiento del sitio). Guardan los datos en servidores fuera de Uruguay, con medidas de seguridad
            adecuadas, y solo los usan para prestarnos el servicio.
          </li>
          <li>Cuando alguien toca “Lo quiero”, la conversación sigue en WhatsApp, que tiene su propia política de privacidad.</li>
          <li>Podemos compartir datos si una autoridad competente lo exige por ley.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cuánto tiempo los guardamos">
        <p>
          Guardamos tus datos mientras tengas tu cuenta. Si la cierras, borramos tu tienda, tus artículos y tus
          fotos. Podemos conservar por un tiempo limitado lo necesario para resolver reportes o cumplir obligaciones
          legales.
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>
          Puedes pedir acceso a tus datos, corregirlos, actualizarlos o eliminarlos en cualquier momento. Muchos los
          puedes cambiar tú desde tu panel; para el resto, o para cerrar tu cuenta, escríbenos a{" "}
          {LEGAL_PLACEHOLDERS.email}. Te respondemos dentro de los plazos que fija la Ley 18.331.
        </p>
        <p>
          Si crees que no atendimos bien tu pedido, puedes acudir a la Unidad Reguladora y de Control de Datos
          Personales (URCDP).
        </p>
      </LegalSection>

      <LegalSection title="7. Cambios">
        <p>
          Si cambiamos esta política de forma importante, te avisaremos por email o en tu panel. Lee también los{" "}
          <Link href="/terminos">Términos de uso</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
