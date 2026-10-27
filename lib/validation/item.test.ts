import { describe, expect, it } from "vitest";
import { itemInputSchema } from "./item";

const uid = "11111111-1111-1111-1111-111111111111";
const valid = {
  title: "  Campera de jean talle M ",
  description: "",
  price: "1.200",
  category: "ropa",
  condition: "muy_buen_estado",
  defects: "",
  honestyConfirmed: true,
  photos: [{ kind: "main", path: `${uid}/abc-123.webp` }],
};

describe("itemInputSchema", () => {
  it("acepta un artículo válido y normaliza título y precio", () => {
    const parsed = itemInputSchema.parse(valid);
    expect(parsed.title).toBe("Campera de jean talle M");
    expect(parsed.price).toBe(1200);
  });

  it("exige la casilla de honestidad", () => {
    expect(itemInputSchema.safeParse({ ...valid, honestyConfirmed: false }).success).toBe(false);
  });

  it("exige la foto principal", () => {
    const result = itemInputSchema.safeParse({
      ...valid,
      photos: [{ kind: "angle", path: `${uid}/abc.webp` }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza más de 4 fotos, fotos repetidas y rutas raras", () => {
    const photo = (kind: string) => ({ kind, path: `${uid}/x.webp` });
    expect(
      itemInputSchema.safeParse({
        ...valid,
        photos: ["main", "angle", "label", "defect", "main"].map(photo),
      }).success,
    ).toBe(false);
    expect(itemInputSchema.safeParse({ ...valid, photos: [photo("main"), photo("main")] }).success).toBe(false);
    expect(
      itemInputSchema.safeParse({ ...valid, photos: [{ kind: "main", path: "../otro/x.webp" }] }).success,
    ).toBe(false);
  });

  it("rechaza precio vacío y categorías desconocidas", () => {
    expect(itemInputSchema.safeParse({ ...valid, price: "" }).success).toBe(false);
    expect(itemInputSchema.safeParse({ ...valid, category: "autos" }).success).toBe(false);
  });
});
