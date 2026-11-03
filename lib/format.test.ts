import { describe, expect, it } from "vitest";
import { formatScore, formatUYU, splitE164, toE164 } from "./format";

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

describe("splitE164", () => {
  it("separa el prefijo uruguayo y vuelve a poner el 0", () => {
    expect(splitE164("+59899123456")).toEqual({ countryCode: "+598", localNumber: "099 123 456" });
  });
  it("es reversible con toE164", () => {
    const { countryCode, localNumber } = splitE164("+59899123456");
    expect(toE164(countryCode, localNumber)).toBe("+59899123456");
    const other = splitE164("+5491112345678");
    expect(toE164(other.countryCode, other.localNumber)).toBe("+5491112345678");
  });
});
