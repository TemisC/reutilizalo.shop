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
