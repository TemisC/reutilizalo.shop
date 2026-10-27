import { describe, expect, it } from "vitest";
import { greetingName, initialOf } from "./site";

describe("greetingName", () => {
  it("saca el nombre de 'La tiendita de …'", () => {
    expect(greetingName("La tiendita de Paola")).toBe("Paola");
    expect(greetingName("Las cosas de María José")).toBe("María José");
  });
  it("si no hay patrón usa el nombre completo", () => {
    expect(greetingName("Vintage Pocitos")).toBe("Vintage Pocitos");
  });
});

describe("initialOf", () => {
  it("devuelve la inicial en mayúscula", () => {
    expect(initialOf("paola")).toBe("P");
    expect(initialOf("La tiendita de Paola")).toBe("P");
    expect(initialOf("  ")).toBe("R");
  });
});
