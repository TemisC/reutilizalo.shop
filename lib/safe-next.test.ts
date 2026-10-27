import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/panel/publicar")).toBe("/panel/publicar");
  });
  it("rechaza destinos externos", () => {
    expect(safeNextPath("https://evil.com")).toBe("/panel");
    expect(safeNextPath("//evil.com")).toBe("/panel");
    expect(safeNextPath("/\\evil.com")).toBe("/panel");
    expect(safeNextPath(null)).toBe("/panel");
  });
});
