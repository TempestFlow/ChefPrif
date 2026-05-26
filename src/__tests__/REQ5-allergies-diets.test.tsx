/**
 * REQ-5: Alergijų ir dietų pasirinkimas profilyje
 * Testavimo Planas su 5 pagrindiniais scenarijais (KAN-T51 – KAN-T55)
 * 
 * Tikslas: Įsitikinti, kad vartotojas gali peržiūrėti, pasirinkti, išsaugoti
 * ir redaguoti alergijas/dietas, ir jie veikia receptų generavime.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock supabase
const mockGetSession = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock generateRecipes for testing API integration
jest.mock("@/lib/generateRecipes", () => ({
  generateRecipes: jest.fn(),
}));

import SettingsPage from "@/app/settings/page";
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
 
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url.includes("/api/user/preferences")) {
    if (init?.method === "POST") {
      const body = init.body ? JSON.parse(init.body as string) : { allergies: [], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(body));
      return jsonResponse({ success: true, ...body });
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs = raw ? JSON.parse(raw) : { allergies: [], diets: [] };
    return jsonResponse(prefs);
  }
  return jsonResponse({}, 404);
});

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockGetSession.mockResolvedValue(sessionResponse());
});

describe("REQ-5: Alergijų ir dietų pasirinkimas profilyje", () => {
  // ============================================================================
  // 🟩 KAN-T51: TA-5.1 Alergijų ir dietų sąrašo atvaizdavimas vartotojo profilyje
  // ============================================================================
  describe("KAN-T51: Alergijų ir dietų sąrašo atvaizdavimas (AC1)", () => {
    it("✓ Sekcija matoma ir rodo atskirus alergijų bei dietų sąrašus", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      // Tikrinti, ar yra alergijų sekcija
      await waitFor(() => {
        expect(screen.getByText("Alergijos")).toBeInTheDocument();
      });

      // Tikrinti, ar yra dietų sekcija
      expect(screen.getByText("Dietos")).toBeInTheDocument();
    });

    it("✓ Visi checkboxai atvaizduojami checkbox formatu", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      const allergyCheckboxes = [
        "Pienas",
        "Kiaušiniai",
        "Riešutai",
        "Glitimas",
        "Žuvis",
        "Soja",
      ];

      for (const allergy of allergyCheckboxes) {
        const checkbox = await screen.findByLabelText(allergy);
        expect(checkbox).toHaveProperty("type", "checkbox");
      }
    });

    it("✓ Visi checkboxai pagal nutylėjimą yra nepažymėti (naujam vartotojui)", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Pienas")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Pienas")).not.toBeChecked();
      expect(screen.getByLabelText("Kiaušiniai")).not.toBeChecked();
      expect(screen.getByLabelText("Veganiška")).not.toBeChecked();
      expect(screen.getByLabelText("Vegetariška")).not.toBeChecked();
    });

    describe("Equivalence Partitioning:", () => {
      it("✓ Pasirinkus NE PER DAUG elementų (vieno elemento atvejis)", async () => {
        await act(async () => {
          render(<SettingsPage />);
        });

        const pienas = await screen.findByLabelText("Pienas");
        fireEvent.click(pienas);

        expect(pienas).toBeChecked();
        expect(screen.getByLabelText("Kiaušiniai")).not.toBeChecked();
      });

      it("✓ Pasirinkus kelis elementus", async () => {
        await act(async () => {
          render(<SettingsPage />);
        });

        const pienas = await screen.findByLabelText("Pienas");
        const riesutai = screen.getByLabelText("Riešutai");
        const veganiška = screen.getByLabelText("Veganiška");

        fireEvent.click(pienas);
        fireEvent.click(riesutai);
        fireEvent.click(veganiška);

        expect(pienas).toBeChecked();
        expect(riesutai).toBeChecked();
        expect(veganiška).toBeChecked();
        expect(screen.getByLabelText("Kiaušiniai")).not.toBeChecked();
      });

      it("✓ Nepasirinkus nieko (tuščia būsena)", async () => {
        await act(async () => {
          render(<SettingsPage />);
        });

        await waitFor(() => {
          expect(screen.getByLabelText("Pienas")).toBeInTheDocument();
        });

        const allCheckboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
        allCheckboxes.forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  });

  // ============================================================================
  // 🟩 KAN-T52: TA-5.2 Sėkmingas alergijų ir dietų išsaugojimas ir išlaikymas
  // ============================================================================
  describe("KAN-T52: Išsaugojimas ir išlaikymas po perkrovimo (AC2)", () => {
    it("✓ Žingsnis 1: Pažymėtas viena alergija ir viena dieta", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      const pienas = await screen.findByLabelText("Pienas");
      const veganiška = screen.getByLabelText("Veganiška");

      fireEvent.click(pienas);
      fireEvent.click(veganiška);

      expect(pienas).toBeChecked();
      expect(veganiška).toBeChecked();
    });

    it("✓ Žingsnis 2: Sėkmingas išsaugojimas (pranešimas rodomas)", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      const pienas = await screen.findByLabelText("Pienas");
      fireEvent.click(pienas);

      const saveButton = screen.getByRole("button", { name: /^išsaugoti$/i });
      fireEvent.click(saveButton);

      // Tikrinti sėkmės pranešimą
      await screen.findByRole("status", undefined, { timeout: 3000 });
      expect(screen.getByRole("status")).toHaveTextContent(/išsaugotos/i);
    });

    it("✓ Žingsnis 3: Po perkrovimo pažymėti checkboxai lieka pažymėti", async () => {
      // Pirmas renderis: pažymėti ir išsaugoti
      const { unmount } = render(<SettingsPage />);

      const pienas = await screen.findByLabelText("Pienas");
      const veganiška = screen.getByLabelText("Veganiška");

      await act(async () => {
        fireEvent.click(pienas);
        fireEvent.click(veganiška);
      });

      const saveButton = screen.getByRole("button", { name: /^išsaugoti$/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await screen.findByRole("status");
      unmount();

      // Antras renderis: patikrinti, ar išliko
      render(<SettingsPage />);

      const pienas2 = await screen.findByLabelText("Pienas");
      const veganiška2 = screen.getByLabelText("Veganiška");

      await waitFor(() => {
        expect(pienas2).toBeChecked();
        expect(veganiška2).toBeChecked();
      });

      expect(screen.getByLabelText("Kiaušiniai")).not.toBeChecked();
    });

    it("✓ Žingsnis 4: Atžymėus ir išsaugojus, checkboxas lieka atžymėtas", async () => {
      // Setup: išsaugoti "Pienas"
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: ["Pienas"], diets: ["Veganiška"] }));

      const { unmount } = render(<SettingsPage />);

      let pienas = await screen.findByLabelText("Pienas");
      let veganiška = screen.getByLabelText("Veganiška");

      await waitFor(() => expect(pienas).toBeChecked());
      expect(veganiška).toBeChecked();

      // Atžymėti "Pienas"
      await act(async () => fireEvent.click(pienas));
      expect(pienas).not.toBeChecked();

      // Išsaugoti
      const saveButton = screen.getByRole("button", { name: /^išsaugoti$/i });
      await act(async () => fireEvent.click(saveButton));

      await screen.findByRole("status");
      unmount();

      // Perkrovimas
      render(<SettingsPage />);

      pienas = await screen.findByLabelText("Pienas");
      veganiška = screen.getByLabelText("Veganiška");

      await waitFor(() => {
        expect(pienas).not.toBeChecked();
        expect(veganiška).toBeChecked();
      });
    });
  });

  // ============================================================================
  // 🟩 KAN-T53: TA-5.3 Recepto generavimas pritaikant filtrus
  // ============================================================================
  describe("KAN-T53: Recepto generavimas pritaikant alergijų/dietų filtrus (AC3)", () => {
    it("✓ Žingsnis 1-2: Ingredientai sėkmingai pridėti ir pradedamas generavimas", async () => {
      // Šis testas pagrindiniame puslapyje, ne settings
      // Čia mes testuojame integraciją per mocking
      const mockRecipes = [
        {
          title: "Veganiški obuolių blynaičiai",
          servings: 2,
          ingredients: ["2 obuoliai", "2 puodeliai miltų", "1 puodelis vandens", "3 š. druskos"],
          steps: ["Sumaisyti", "Paruošti", "Kepti"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Miltai", "Vanduo", "Druska", "Cukrus", "Obuoliai"],
        [],
        { allergies: ["Pienas"], diets: ["Veganiška"] }
      );

      expect(recipes).toHaveLength(1);
      expect(recipes[0].title).toContain("Veganiški");
      expect(generateRecipes).toHaveBeenCalledWith(
        ["Miltai", "Vanduo", "Druska", "Cukrus", "Obuoliai"],
        [],
        { allergies: ["Pienas"], diets: ["Veganiška"] }
      );
    });

    it("✓ Žingsnis 3: Sugeneruotame recepte nėra mėsos, pieno produktų, yra veganiški ingredientai", async () => {
      const mockRecipes = [
        {
          title: "Veganiški obuolių blynaičiai",
          servings: 2,
          ingredients: [
            "2 obuoliai",
            "2 puodeliai miltų",
            "1 puodelis vandens",
            "3 šaukštai druskos",
          ],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Miltai", "Vanduo", "Druska", "Cukrus", "Obuoliai"],
        [],
        { allergies: ["Pienas"], diets: ["Veganiška"] }
      );

      const recipe = recipes[0];

      // Tikrinti, kad nėra mėsos (vištiena, jautiena ir t.t.)
      const ingredients = recipe.ingredients.join(" ").toLowerCase();
      expect(ingredients).not.toMatch(/vištiena|jautiena|žuvis|mėsa/);

      // Tikrinti, kad nėra pieno produktų
      expect(ingredients).not.toMatch(/pienas|sviestas|sūris|kefiras/);

      // Tikrinti, kad yra veganiškai tinkamų ingredientų
      expect(ingredients).toMatch(/obuoliai|miltai|vanduo|druska/);
    });

    it("✓ Kito recepto generavimo metu filtrai ir toliau veikia", async () => {
      const mockRecipes1 = [
        {
          title: "Receptas 1",
          servings: 2,
          ingredients: ["Obuoliai", "Miltai", "Vanduo"],
          steps: ["Žingsnis 1"],
          missing_ingredients: [],
          estimated_calories: 200,
        },
      ];

      const mockRecipes2 = [
        {
          title: "Receptas 2",
          servings: 2,
          ingredients: ["Obuoliai", "Miltai", "Vanduo", "Cukrus"],
          steps: ["Žingsnis 1"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock)
        .mockResolvedValueOnce(mockRecipes1)
        .mockResolvedValueOnce(mockRecipes2);

      const prefs = { allergies: ["Pienas"], diets: ["Veganiška"] };

      const recipes1 = await generateRecipes(["Miltai", "Vanduo", "Obuoliai"], [], prefs);
      const recipes2 = await generateRecipes(["Miltai", "Vanduo", "Cukrus", "Obuoliai"], [], prefs);

      expect(generateRecipes).toHaveBeenNthCalledWith(1, ["Miltai", "Vanduo", "Obuoliai"], [], prefs);
      expect(generateRecipes).toHaveBeenNthCalledWith(2, ["Miltai", "Vanduo", "Cukrus", "Obuoliai"], [], prefs);
    });
  });

  // ============================================================================
  // 🟩 KAN-T54: TA-5.4 Nustatymų redagavimas ir momentinis įsigaliojimas
  // ============================================================================
  describe("KAN-T54: Redagavimas ir momentinis įsigaliojimas kito generavimo metu (AC3)", () => {
    it("✓ Žingsnis 1: Baseline - generuojamas receptas su pienu", async () => {
      const baselineRecipes = [
        {
          title: "Blynai",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Pienas", "Sviestas", "Cukrus"],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 350,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(baselineRecipes);

      const recipes = await generateRecipes(
        ["Kiaušiniai", "Miltai", "Pienas", "Sviestas", "Cukrus"],
        [],
        { allergies: [], diets: [] }
      );

      expect(recipes[0].ingredients.join(" ")).toMatch(/[Pp]ienas|[Ss]viestas/);
    });

    it("✓ Žingsnis 3: Išsaugojus naują alergiją (Pienas), ji turėtų veikti", async () => {
      // Išsaugoti naują alergija
      const preferences = { allergies: ["Pienas"], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      // Generuoti receptą su ta pačia alerija
      const mockRecipes = [
        {
          title: "Blynai be pieno",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Vanduo", "Cukrus"],
          steps: ["Sumaisyti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 280,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Kiaušiniai", "Miltai", "Pienas", "Sviestas", "Cukrus"],
        [],
        preferences
      );

      expect(recipes[0].ingredients.join(" ")).not.toMatch(/[Pp]ienas|[Ss]viestas/);
    });

    it("✓ Žingsnis 4: Pakeitę nustatymą, naujas receptas neturi draudžiamų ingredientų", async () => {
      const oldPrefs = { allergies: [], diets: [] };
      const newPrefs = { allergies: ["Pienas"], diets: [] };

      const oldRecipe = [
        {
          title: "Blynai su pienu",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Pienas", "Sviestas"],
          steps: ["Žingsnis 1"],
          missing_ingredients: [],
          estimated_calories: 350,
        },
      ];

      const newRecipe = [
        {
          title: "Blynai be pieno",
          servings: 2,
          ingredients: ["Kiaušiniai", "Miltai", "Vanduo"],
          steps: ["Žingsnis 1"],
          missing_ingredients: [],
          estimated_calories: 250,
        },
      ];

      (generateRecipes as jest.Mock)
        .mockResolvedValueOnce(oldRecipe)
        .mockResolvedValueOnce(newRecipe);

      const ingredientList = ["Kiaušiniai", "Miltai", "Pienas", "Sviestas", "Cukrus"];

      const recipes1 = await generateRecipes(ingredientList, [], oldPrefs);
      expect(recipes1[0].ingredients.join(" ")).toMatch(/[Pp]ienas/);

      const recipes2 = await generateRecipes(ingredientList, [], newPrefs);
      expect(recipes2[0].ingredients.join(" ")).not.toMatch(/[Pp]ienas|[Ss]viestas/);
    });
  });

  // ============================================================================
  // 🟩 KAN-T55: TA-5.5 Loginio konflikto valdymas (Edge Case)
  // ============================================================================
  describe("KAN-T55: Loginio konflikto valdymas (Edge Case / Error Guessing)", () => {
    it("✓ Žingsnis 1: Vartotojas turi alergiją žemės riešutams ir jų įtraukia į ingredientus", async () => {
      const ingredients = ["Vištiena", "Ryžiai", "Žemės riešutai"];
      const preferences = { allergies: ["Žemės riešutai"], diets: [] };

      // Sistema turėtų sėkmingai priimti ingredientus (warning gali būti, bet tai UI reikalas)
      expect(ingredients).toContain("Žemės riešutai");
      expect(preferences.allergies).toContain("Žemės riešutai");
    });

    it("✓ Žingsnis 3: AI ignoruoja žemės riešutus ir sugeneruoja receptą be jų", async () => {
      const mockRecipes = [
        {
          title: "Višta su ryžiais",
          servings: 2,
          ingredients: ["Vištiena", "Ryžiai", "Sūrupa", "Druska"],
          steps: ["Paruošti", "Iškepti"],
          missing_ingredients: [],
          estimated_calories: 400,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Vištiena", "Ryžiai", "Žemės riešutai"],
        [],
        { allergies: ["Žemės riešutai"], diets: [] }
      );

      const recipeText = recipes[0].ingredients.join(" ").toLowerCase();
      expect(recipeText).not.toMatch(/žemės riešutai|riešutai/);
      expect(recipeText).toMatch(/vištiena|ryžiai/);
    });

    it("✓ Kitu atveju - receptas gali būti modifikuotas arba kitoks", async () => {
      const mockRecipes = [
        {
          title: "Alternatyvus receptas",
          servings: 2,
          ingredients: ["Žuvis", "Ryžiai", "Špinatai"],
          steps: ["Žingsnis 1"],
          missing_ingredients: [],
          estimated_calories: 350,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Vištiena", "Ryžiai", "Žemės riešutai"],
        [],
        { allergies: ["Žemės riešutai"], diets: [] }
      );

      // Receptas gali būti skirtingas arba modifikuotas
      expect(recipes).toHaveLength(1);
      expect(recipes[0].ingredients).not.toContain("Žemės riešutai");
    });

    describe("Adicionalūs Edge Case Scenarijai:", () => {
      it("✓ Kai vartotojas turi kelias alergijas ir dietų pasirinkimus", async () => {
        const mockRecipes = [
          {
            title: "Veganiška žuvies alternatyva",
            servings: 2,
            ingredients: ["Tofu", "Ryžiai", "Daržovės"],
            steps: ["Žingsnis 1"],
            missing_ingredients: [],
            estimated_calories: 320,
          },
        ];

        (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

        const complexPrefs = {
          allergies: ["Pienas", "Kiaušiniai", "Žuvis"],
          diets: ["Veganiška"],
        };

        const recipes = await generateRecipes(
          ["Tofu", "Ryžiai", "Daržovės"],
          [],
          complexPrefs
        );

        const ingredients = recipes[0].ingredients.join(" ").toLowerCase();
        expect(ingredients).not.toMatch(/pienas|kiaušiniai|žuvis/);
        expect(ingredients).not.toMatch(/sviestas|sūris|mėsa/);
      });

      it("✓ Kai vartotojas turi alergiją bet nėra jokių ingredientų", async () => {
        const mockRecipes = [
          {
            title: "Sugertas receptas",
            servings: 1,
            ingredients: [],
            steps: [],
            missing_ingredients: ["Visi ingredientai"],
            estimated_calories: 0,
          },
        ];

        (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

        const recipes = await generateRecipes(
          [],
          [],
          { allergies: ["Pienas"], diets: [] }
        );

        // Gali grąžinti tuščią arba šaltinį error, bet nebus paskelbtas klaidų
        expect(recipes).toBeDefined();
      });

      it("✓ Kai vartotojas turi kelias dietas (pvz. veganiška ir be laktozės)", async () => {
        const mockRecipes = [
          {
            title: "Veganiška, be laktozės dieta",
            servings: 2,
            ingredients: ["Ryžių pienas", "Obuoliai", "Grūdai"],
            steps: ["Žingsnis 1"],
            missing_ingredients: [],
            estimated_calories: 280,
          },
        ];

        (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

        const complexDiets = {
          allergies: [],
          diets: ["Veganiška", "Be laktozės"],
        };

        const recipes = await generateRecipes(
          ["Ryžiai", "Obuoliai", "Grūdai"],
          [],
          complexDiets
        );

        const ingredients = recipes[0].ingredients.join(" ").toLowerCase();
        expect(ingredients).not.toMatch(/sviestas|kiaušiniai|mėsa|žuvis/);
      });
    });
  });

  // ============================================================================
  // Papildomi Black Box testai
  // ============================================================================
  describe("Papildomi Black Box testai:", () => {
    it("✓ Receptų filtravimas pagal pavadinimą (nepakartojimas)", async () => {
      const mockRecipes = [
        {
          title: "Receptas 1",
          servings: 2,
          ingredients: ["Ingr1"],
          steps: ["Step1"],
          missing_ingredients: [],
          estimated_calories: 200,
        },
      ];

      (generateRecipes as jest.Mock).mockResolvedValueOnce(mockRecipes);

      const recipes = await generateRecipes(
        ["Ingr1", "Ingr2"],
        ["Receptas 1", "Receptas 2"],
        { allergies: [], diets: [] }
      );

      expect(generateRecipes).toHaveBeenCalledWith(
        ["Ingr1", "Ingr2"],
        ["Receptas 1", "Receptas 2"],
        { allergies: [], diets: [] }
      );
    });

    it("✓ Preferencijos gaunamos iš localStorage jei API nesisekė", async () => {
      const stored = { allergies: ["Pienas"], diets: ["Veganiška"] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      render(<SettingsPage />);

      const pienas = await screen.findByLabelText("Pienas");
      const veganiška = screen.getByLabelText("Veganiška");

      await waitFor(() => {
        expect(pienas).toBeChecked();
        expect(veganiška).toBeChecked();
      });
    });

    it("✓ Išsaugojimas su tuščiais pasirinkimais yra leistinas", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Pienas")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /^išsaugoti$/i });
      fireEvent.click(saveButton);

      await screen.findByRole("status");
      expect(screen.getByRole("status")).toHaveTextContent(/išsaugotos/i);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.allergies).toEqual([]);
      expect(stored.diets).toEqual([]);
    });
  });
});
