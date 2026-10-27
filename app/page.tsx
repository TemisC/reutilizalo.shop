import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRO_PRICE_UYU } from "@/lib/catalog";
import { formatUYU } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";
import { ReserveLinkForm } from "@/components/landing/reserve-link-form";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { SITE_CONTAINER, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";

export const metadata: Metadata = {
  title: { absolute: "Reutilizalo — Tu tiendita de cosas usadas" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Lo que ya no usas, alguien lo está buscando.",
    description:
      "Arma una tiendita con tus cosas usadas, pon el link en tu bio de Instagram y véndeselas a tus conocidos.",
    url: "/",
    siteName: "Reutilizalo",
    locale: "es_UY",
  },
};

const STEPS = [
  {
    title: "Elige tu link",
    text: "reutilizalo.shop/tunombre queda para ti, fácil de recordar y de compartir.",
  },
  {
    title: "Sube tus cosas",
    text: "Una foto desde el celular, un precio y una línea de descripción. Nada más.",
  },
  {
    title: "Comparte y vende",
    text: "Pon el link en tu bio. Quien quiera algo toca “Lo quiero” y te escribe por WhatsApp.",
  },
];

const BENEFITS = [
  {
    title: "Todo en un solo lugar",
    text: "Tus amigos ven todo lo que vendes de una vez, con precio y estado, sin preguntar por privado.",
  },
  {
    title: "Se ve prolijo",
    text: "Una tienda ordenada da confianza y hace que tus cosas luzcan mejor.",
  },
  {
    title: "Sin intermediarios",
    text: "Hablas directo con quien compra y cobras como prefieras. No nos quedamos con nada de la venta.",
  },
  {
    title: "Marca lo vendido",
    text: "Un toque y aparece el cartel de vendido. Se acabaron los “¿todavía lo tienes?”.",
  },
];

const FREE_FEATURES = ["Hasta 5 artículos publicados", "Tu link reutilizalo.shop/tunombre", "Botón directo a tu WhatsApp"];

const PRO_FEATURES = [
  "Hasta 50 artículos",
  "Tus artículos aparecen en Explorar",
  "Elige el color de tu tienda",
  "Ve cuántas visitas recibe cada artículo",
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className={`${SITE_CONTAINER} grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-16 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:pb-20 lg:pt-10`}>
          <div className="flex flex-col gap-6">
            <span className="self-start rounded-full bg-highlight px-3 py-1 text-sm font-bold text-ink">
              Gratis hasta 5 artículos
            </span>
            <h1 className="text-[2.8rem] leading-[0.98] md:text-6xl lg:text-7xl">
              Lo que ya no usas, alguien lo está buscando.
            </h1>
            <p className="max-w-xl text-lg text-ink-soft">
              Arma una tiendita con tus cosas usadas, pon el link en tu bio de Instagram y véndeselas a tus
              conocidos. Sin comisiones y lista en 2 minutos.
            </p>
            <div className="max-w-xl">
              <ReserveLinkForm />
            </div>
          </div>
          <div className="px-6 lg:px-0">
            <PhoneMockup />
          </div>
        </section>

        {/* Tres pasos */}
        <section id="como-funciona" className="scroll-mt-4 bg-surface py-16 lg:py-20">
          <div className={`${SITE_CONTAINER} flex flex-col gap-8`}>
            <h2 className="text-[2.2rem] leading-[1.05] md:text-5xl">Tres pasos y listo</h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2 rounded-3xl bg-canvas p-6">
                  <span className="font-display text-4xl font-extrabold text-accent">{index + 1}</span>
                  <h3 className="mt-2 font-sans text-xl font-bold tracking-normal">{step.title}</h3>
                  <p className="text-ink-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-16 lg:py-20">
          <div className={`${SITE_CONTAINER} grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]`}>
            <h2 className="text-[2.2rem] leading-[1.05] md:text-5xl">Mejor que una historia que dura 24 horas</h2>
            <ul className="grid gap-8 md:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex flex-col gap-1">
                  <h3 className="font-sans text-lg font-bold tracking-normal">{benefit.title}</h3>
                  <p className="text-ink-muted">{benefit.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="scroll-mt-4 bg-ink py-16 text-white lg:py-20">
          <div className={`${SITE_CONTAINER} flex flex-col gap-8`}>
            <h2 className="text-[2.2rem] leading-[1.05] text-white md:text-5xl">Empieza gratis. Crece si quieres.</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <PlanCard
                tone="dark"
                name="Gratis"
                price="$U 0"
                features={FREE_FEATURES}
                cta={{ href: "/crear", label: "Crear mi tienda gratis" }}
              />
              <PlanCard
                tone="highlight"
                name="Plan Pro"
                price={formatUYU(PRO_PRICE_UYU)}
                per="/mes"
                features={PRO_FEATURES}
                cta={{ href: "/crear", label: "Empezar con Plan Pro" }}
              />
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className={`${SITE_CONTAINER} flex flex-col items-center gap-8 py-20 text-center lg:py-24`}>
          <h2 className="max-w-3xl text-[2.2rem] leading-[1.05] md:text-6xl">
            Ese placard lleno de cosas puede ser plata esta semana.
          </h2>
          <Link href="/crear" className={buttonClasses("primary", "lg")}>
            Crear mi tienda gratis <ArrowRight className="size-5" aria-hidden />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function PlanCard({
  tone,
  name,
  price,
  per,
  features,
  cta,
}: {
  tone: "dark" | "highlight";
  name: string;
  price: string;
  per?: string;
  features: string[];
  cta: { href: string; label: string };
}) {
  const dark = tone === "dark";
  return (
    <article
      className={`flex flex-col gap-5 rounded-3xl p-7 ${dark ? "bg-white/8 text-white" : "bg-highlight text-ink"}`}
    >
      <h3 className={`font-sans text-sm font-bold uppercase tracking-[0.12em] ${dark ? "text-white/80" : "text-ink"}`}>
        {name}
      </h3>
      <p className={`font-display text-5xl font-extrabold ${dark ? "text-white" : "text-ink"}`}>
        {price}
        {per && <span className="ml-1 font-sans text-lg font-normal">{per}</span>}
      </p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <Link href={cta.href} className={`${buttonClasses(dark ? "secondary" : "dark", "lg")} mt-auto ${dark ? "bg-white! hover:bg-chip-off!" : ""}`}>
        {cta.label}
      </Link>
    </article>
  );
}
