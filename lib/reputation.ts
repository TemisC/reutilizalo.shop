// Reglas de reputación (spec §7.6). Sin dependencias de servidor: se usa también en el cliente.

/** La reputación se muestra en público a partir de 3 reseñas. */
export const MIN_REVIEWS_TO_SHOW = 3;

export const CRITERIA = {
  photos: "fotos reales",
  description: "descripción fiel",
  timing: "tiempos de entrega",
  communication: "trato y comunicación",
  overall: "conformidad general",
} as const;

export type Criterion = keyof typeof CRITERIA;

export type Reputation = {
  reviewCount: number;
  average: number | null;
  byCriterion: Record<Criterion, number | null>;
};

type ReputationRow = {
  review_count: number;
  avg_score: number | string | null;
  avg_photos: number | string | null;
  avg_description: number | string | null;
  avg_timing: number | string | null;
  avg_communication: number | string | null;
  avg_overall: number | string | null;
};

const toNumber = (value: number | string | null | undefined) =>
  value === null || value === undefined ? null : Number(value);

/** Convierte el resultado de la función seller_reputation() de la base. */
export function toReputation(rpcData: unknown): Reputation {
  const row = (rpcData as ReputationRow[] | null)?.[0];
  return {
    reviewCount: row?.review_count ?? 0,
    average: toNumber(row?.avg_score),
    byCriterion: {
      photos: toNumber(row?.avg_photos),
      description: toNumber(row?.avg_description),
      timing: toNumber(row?.avg_timing),
      communication: toNumber(row?.avg_communication),
      overall: toNumber(row?.avg_overall),
    },
  };
}

export function isReputationVisible(reputation: Reputation) {
  return reputation.reviewCount >= MIN_REVIEWS_TO_SHOW && reputation.average !== null;
}

/** Mejor y peor criterio. Si todos empatan, no hay "a mejorar". */
export function bestAndWorst(reputation: Reputation) {
  const scored = (Object.entries(reputation.byCriterion) as [Criterion, number | null][])
    .filter((entry): entry is [Criterion, number] => entry[1] !== null)
    .sort((a, b) => b[1] - a[1]);
  if (scored.length === 0) return null;
  const best = scored[0];
  const worst = scored[scored.length - 1];
  return { best, worst: worst[1] < best[1] ? worst : null };
}

/** Etiquetas: ≥ 8,0 "Vendedor/a confiable"; 6,0 a 7,9 "Buena reputación"; < 6,0 solo el número. */
export function reputationLabel(average: number): string | null {
  if (average >= 8) return "Vendedor/a confiable";
  if (average >= 6) return "Buena reputación";
  return null;
}
