import { describe, expect, it } from "vitest";
import { formatScore, formatUYU, toE164 } from "./format";

describe("formatUYU", () => {
  it("agrupa miles con punto", () => {
    expect(formatUYU(0)).toBe("$U 0");
    expect(formatUYU(900)).toBe("$U 900");
    expect(formatUYU(1200)).toBe("$U 1.200");
    expect(formatUYU(1234567)).toBe("$U 1.234.567");
  });
});

describe("formatScore", () => {
  it("usa coma decimal con un decimal", () => {
    expect(formatScore(8.7)).toBe("8,7");
    expect(formatScore(9)).toBe("9,0");
  });
});

describe("toE164", () => {
  it("arma el número uruguayo sin el 0 inicial", () => {
    expect(toE164("+598", "099 123 456")).toBe("+59899123456");
    expect(toE164("+598", "99123456")).toBe("+59899123456");
  });
  it("rechaza números inválidos", () => {
    expect(toE164("+598", "12")).toBeNull();
  });
});
