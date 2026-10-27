import { describe, expect, it } from "vitest";
import { nickProblem, normalizeNick } from "./nick";

describe("normalizeNick", () => {
  it("pasa a minúsculas, quita tildes y cambia espacios por guiones", () => {
    expect(normalizeNick("Paola Pérez")).toBe("paola-perez");
    expect(normalizeNick("  Ñandú__Shop!! ")).toBe("nandu-shop-");
  });
  it("corta en 20 caracteres", () => {
    expect(normalizeNick("a".repeat(30))).toHaveLength(20);
  });
});

describe("nickProblem", () => {
  it("acepta nicks válidos", () => {
    expect(nickProblem("paola")).toBeNull();
    expect(nickProblem("la-tienda-2")).toBeNull();
  });
  it("detecta problemas", () => {
    expect(nickProblem("ab")).toBe("too_short");
    expect(nickProblem("paola-")).toBe("invalid");
    expect(nickProblem("panel")).toBe("reserved");
  });
});
