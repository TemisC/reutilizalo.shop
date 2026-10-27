import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
      <Logo />
      <h1 className="text-[2.4rem] leading-[1.05]">Esta tienda no existe (todavía)</h1>
      <p className="text-lg text-ink-muted">
        Revisa que el link esté bien escrito. Y si ese nombre está libre… ¡puede ser tuyo!
      </p>
      <Link href="/crear" className={buttonClasses("primary", "lg")}>
        Crear mi tienda gratis
      </Link>
    </main>
  );
}
