"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, PasswordInput, inputClasses } from "@/components/ui/field";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={searchParams.get("next") ?? "/panel"} />

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.email}
          placeholder="tu@email.com"
          autoComplete="email"
          autoCapitalize="none"
          required
          className={inputClasses}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>

      {state.message ? (
        <FieldError>{state.message}</FieldError>
      ) : (
        searchParams.get("error") === "link_invalido" && (
          <FieldError>El link venció o ya se usó. Inicia sesión con tu email y contraseña.</FieldError>
        )
      )}

      <Button type="submit" size="lg" loading={pending}>
        Entrar
      </Button>

      <p className="text-center text-ink-muted">
        ¿Todavía no tienes tienda?{" "}
        <Link href="/crear" className="font-bold text-accent underline underline-offset-2">
          Créala gratis
        </Link>
      </p>
    </form>
  );
}
