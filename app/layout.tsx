import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://reutilizalo.shop"),
  title: {
    default: "Reutilizalo — Tu tiendita de cosas usadas",
    template: "%s · Reutilizalo",
  },
  description:
    "Arma una tiendita con tus cosas usadas, pon el link en tu bio de Instagram y véndeselas a tus conocidos. Sin comisiones y lista en 2 minutos.",
};

export const viewport: Viewport = {
  themeColor: "#f3f5f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-UY" className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
