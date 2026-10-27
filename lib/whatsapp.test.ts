import { describe, expect, it } from "vitest";
import { wantMessage, whatsappLink } from "./whatsapp";

describe("wantMessage", () => {
  it("arma el mensaje de la spec", () => {
    expect(wantMessage("Campera de jean", 1200, "https://reutilizalo.shop/paola/abc")).toBe(
      'Hola! Vi en tu tienda de Reutilizalo "Campera de jean" a $U 1.200. ¿Sigue disponible? https://reutilizalo.shop/paola/abc',
    );
  });
});

describe("whatsappLink", () => {
  it("usa wa.me con el número sin + y el texto codificado", () => {
    expect(whatsappLink("+59899123456", "Hola! ¿Sigue?")).toBe(
      "https://wa.me/59899123456?text=Hola!%20%C2%BFSigue%3F",
    );
  });
});
