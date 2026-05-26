/**
 * REQ-5 Integration Tests
 * Testavimas pilname workflow'e: Settings → Preferences load → Recipe Generation
 * 
 * Šie testai atlieka integraciją tarp nustatymų puslapis, duomenų išsaugojimo
 * ir receptų generavimo su filtramis.
 */

// Mock OpenAI — must be declared before importing modules that instantiate it
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

import { generateRecipes } from "@/lib/generateRecipes";
import { UserPreferences } from "@/types/preferences";

import OpenAI from "openai";

describe("REQ-5 Integration Tests: Settings → Recipe Generation", () => {
  let openaiMock: jest.Mocked<OpenAI>;

  beforeEach(() => {
    openaiMock = new OpenAI() as jest.Mocked<OpenAI>;
  });

  describe("Integration: Settings with Recipe Generation", () => {
    it("✓ Kai profilo nustatymuose išsaugota alergija 'Pienas', AI prompt'e atsiranda draudimas", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Veganiški obuolių blynaičiai",
                    servings: 2,
                    ingredients: ["Obuoliai", "Miltai", "Vanduo"],
                    steps: ["Sumaisyti", "Iškepti"],
                    missing_ingredients: [],
                    estimated_calories: 200,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const preferences: UserPreferences = {
        allergies: ["Pienas"],
        diets: [],
      };

      const recipes = await generateRecipes(["Miltai", "Vanduo", "Obuoliai"], [], preferences);

      // Tikrinti, kad API buvo iškviesta su preferencijomis
      expect(openaiMock.chat.completions.create).toHaveBeenCalled();

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad user message'e yra alergijos draudimas
      expect(userMessage).toContain("Alergijos");
      expect(userMessage).toContain("Pienas");
      expect(userMessage).toContain("DRAUDŽIAMA");

      expect(recipes).toHaveLength(1);
      expect(recipes[0].title).toContain("Veganiški");
    });

    it("✓ Kai profilo nustatymuose išsaugota dieta 'Veganiška', AI prompt'e atsiranda reikalavimas", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Veganiški ryžiai",
                    servings: 2,
                    ingredients: ["Ryžiai", "Daržovės", "Alyvuogių aliejus"],
                    steps: ["Virinti", "Pateikti"],
                    missing_ingredients: [],
                    estimated_calories: 280,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const preferences: UserPreferences = {
        allergies: [],
        diets: ["Veganiška"],
      };

      const recipes = await generateRecipes(["Ryžiai", "Daržovės"], [], preferences);

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad user message'e yra dietos reikalavimas
      expect(userMessage).toContain("Dietos");
      expect(userMessage).toContain("Veganiška");
      expect(userMessage).toContain("TURI ATITIKTI");

      expect(recipes).toHaveLength(1);
    });

    it("✓ Kai kelios alergijos ir dietos, visos įtraukiamos į prompt'ą", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Tofu", "Ryžiai"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const preferences: UserPreferences = {
        allergies: ["Pienas", "Kiaušiniai", "Žuvis"],
        diets: ["Veganiška", "Be glitimo"],
      };

      const recipes = await generateRecipes(["Tofu", "Ryžiai"], [], preferences);

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad visos alergijos ir dietos yra
      expect(userMessage).toContain("Pienas");
      expect(userMessage).toContain("Kiaušiniai");
      expect(userMessage).toContain("Žuvis");
      expect(userMessage).toContain("Veganiška");
      expect(userMessage).toContain("Be glitimo");

      expect(recipes).toHaveLength(1);
    });

    it("✓ Kai nėra preferencijų, prompt'as neprideda jokių draudimų", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Ingredientas"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const preferences: UserPreferences = {
        allergies: [],
        diets: [],
      };

      const recipes = await generateRecipes(["Ingredientas"], [], preferences);

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad nėra alergijų ar dietų dalių
      expect(userMessage).not.toContain("Alergijos");
      expect(userMessage).not.toContain("Dietos");
    });

    it("✓ Atnaujinus preferencijas, kitas receptų generavimas naudoja naujas preferencijas", async () => {
      const mockResponse1 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas su pienu",
                    servings: 2,
                    ingredients: ["Pienas", "Cukrus"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      const mockResponse2 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas be pieno",
                    servings: 2,
                    ingredients: ["Vanduo", "Cukrus"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 250,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Pirma: be preferencijų
      const recipes1 = await generateRecipes(["Pienas", "Cukrus"], []);

      let callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      let userMessage = callArgs.messages[1].content;
      expect(userMessage).not.toContain("Alergijos");

      // Antra: su preferencijom
      const recipes2 = await generateRecipes(
        ["Pienas", "Cukrus"],
        [],
        { allergies: ["Pienas"], diets: [] }
      );

      callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[1][0];
      userMessage = callArgs.messages[1].content;
      expect(userMessage).toContain("Alergijos");
      expect(userMessage).toContain("Pienas");

      expect(recipes1[0].title).toContain("su pienu");
      expect(recipes2[0].title).toContain("be pieno");
    });
  });

  describe("Integration: Preference Persistence and Recipe Generation", () => {
    it("✓ Išsaugotų preferencijų workflow - nuo Settings puslaps iki Recipe API", async () => {
      // Simuliacija: išsaugoti preferences
      const savedPrefs: UserPreferences = {
        allergies: ["Riešutai", "Glitimas"],
        diets: ["Vegetariška"],
      };

      // Mockinti OpenAI atsakymą
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Vegetariškas receptas",
                    servings: 2,
                    ingredients: ["Višta... nope, tofu", "Daržovės"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 350,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Naudoti išsaugotus preferences recepto generavimui
      const recipes = await generateRecipes(
        ["Tofu", "Daržovės", "Riešutai aliejus"],
        [],
        savedPrefs
      );

      // Tikrinti, kad preferences buvo naudoti
      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      expect(userMessage).toContain("Riešutai");
      expect(userMessage).toContain("Glitimas");
      expect(userMessage).toContain("Vegetariška");

      expect(recipes).toHaveLength(1);
    });

    it("✓ Jei preferencijos tuščios, receptai generuojami be jokių apribojimų", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Bet koks receptas",
                    servings: 2,
                    ingredients: ["Bet kas"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const recipes = await generateRecipes(
        ["Ingredientas"],
        [],
        { allergies: [], diets: [] }
      );

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikriname, kad nėra jokių apribojimų
      expect(userMessage).not.toMatch(/Alergijos.*:/);
      expect(userMessage).not.toMatch(/Dietos.*:/);

      expect(recipes).toHaveLength(1);
    });
  });

  describe("Edge Cases: Conflicts and Special Scenarios", () => {
    it("✓ Kai ingrediente yra draudžiamas produktas, AI jį iš recipes eliminuoja", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Tofu", "Ryžiai"], // Be riešutų
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const recipes = await generateRecipes(
        ["Tofu", "Ryžiai", "Riešutai"],
        [],
        { allergies: ["Riešutai"], diets: [] }
      );

      expect(recipes[0].ingredients).not.toContain("Riešutai");
      expect(recipes[0].ingredients).toContain("Tofu");
    });

    it("✓ Kai visos dietos yra apribojtos (vegan + bez glitimo), receptas visiems atitinka", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Veganiška be glitimo",
                    servings: 2,
                    ingredients: ["Ryžiai", "Daržovės", "Kokosų pienas"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 280,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const recipes = await generateRecipes(
        ["Ryžiai", "Daržovės"],
        [],
        {
          allergies: [],
          diets: ["Veganiška", "Be glitimo"],
        }
      );

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad abi dietos minimos
      expect(userMessage).toContain("Veganiška");
      expect(userMessage).toContain("Be glitimo");

      expect(recipes[0].title).toContain("Veganiška");
    });

    it("✓ Kai yra kelios alergijos, visos eliminuojamos iš receptų", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Ryžiai", "Daržovės"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 250,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      const recipes = await generateRecipes(
        ["Ryžiai", "Daržovės", "Pienas", "Kiaušiniai"],
        [],
        {
          allergies: ["Pienas", "Kiaušiniai"],
          diets: [],
        }
      );

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad abi alergijos minimos
      expect(userMessage).toContain("Pienas");
      expect(userMessage).toContain("Kiaušiniai");

      // Tikrinti, kad jų nėra recepte
      expect(recipes[0].ingredients).not.toContain("Pienas");
      expect(recipes[0].ingredients).not.toContain("Kiaušiniai");
    });

    it("✓ Preferencijos išsaugojimas ir pakartotinis naudojimas", async () => {
      // Simuliacija: vartotojas kelis kartus naudoja tas pačias preferencijas
      const prefs: UserPreferences = {
        allergies: ["Soja"],
        diets: ["Vegetariška"],
      };

      const mockResponse1 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas 1",
                    servings: 2,
                    ingredients: ["Sviestas", "Daržovės"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      const mockResponse2 = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas 2",
                    servings: 2,
                    ingredients: ["Sūris", "Salotos"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 250,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Du kartus iš eilės su tais pačiais preferences
      const recipes1 = await generateRecipes(["Sviestas", "Daržovės"], [], prefs);
      const recipes2 = await generateRecipes(["Sūris", "Salotos"], [], prefs);

      // Tikrinti, kad abi prašymai naudojo tas pačias preferencijas
      const call1 = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const call2 = (openaiMock.chat.completions.create as jest.Mock).mock.calls[1][0];

      expect(call1.messages[1].content).toContain("Soja");
      expect(call2.messages[1].content).toContain("Soja");

      expect(recipes1[0].title).toContain("Receptas 1");
      expect(recipes2[0].title).toContain("Receptas 2");
    });
  });

  describe("API Integration: Verify Prompt Format", () => {
    it("✓ System prompt'as nereikalauja alergijų/dietų dalies, jei jų nėra", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Ingredientas"],
                    steps: ["Žingsnis"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      await generateRecipes(["Ingredientas"], [], { allergies: [], diets: [] });

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const messages = callArgs.messages;

      // System prompt yra pirmasis message
      expect(messages[0].role).toBe("system");
      expect(messages[0].content).toContain("kulinarijos asistentas");

      // User message nėra tuščias
      expect(messages[1].role).toBe("user");
      expect(messages[1].content).toBeTruthy();
    });

    it("✓ Prompt'as formavimas: ingredientai + alergijos + dietos", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recipes: [
                  {
                    title: "Receptas",
                    servings: 2,
                    ingredients: ["Ing1"],
                    steps: ["Step1"],
                    missing_ingredients: [],
                    estimated_calories: 300,
                  },
                ],
              }),
            },
          },
        ],
      };

      (openaiMock.chat.completions.create as jest.Mock).mockResolvedValueOnce(mockResponse);

      await generateRecipes(
        ["Ing1", "Ing2"],
        [],
        { allergies: ["Alergija1"], diets: ["Dieta1"] }
      );

      const callArgs = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Tikrinti, kad visos dalys yra
      expect(userMessage).toContain("Mano ingredientai");
      expect(userMessage).toContain("Ing1");
      expect(userMessage).toContain("Alergijos");
      expect(userMessage).toContain("Alergija1");
      expect(userMessage).toContain("Dietos");
      expect(userMessage).toContain("Dieta1");
    });
  });
});
