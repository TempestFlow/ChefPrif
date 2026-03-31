// Mock ingredientų duomenys (vietoj tikros DB)
// Ateityje bus pakeista į Supabase PostgreSQL užklausą

export const INGREDIENTS: string[] = [
  // Daržovės
  "Pomidoras",
  "Agurkas",
  "Svogūnas",
  "Česnakas",
  "Bulvė",
  "Morka",
  "Paprika",
  "Brokoliai",
  "Žiediniai kopūstai",
  "Špinatai",
  "Salotos",
  "Cukinija",
  "Baklažanas",
  "Ridikėlis",
  "Burokėlis",
  "Porų laiškai",
  "Petražolės",
  "Krapai",
  "Bazilikas",
  "Rukola",

  // Vaisiai
  "Obuolys",
  "Bananas",
  "Citrina",
  "Apelsinas",
  "Avokadas",
  "Braškės",
  "Mėlynės",

  // Mėsa ir žuvis
  "Vištienos krūtinėlė",
  "Vištienos šlaunelės",
  "Kiaulienos nugarinė",
  "Jautienos faršas",
  "Lašiša",
  "Krevetės",
  "Tuno konservai",
  "Dešrelės",
  "Šoninė",

  // Pieno produktai
  "Pienas",
  "Grietinėlė",
  "Grietinė",
  "Sviestas",
  "Kiaušiniai",
  "Sūris",
  "Mocarela",
  "Parmezanas",
  "Varškė",
  "Jogurtas",
  "Kefyras",

  // Grūdai ir makaronai
  "Ryžiai",
  "Makaronai",
  "Spagečiai",
  "Miltai",
  "Duona",
  "Tortilija",
  "Kuskusas",
  "Avižiniai dribsniai",

  // Konservai ir padažai
  "Pomidorų padažas",
  "Sojų padažas",
  "Alyvuogių aliejus",
  "Actas",
  "Medus",
  "Garstyčios",
  "Kečupas",
  "Majonezas",
  "Pomidorų pasta",
  "Kokosų pienas",

  // Prieskoniai
  "Druska",
  "Pipirai",
  "Kmynai",
  "Raudonėlis",
  "Cinamonas",
  "Imbierai",
  "Čili dribsniai",
  "Rozmarinas",

  // Kita
  "Avinžirniai",
  "Lęšiai",
  "Pupelės",
  "Riešutai",
  "Migdolai",
  "Sezamo sėklos",
  "Tofu",
];

/**
 * Filtruoja ingredientus pagal paieškos tekstą.
 * Grąžina tik tuos ingredientus, kurie prasideda arba turi atitinkamą substringą.
 * @param query - paieškos tekstas (min 2 simboliai)
 * @returns filtruoti ingredientai
 */
export function filterIngredients(query: string): string[] {
  if (query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return INGREDIENTS.filter((ingredient) =>
    ingredient.toLowerCase().includes(normalizedQuery)
  );
}
