"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, LoaderCircle, MailCheck } from "lucide-react";
import {
  checkNickAvailability,
  createStore,
  type CreateStoreField,
  type CreateStoreState,
  type NickStatus,
} from "@/lib/actions/auth";
import { NICK_PROBLEM_MESSAGES, normalizeNick } from "@/lib/nick";
import { DEFAULT_COUNTRY_CODE } from "@/lib/format";
import { initialOf } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  PasswordInput,
  inputClasses,
} from "@/components/ui/field";
import { AuthColumns } from "../auth-columns";
import { StorePreview } from "../store-preview";

const BENEFITS = [
  "Hasta 5 artículos gratis, para siempre",
  "Te escriben directo a tu WhatsApp",
  "Sin tarjeta ni comisiones",
];

type LiveStatus = "idle" | "checking" | NickStatus;

/** `intro` es el título de la página: va en la columna izquierda, junto al formulario. */
export function CreateStoreForm({ intro }: { intro: ReactNode }) {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<
    CreateStoreState,
    FormData
  >(createStore, {});

  const [nick, setNick] = useState(() =>
    normalizeNick(searchParams.get("nick") ?? ""),
  );
  const [nickStatus, setNickStatus] = useState<LiveStatus>("idle");
  const [storeName, setStoreName] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const latestCheck = useRef(0);

  // Verificación en vivo con debounce.
  useEffect(() => {
    if (!nick) return;
    const checkId = ++latestCheck.current;
    const timer = setTimeout(async () => {
      setNickStatus("checking");
      const result = await checkNickAvailability(nick);
      if (checkId === latestCheck.current) setNickStatus(result.status);
    }, 400);
    return () => clearTimeout(timer);
  }, [nick]);

  if (state.confirmEmailSentTo) {
    return (
      <div className="flex flex-col gap-6 lg:max-w-[480px]">
        <ConfirmEmailNotice email={state.confirmEmailSentTo} />
      </div>
    );
  }

  const errors = state.errors ?? {};
  const nickBlocked =
    nickStatus === "taken" ||
    nickStatus === "reserved" ||
    nickStatus === "invalid" ||
    nickStatus === "too_short";
  const initial = initialOf(storeName.trim() || nick);
  const displayNick = nick || "tunombre";

  const describedBy = (field: CreateStoreField) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <AuthColumns
      aside={
        <StorePreview
          title="Así se verá tu tienda"
          nick={displayNick}
          storeName={storeName.trim() || "Tu tienda"}
        />
      }
    >
      {intro}
      <form
        action={formAction}
        className="flex flex-1 flex-col gap-7"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="nick" className="font-bold text-ink">
            Tu link
          </label>
          <div
            className={`flex min-h-14 items-center rounded-2xl border-2 bg-surface px-4 text-lg transition-colors focus-within:border-accent ${
              nickStatus === "available"
                ? "border-accent"
                : nickBlocked || errors.nick
                  ? "border-red-700"
                  : "border-line"
            }`}
          >
            <span className="shrink-0 text-ink-muted">reutilizalo.shop/</span>
            <input
              id="nick"
              name="nick"
              value={nick}
              onChange={(e) => {
                const next = normalizeNick(e.target.value);
                setNick(next);
                if (!next) setNickStatus("idle");
              }}
              placeholder="tunombre"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              required
              aria-invalid={nickBlocked || Boolean(errors.nick)}
              aria-describedby="nick-status"
              className="min-w-0 flex-1 bg-transparent font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink-muted/60"
            />
          </div>
          <NickStatusLine
            id="nick-status"
            status={nickStatus}
            serverError={errors.nick}
            hasNick={nick.length > 0}
          />
        </div>

        <div className="flex items-center gap-4 rounded-3xl bg-ink p-5 text-white">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xl font-extrabold"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">
              Tu link para la bio
            </p>
            <p className="truncate font-display text-lg font-bold">
              reutilizalo.shop/{displayNick}
            </p>
          </div>
        </div>

        <Field
          label="Nombre de tu tienda"
          htmlFor="storeName"
          error={errors.storeName}
        >
          <input
            id="storeName"
            name="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Ej.: La tiendita de Paola"
            maxLength={60}
            required
            aria-invalid={Boolean(errors.storeName)}
            aria-describedby={describedBy("storeName")}
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
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                inputMode="tel"
                maxLength={5}
                aria-invalid={Boolean(errors.countryCode)}
                className={`${inputClasses} text-center`}
              />
            </div>
            <input
              id="whatsapp"
              name="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="9X XXX XXX"
              inputMode="tel"
              autoComplete="tel-national"
              required
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={describedBy("whatsapp")}
              className={inputClasses}
            />
          </div>
          {(errors.whatsapp || errors.countryCode) && (
            <FieldError id="whatsapp-error">
              {errors.whatsapp ?? errors.countryCode}
            </FieldError>
          )}
        </div>

        <Field label="Tu email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            autoCapitalize="none"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className={inputClasses}
          />
        </Field>

        <Field
          label="Crea una contraseña"
          htmlFor="password"
          error={errors.password}
          hint={
            <p className="text-sm text-ink-muted">Al menos 8 caracteres.</p>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password")}
          />
        </Field>

        <ul className="flex flex-col gap-4">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 text-lg text-ink-soft"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-highlight text-ink">
                <Check className="size-5" aria-hidden />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-5 pt-4">
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                aria-invalid={Boolean(errors.acceptTerms)}
                aria-describedby={describedBy("acceptTerms")}
                className="mt-0.5 size-6 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-ink-soft">
                Acepto los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="font-bold text-accent underline underline-offset-2"
                >
                  Términos de uso
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-bold text-accent underline underline-offset-2"
                >
                  Política de privacidad
                </Link>
                . Entiendo que Reutilizalo solo ofrece el espacio para vender y
                no participa en las negociaciones ni en las transacciones entre
                las partes.
              </span>
            </label>
            {errors.acceptTerms && (
              <FieldError id="acceptTerms-error">
                {errors.acceptTerms}
              </FieldError>
            )}
          </div>

          {state.message && <FieldError>{state.message}</FieldError>}
          <Button
            type="submit"
            size="lg"
            loading={pending}
            disabled={nickBlocked}
          >
            Crear mi tienda
          </Button>
          <p className="text-center text-ink-muted">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-bold text-accent underline underline-offset-2"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthColumns>
  );
}

function NickStatusLine({
  id,
  status,
  serverError,
  hasNick,
}: {
  id: string;
  status: LiveStatus;
  serverError?: string;
  hasNick: boolean;
}) {
  if (!hasNick) {
    return (
      <p id={id} className="text-sm text-ink-muted">
        Minúsculas, números y guiones. De 3 a 20 caracteres.
      </p>
    );
  }
  if (status === "checking" || status === "idle") {
    return (
      <p
        id={id}
        className="flex items-center gap-1.5 text-sm text-ink-muted"
        aria-live="polite"
      >
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Verificando…
      </p>
    );
  }
  if (status === "available") {
    return (
      <p
        id={id}
        className="flex items-center gap-1.5 text-accent"
        aria-live="polite"
      >
        <Check className="size-5" aria-hidden />
        ¡Disponible! Así quedará tu link
      </p>
    );
  }
  if (status === "unavailable_service") {
    return (
      <p id={id} className="text-sm text-ink-muted" aria-live="polite">
        No pudimos verificarlo ahora; lo revisamos al crear tu tienda.
      </p>
    );
  }
  return (
    <FieldError id={id}>
      {serverError ?? NICK_PROBLEM_MESSAGES[status]}
    </FieldError>
  );
}

function ConfirmEmailNotice({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl bg-surface p-6">
      <span className="flex size-12 items-center justify-center rounded-full bg-highlight text-ink">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <h2 className="text-2xl">Revisa tu correo</h2>
      <p className="text-ink-soft">
        Te mandamos un link a <strong className="text-ink">{email}</strong>.
        Tócalo para activar tu tienda y entrar a tu panel.
      </p>
      <p className="text-sm text-ink-muted">
        Si no lo ves, fíjate en la carpeta de spam.
      </p>
    </div>
  );
}
