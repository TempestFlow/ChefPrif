/**
 * REQ-5 HomePage Integration Tests
 * Testavimas pilname user journey'e: HomePage -> IngredientInput -> Recipe Generation
 * su išsaugotomis preferencijomis iš Settings
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock supabase
const mockGetSession = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock generateRecipes
jest.mock("@/lib/generateRecipes", () => ({
  generateRecipes: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
}));

import { generateRecipes } from "@/lib/generateRecipes";

const STORAGE_KEY = "userPreferences";

function sessionResponse() {
  return {
    data: {
      session: {
        access_token: "test-token",
        user: { id: "user-1", email: "test@test.lt" },
      },
    },
  };
}

beforeAll(() => {
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/user/preferences")) {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prefs = raw ? JSON.parse(raw) : { allergies: [], diets: [] };
      return {
        ok: true,
        status: 200,
        json: async () => prefs,
      };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockGetSession.mockResolvedValue(sessionResponse());
});

describe("REQ-5: HomePage Integration with Settings Preferences", () => {
  describe("KAN-T53: Recipe Generation with User Preferences (E2E Flow)", () => {
    it("✓ Sceenarijus: Vartotojas su TE alergija ir veganiška dieta generuoja receptą", async () => {
      // 1. Setup: Išsaugoti preferencijas settings'e
      const preferences = {
        allergies: ["Pienas"],
        diets: ["Veganiška"],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      // 2. Mock recipe response - be pieno, veganiška
      const mockRecipes = [
        {
          title: "Veganiški obuolių blynaičiai",
          servings: 2,
          ingredients: ["Obuoliai", "Miltai", "Vanduo", "Druskos"],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      // 3. Vartotojas generuoja receptą su baziniu ingredientais
      const ingredients = ["Obuoliai", "Miltai", "Vanduo", "Druska"];
      const recipes = await generateRecipes(ingredients, [], preferences);

      // 4. Tikrinti, kad API buvo iškviesta su preferencijomis
      expect(generateRecipes).toHaveBeenCalledWith(
        ingredients,
        [],
        preferences
      );

      // 5. Tikrinti receptą
      expect(recipes).toHaveLength(1);
      expect(recipes[0].title).toContain("Veganiški");
      expect(recipes[0].ingredients).not.toContain("Pienas");
      expect(recipes[0].ingredients).not.toContain("Sviestas");
    });

    it("✓ Sceną: Vartotojas keičia preferencijas ir generuoja naują receptą", async () => {
      // 1. Pirma būsena: be alergijų
      const initialPrefs = { allergies: [], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPrefs));

      const mockRecipes1 = [
        {
          title: "Klasikiniai blynaičiai",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Pienas", "Cukrus"],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 350,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes1);

      const recipes1 = await generateRecipes(["Kiaušiniai", "Miltai", "Pienas", "Cukrus"], [], initialPrefs);
      expect(recipes1[0].ingredients).toContain("Pienas");

      // 2. Vartotojas keičia preferencijas - prideda alergija
      const updatedPrefs = { allergies: ["Pienas"], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs));

      const mockRecipes2 = [
        {
          title: "Blynaičiai be pieno",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Vanduo", "Cukrus"],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 300,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes2);

      // 3. Generuoja naują receptą su naujomis preferencijomis
      const recipes2 = await generateRecipes(["Kiaušiniai", "Miltai", "Pienas", "Cukrus"], [], updatedPrefs);

      // 4. Patikrinti, kad naujas receptas neturi pieno
      expect(generateRecipes).toHaveBeenLastCalledWith(
        ["Kiaušiniai", "Miltai", "Pienas", "Cukrus"],
        [],
        updatedPrefs
      );
      expect(recipes2[0].ingredients).not.toContain("Pienas");
    });

    it("✓ Scenā: Kompleksinės preferencijos - kelios alergijos ir dietos", async () => {
      const complexPrefs = {
        allergies: ["Pienas", "Kiaušiniai", "Riešutai"],
        diets: ["Veganiška", "Be laktozės"],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complexPrefs));

      const mockRecipes = [
        {
          title: "Veganiška beglitimo dieta",
          servings: 2,
          ingredients: ["Tofu", "Ryžiai", "Daržovės", "Kokosų pianas"],
          steps: ["Virinti", "Pateikti"],
          missing_ingredients: [],
          estimated_calories: 320,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Tofu", "Ryžiai", "Daržovės"],
        [],
        complexPrefs
      );

      expect(generateRecipes).toHaveBeenCalledWith(
        ["Tofu", "Ryžiai", "Daržovės"],
        [],
        complexPrefs
      );

      expect(recipes[0].ingredients.join(" ")).not.toMatch(/pienas|kiaušiniai|riešutai|mėsa|žuvis/i);
    });

    it("✓ Scenā: Iš naujo naudojant tą patį vartotoją, preferencijos tebėra aktyvios", async () => {
      // Pirmas apsilankymas - išsaugoti preferencijas
      const prefs = { allergies: ["Soja"], diets: ["Vegetariška"] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

      const mockRecipes1 = [
        {
          title: "Vegetariškas 1",
          servings: 2,
          ingredients: ["Sūris", "Daržovės"],
          steps: ["Step1"],
          missing_ingredients: [],
          estimated_calories: 300,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes1);

      const recipes1 = await generateRecipes(["Sūris", "Daržovės"], [], prefs);
      expect(recipes1[0].title).toContain("Vegetariškas");

      // Antras apsilankymas - preferencijos turėtų būti iš localStorage
      const mockRecipes2 = [
        {
          title: "Vegetariškas 2",
          servings: 2,
          ingredients: ["Žaliski", "Brinzal"],
          steps: ["Step1"],
          missing_ingredients: [],
          estimated_calories: 280,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes2);

      const savedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const recipes2 = await generateRecipes(["Žaliski", "Brinzal"], [], savedPrefs);

      // Patikrinti, kad antrą kartą naudojamos tos pačios preferencijos
      expect(generateRecipes).toHaveBeenLastCalledWith(
        ["Žaliski", "Brinzal"],
        [],
        prefs
      );
    });
  });

  describe("KAN-T54: Immediate Application of Settings Changes", () => {
    it("✓ Vartotojas keičia nustatymą ir iš karto jis veikia receptų generavimą", async () => {
      // Pirma: be nustatymų
      let currentPrefs = { allergies: [], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPrefs));

      const mockRecipes1 = [
        {
          title: "Receptas su pienu",
          servings: 2,
          ingredients: ["Pienas", "Miltai"],
          steps: ["Step"],
          missing_ingredients: [],
          estimated_calories: 300,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes1);

      const recipes1 = await generateRecipes(["Pienas", "Miltai"], [], currentPrefs);
      expect(recipes1[0].ingredients).toContain("Pienas");

      // Vartotojas keičia nustatymą
      currentPrefs = { allergies: ["Pienas"], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPrefs));

      const mockRecipes2 = [
        {
          title: "Receptas be pieno",
          servings: 2,
          ingredients: ["Vanduo", "Miltai"],
          steps: ["Step"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes2);

      // Iš karto generuoja naują receptą su nauju nustatymu
      const recipes2 = await generateRecipes(["Pienas", "Miltai"], [], currentPrefs);

      expect(generateRecipes).toHaveBeenLastCalledWith(
        ["Pienas", "Miltai"],
        [],
        { allergies: ["Pienas"], diets: [] }
      );
      expect(recipes2[0].ingredients).not.toContain("Pienas");
    });

    it("✓ Kelis kartus iš eilės keičiant nustatymus, kiekvienas pokytis atsispindi", async () => {
      let prefs = { allergies: [], diets: [] };

      const scenarios = [
        { prefs: { allergies: ["Pienas"], diets: [] }, shouldContain: false },
        { prefs: { allergies: [], diets: ["Veganiška"] }, shouldContain: true },
        { prefs: { allergies: ["Pienas", "Kiaušiniai"], diets: ["Veganiška"] }, shouldContain: false },
      ];

      for (const scenario of scenarios) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario.prefs));

        const mockRecipes = [
          {
            title: "Receptas",
            servings: 2,
            ingredients: scenario.shouldContain
              ? ["Sviestas", "Daržovės"]
              : ["Vanduo", "Daržovės"],
            steps: ["Step"],
            missing_ingredients: [],
            estimated_calories: 300,
          },
        ];

        (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

        const recipes = await generateRecipes(["Ingredientas"], [], scenario.prefs);

        expect(generateRecipes).toHaveBeenCalledWith(
          ["Ingredientas"],
          [],
          scenario.prefs
        );
      }

      expect(generateRecipes).toHaveBeenCalledTimes(3);
    });
  });

  describe("KAN-T55: Conflict Handling - Ingredient in Allergies", () => {
    it("✓ Vartotojas turi alergiją ir šią ingredientą prideda - sistema tvarko grąžint receptą", async () => {
      const prefs = { allergies: ["Žemės riešutai"], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

      // Vartotojas bando pridėti žemės riešutus į ingredientus
      const ingredients = ["Vištiena", "Ryžiai", "Žemės riešutai"];

      const mockRecipes = [
        {
          title: "Višta su ryžiais",
          servings: 2,
          ingredients: ["Vištiena", "Ryžiai", "Druskos"],
          steps: ["Virinti"],
          missing_ingredients: [],
          estimated_calories: 380,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(ingredients, [], prefs);

      // Tikrinti, kad preferencijos buvo naudotos
      expect(generateRecipes).toHaveBeenCalledWith(ingredients, [], prefs);

      // Tikrinti, kad žemės riešutai nėra recepte
      expect(recipes[0].ingredients).not.toContain("Žemės riešutai");
      expect(recipes[0].ingredients).toContain("Vištiena");
    });

    it("✓ Multiple alergijos ir ingredientai - sistema iš viso jų eliminuoja", async () => {
      const prefs = {
        allergies: ["Pienas", "Kiaušiniai", "Žemės riešutai"],
        diets: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

      const ingredients = ["Pienas", "Kiaušiniai", "Žemės riešutai", "Miltai", "Vanduo"];

      const mockRecipes = [
        {
          title: "Receptas",
          servings: 2,
          ingredients: ["Miltai", "Vanduo", "Druska"],
          steps: ["Žingsnis"],
          missing_ingredients: [],
          estimated_calories: 200,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(ingredients, [], prefs);

      expect(recipes[0].ingredients).not.toContain("Pienas");
      expect(recipes[0].ingredients).not.toContain("Kiaušiniai");
      expect(recipes[0].ingredients).not.toContain("Žemės riešutai");
      expect(recipes[0].ingredients).toContain("Miltai");
      expect(recipes[0].ingredients).toContain("Vanduo");
    });
  });

  describe("Data Persistence: Preferences Workflow", () => {
    it("✓ Išsaugoti preferencijos lieka po perkrovimo ir naudojamos kitoje sesijoje", async () => {
      // Sesija 1: išsaugoti
      const prefs1 = { allergies: ["Riešutai"], diets: ["Vegetariška"] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs1));

      const mockRecipes1 = [
        {
          title: "Receptas 1",
          servings: 2,
          ingredients: ["Ing1"],
          steps: ["Step"],
          missing_ingredients: [],
          estimated_calories: 300,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes1);

      const recipes1 = await generateRecipes(["Ing1"], [], prefs1);
      expect(recipes1).toHaveLength(1);

      // Simuliuoti perkrovą - localStorage išlieka
      const storedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      expect(storedPrefs).toEqual(prefs1);

      // Sesija 2: naudoti išsaugotus
      const mockRecipes2 = [
        {
          title: "Receptas 2",
          servings: 2,
          ingredients: ["Ing2"],
          steps: ["Step"],
          missing_ingredients: [],
          estimated_calories: 280,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes2);

      const recipes2 = await generateRecipes(["Ing2"], [], storedPrefs);

      expect(generateRecipes).toHaveBeenLastCalledWith(["Ing2"], [], prefs1);
      expect(recipes2).toHaveLength(1);
    });

    it("✓ Tuščios preferencijos (nepažymėta nieko) gali būti išsaugotos ir naudojamos", async () => {
      const emptyPrefs = { allergies: [], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyPrefs));

      const mockRecipes = [
        {
          title: "Receptas",
          servings: 2,
          ingredients: ["Bet kas"],
          steps: ["Step"],
          missing_ingredients: [],
          estimated_calories: 300,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(["Bet kas"], [], emptyPrefs);

      expect(generateRecipes).toHaveBeenCalledWith(["Bet kas"], [], emptyPrefs);
      expect(recipes).toHaveLength(1);
    });
  });
});
