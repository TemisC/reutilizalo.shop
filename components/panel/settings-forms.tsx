"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import {
  changePassword,
  updateStoreSettings,
  type PasswordState,
  type StoreSettingsState,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, FieldError, PasswordInput, inputClasses } from "@/components/ui/field";

export function StoreSettingsForm({
  storeName,
  countryCode,
  localNumber,
}: {
  storeName: string;
  countryCode: string;
  localNumber: string;
}) {
  const [state, formAction, pending] = useActionState<StoreSettingsState, FormData>(updateStoreSettings, {});
  const errors = state.errors ?? {};
  // Campos controlados: React vacía los no controlados al enviar, y si hay un error se perdería lo escrito.
  const [name, setName] = useState(storeName);
  const [code, setCode] = useState(countryCode);
  const [number, setNumber] = useState(localNumber);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Nombre de tu tienda" htmlFor="storeName" error={errors.storeName}>
        <input
          id="storeName"
          name="storeName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          aria-invalid={Boolean(errors.storeName)}
          className={inputClasses}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <label htmlFor="whatsapp" className="font-bold text-ink">
          Tu WhatsApp para recibir consultas
        </label>
        <div className="flex gap-2">
          <div className="w-20 shrink-0">
            <input
              name="countryCode"
              aria-label="Prefijo del país"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="tel"
              maxLength={5}
              aria-invalid={Boolean(errors.countryCode)}
              className={`${inputClasses} text-center`}
            />
          </div>
          <input
            id="whatsapp"
            name="whatsapp"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="9X XXX XXX"
            inputMode="tel"
            autoComplete="tel-national"
            required
            aria-invalid={Boolean(errors.whatsapp)}
            className={inputClasses}
          />
        </div>
        {(errors.whatsapp || errors.countryCode) && (
          <FieldError id="whatsapp-error">{errors.whatsapp ?? errors.countryCode}</FieldError>
        )}
      </div>

      <FormFooter pending={pending} message={state.message} savedAt={state.savedAt} savedText="Guardamos los cambios.">
        Guardar cambios
      </FormFooter>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  const errors = state.errors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Después de cambiarla, se vacían los campos para no dejar contraseñas a la vista.
  useEffect(() => {
    if (state.savedAt) formRef.current?.reset();
  }, [state.savedAt]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <Field label="Contraseña actual" htmlFor="currentPassword" error={errors.currentPassword}>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.currentPassword)}
        />
      </Field>
      <Field
        label="Nueva contraseña"
        htmlFor="newPassword"
        error={errors.newPassword}
        hint={<p className="text-sm text-ink-muted">Al menos 8 caracteres.</p>}
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.newPassword)}
        />
      </Field>
      <Field label="Repite la nueva contraseña" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.confirmPassword)}
        />
      </Field>

      <FormFooter
        pending={pending}
        message={state.message}
        savedAt={state.savedAt}
        savedText="Listo, ya puedes entrar con tu nueva contraseña."
      >
        Cambiar contraseña
      </FormFooter>
    </form>
  );
}

function FormFooter({
  pending,
  message,
  savedAt,
  savedText,
  children,
}: {
  pending: boolean;
  message?: string;
  savedAt?: number;
  savedText: string;
  children: ReactNode;
}) {
  // El aviso de "guardado" se va solo a los pocos segundos.
  const [dismissedAt, setDismissedAt] = useState<number | undefined>();
  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setDismissedAt(savedAt), 4000);
    return () => clearTimeout(timer);
  }, [savedAt]);
  const showSaved = Boolean(savedAt) && savedAt !== dismissedAt && !pending && !message;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <Button type="submit" size="lg" loading={pending}>
        {children}
      </Button>
      <div aria-live="polite">
        {message && <FieldError>{message}</FieldError>}
        {showSaved && (
          <p className="flex items-center gap-1.5 text-sm font-bold text-accent">
            <CircleCheck className="size-4 shrink-0" aria-hidden /> {savedText}
          </p>
        )}
      </div>
    </div>
  );
}
