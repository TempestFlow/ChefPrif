// REQ-5 (Data): Alergijų ir dietų konstantos.
// Reikšmės naudojamos UI checkbox'uose, API validacijoje ir OpenAI prompt'e.

export const ALLERGIES = [
  "Pienas",
  "Kiaušiniai",
  "Riešutai",
  "Glitimas",
  "Žuvis",
  "Soja",
] as const;

export const DIETS = [
  "Veganiška",
  "Vegetariška",
  "Be glitimo",
  "Be laktozės",
] as const;

export type Allergy = (typeof ALLERGIES)[number];
export type Diet = (typeof DIETS)[number];

export function isValidAllergy(value: string): value is Allergy {
  return (ALLERGIES as readonly string[]).includes(value);
}

export function isValidDiet(value: string): value is Diet {
  return (DIETS as readonly string[]).includes(value);
}
