import { describe, expect, it } from "vitest";
import { bestAndWorst, isReputationVisible, reputationLabel, toReputation } from "./reputation";

const rpcRow = {
  review_count: 14,
  avg_score: "8.7",
  avg_photos: "9.0",
  avg_description: "8.8",
  avg_timing: "7.9",
  avg_communication: "8.9",
  avg_overall: "8.7",
};

describe("reputación", () => {
  it("convierte la fila de seller_reputation()", () => {
    const reputation = toReputation([rpcRow]);
    expect(reputation.average).toBe(8.7);
    expect(reputation.byCriterion.timing).toBe(7.9);
  });

  it("se muestra recién con 3 reseñas", () => {
    expect(isReputationVisible(toReputation([{ ...rpcRow, review_count: 2 }]))).toBe(false);
    expect(isReputationVisible(toReputation([rpcRow]))).toBe(true);
    expect(isReputationVisible(toReputation(null))).toBe(false);
  });

  it("encuentra el mejor y el peor criterio", () => {
    const extremes = bestAndWorst(toReputation([rpcRow]));
    expect(extremes?.best).toEqual(["photos", 9]);
    expect(extremes?.worst).toEqual(["timing", 7.9]);
  });

  it("aplica las etiquetas de la spec", () => {
    expect(reputationLabel(8)).toBe("Vendedor/a confiable");
    expect(reputationLabel(7.9)).toBe("Buena reputación");
    expect(reputationLabel(6)).toBe("Buena reputación");
    expect(reputationLabel(5.9)).toBeNull();
  });
});
