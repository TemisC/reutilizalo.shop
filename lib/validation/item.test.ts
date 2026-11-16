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
  photos: ["a", "b", "c"].map((name) => ({ path: `${uid}/${name}-123.webp` })),
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

  it("exige entre 3 y 8 fotos", () => {
    const photos = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ path: `${uid}/foto-${i}.webp` }));
    expect(itemInputSchema.safeParse({ ...valid, photos: photos(2) }).success).toBe(false);
    expect(itemInputSchema.safeParse({ ...valid, photos: photos(8) }).success).toBe(true);
    expect(itemInputSchema.safeParse({ ...valid, photos: photos(9) }).success).toBe(false);
  });

  it("rechaza fotos repetidas y rutas raras", () => {
    const photo = { path: `${uid}/x.webp` };
    expect(itemInputSchema.safeParse({ ...valid, photos: [photo, photo, photo] }).success).toBe(false);
    expect(
      itemInputSchema.safeParse({ ...valid, photos: [...valid.photos.slice(1), { path: "../otro/x.webp" }] })
        .success,
    ).toBe(false);
  });

  it("rechaza precio vacío y categorías desconocidas", () => {
    expect(itemInputSchema.safeParse({ ...valid, price: "" }).success).toBe(false);
    expect(itemInputSchema.safeParse({ ...valid, category: "autos" }).success).toBe(false);
  });
});
