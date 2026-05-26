import { filterIngredients, INGREDIENTS } from "@/data/ingredients";

describe("filterIngredients", () => {
  it("grąžina tuščią masyvą, kai query trumpesnis nei 2 simboliai", () => {
    expect(filterIngredients("")).toEqual([]);
    expect(filterIngredients("P")).toEqual([]);
  });

  it("filtruoja ingredientus pagal 2+ simbolių query", () => {
    const results = filterIngredients("Po");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.toLowerCase()).toContain("po");
    });
  });

  it("grąžina 'Pomidoras' kai ieškoma 'pom'", () => {
    const results = filterIngredients("pom");
    expect(results).toContain("Pomidoras");
  });

  it("paieška yra case-insensitive", () => {
    const lower = filterIngredients("sviestas");
    const upper = filterIngredients("SVIESTAS");
    const mixed = filterIngredients("Sviestas");
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
    expect(lower).toContain("Sviestas");
  });

  it("grąžina tuščią masyvą kai ingredientas neegzistuoja", () => {
    const results = filterIngredients("xyzneegzistuoja");
    expect(results).toEqual([]);
  });

  it("randa ingredientus pagal substringą viduryje žodžio", () => {
    const results = filterIngredients("idoras");
    expect(results).toContain("Pomidoras");
  });

  it("INGREDIENTS masyvas turi elementų", () => {
    expect(INGREDIENTS.length).toBeGreaterThan(0);
  });

  it("trimina tarpus query pradžioje/pabaigoje", () => {
    const results = filterIngredients("  Pomid  ");
    expect(results).toContain("Pomidoras");
  });
});
