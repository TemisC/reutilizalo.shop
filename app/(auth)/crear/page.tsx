import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeader } from "../auth-header";
import { CreateStoreForm } from "./create-store-form";

export const metadata: Metadata = {
  title: "Crea tu tienda",
  description: "Elige tu link reutilizalo.shop/tunombre y empieza a publicar lo que ya no usas.",
};

const INTRO = (
  <div className="flex flex-col gap-3">
    <h1 className="text-[2.6rem] leading-[1.05]">Tu tiendita, lista en 2 minutos</h1>
    <p className="text-lg text-ink-muted">Elige tu nombre de tienda y empieza a publicar lo que ya no usas.</p>
  </div>
);

export default function CreateStorePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-10 pt-4 md:max-w-[480px] md:pt-10 lg:max-w-6xl lg:gap-10 lg:px-10">
      <AuthHeader />
      {/* useSearchParams (nick precargado desde la landing) necesita un límite de Suspense. */}
      <Suspense
        fallback={
          <div className="flex flex-col gap-6 lg:max-w-[480px]">
            {INTRO}
            <FormSkeleton />
          </div>
        }
      >
        <CreateStoreForm intro={INTRO} />
      </Suspense>
    </main>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-hidden>
      <div className="h-14 rounded-2xl bg-surface" />
      <div className="h-24 rounded-3xl bg-ink/90" />
      <div className="h-14 rounded-2xl bg-surface" />
      <div className="h-14 rounded-2xl bg-surface" />
    </div>
  );
}
