import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeader } from "../auth-header";
import { LoginForm } from "./login-form";
import { AuthColumns } from "../auth-columns";
import { StorePreview } from "../store-preview";

export const metadata: Metadata = {
  title: "Inicia sesión",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-10 pt-4 md:max-w-[480px] md:pt-10 lg:max-w-6xl lg:gap-10 lg:px-10">
      <AuthHeader />
      <AuthColumns
        aside={<StorePreview title="Tus cosas, a un link de distancia" nick="paola" storeName="La tiendita de Paola" />}
      >
        <div className="flex flex-col gap-3">
          <h1 className="text-[2.6rem] leading-[1.05]">Hola de nuevo</h1>
          <p className="text-lg text-ink-muted">Entra para ver tu tienda y publicar tus cosas.</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthColumns>
    </main>
  );
}
