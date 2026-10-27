// Debe coincidir con public.reserved_nicks en supabase/migrations.
export const RESERVED_NICKS = new Set([
  "admin", "api", "app", "crear", "login", "logout", "registro", "panel", "explorar",
  "calificar", "ayuda", "soporte", "terminos", "privacidad", "planes", "pro", "blog",
  "tienda", "tiendas", "reutilizalo", "www", "static", "_next", "auth", "cuenta",
  "contacto", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export const NICK_MIN = 3;
export const NICK_MAX = 20;
const NICK_PATTERN = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;

/** Normaliza mientras el usuario escribe: "Paola Pérez" → "paola-perez". */
export function normalizeNick(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, NICK_MAX);
}

export type NickProblem = "too_short" | "invalid" | "reserved";

export function nickProblem(nick: string): NickProblem | null {
  if (nick.length < NICK_MIN) return "too_short";
  if (!NICK_PATTERN.test(nick)) return "invalid";
  if (RESERVED_NICKS.has(nick)) return "reserved";
  return null;
}

export const NICK_PROBLEM_MESSAGES: Record<NickProblem | "taken", string> = {
  too_short: `Usa al menos ${NICK_MIN} caracteres.`,
  invalid: "Solo letras minúsculas, números y guiones (sin guion al final).",
  reserved: "Ese nombre está reservado. Prueba con otro.",
  taken: "Ese link ya está en uso. Prueba con otro.",
};
