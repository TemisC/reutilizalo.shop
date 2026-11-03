/** 1200 → "$U 1.200". Se arma a mano porque Intl en español no agrupa números de 4 cifras. */
export function formatUYU(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const grouped = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}$U ${grouped}`;
}

/** 8.66 → "8,7" */
export function formatScore(score: number): string {
  return score.toFixed(1).replace(".", ",");
}

export const DEFAULT_COUNTRY_CODE = "+598";

/**
 * Pasa el número local a E.164. Para Uruguay quita el 0 inicial:
 * ("+598", "099 123 456") → "+59899123456".
 */
export function toE164(countryCode: string, localNumber: string): string | null {
  const cc = countryCode.replace(/\D/g, "");
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  const full = `+${cc}${digits}`;
  return /^\+[1-9][0-9]{7,14}$/.test(full) ? full : null;
}

/**
 * Lo inverso de toE164, para mostrar el número en un formulario:
 * "+59899123456" → { countryCode: "+598", localNumber: "099 123 456" }.
 * Fuera de Uruguay no sabemos dónde termina el prefijo: tomamos 2 dígitos, que es lo más común.
 * Igual es reversible, porque toE164 solo une prefijo y número.
 */
export function splitE164(e164: string): { countryCode: string; localNumber: string } {
  if (e164.startsWith(DEFAULT_COUNTRY_CODE)) {
    const digits = e164.slice(DEFAULT_COUNTRY_CODE.length);
    const local = `0${digits}`;
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      localNumber: local.length === 9 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : local,
    };
  }
  const digits = e164.replace(/^\+/, "");
  return { countryCode: `+${digits.slice(0, 2)}`, localNumber: digits.slice(2) };
}
