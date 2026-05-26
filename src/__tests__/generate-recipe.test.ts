// Testai REQ-2: generateRecipes verslo logika
// Importuojame iš lib/ — be Next.js Web API priklausomybių

// AC-2: Mockuojame openai modulį
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import OpenAI from "openai";
import { generateRecipes } from "@/lib/generateRecipes";

function makeMockCreate(returnValue: unknown) {
  const mockCreate = jest.fn().mockResolvedValueOnce(returnValue);
  (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
  return mockCreate;
}

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleRecipe = {
  title: "Omletas",
  servings: 2,
  ingredients: ["2 kiaušiniai", "50ml pieno"],
  steps: ["Išplakti kiaušinius", "Kepti keptuvėje"],
  missing_ingredients: ["Sviestas"],
  estimated_calories: 200,
};

describe("AC-1: Sistema nuskaito ingredientų sąrašą iš parametro", () => {
  it("sėkmingai grąžina receptus su teisingais ingredientais", async () => {
    makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: [sampleRecipe] }) } }],
    });

    const result = await generateRecipes(["Kiaušiniai", "Pienas"]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("meta klaidą kai OpenAI grąžina tuščią content", async () => {
    makeMockCreate({ choices: [{ message: { content: null } }] });

    await expect(generateRecipes(["Kiaušiniai"])).rejects.toThrow();
  });
});

describe("AC-2: Sistema formuoja OpenAI užklausą su json_object formatu", () => {
  it("kviečia OpenAI su gpt-4o-mini ir json_object response_format", async () => {
    const mockCreate = makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: [sampleRecipe] }) } }],
    });

    await generateRecipes(["Kiaušiniai", "Pienas"]);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
      })
    );
  });

  it("į user prompt įtraukia visus vartotojo ingredientus", async () => {
    const mockCreate = makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: [sampleRecipe] }) } }],
    });

    await generateRecipes(["Pomidoras - 500 g", "Česnakas - 2 vnt."]);

    const userMessage = mockCreate.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(userMessage.content).toContain("Pomidoras - 500 g");
    expect(userMessage.content).toContain("Česnakas - 2 vnt.");
  });

  it("naudoja system prompt su JSON struktūros aprašymu", async () => {
    const mockCreate = makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: [sampleRecipe] }) } }],
    });

    await generateRecipes(["Kiaušiniai"]);

    const systemMessage = mockCreate.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === "system"
    );
    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain("recipes");
  });
});

describe("AC-3: Atsakymas paverčiamas į Recipe objektą", () => {
  it("grąžina receptą su visais reikalingais laukais", async () => {
    makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: [sampleRecipe] }) } }],
    });

    const result = await generateRecipes(["Kiaušiniai"]);

    expect(result[0].title).toBe("Omletas");
    expect(result[0].servings).toBe(2);
    expect(Array.isArray(result[0].ingredients)).toBe(true);
    expect(Array.isArray(result[0].steps)).toBe(true);
    expect(Array.isArray(result[0].missing_ingredients)).toBe(true);
    expect(typeof result[0].estimated_calories).toBe("number");
  });

  it("meta klaidą kai atsakyme nėra 'recipes' masyvo", async () => {
    makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ kitas: "formatas" }) } }],
    });

    await expect(generateRecipes(["Kiaušiniai"])).rejects.toThrow();
  });

  it("grąžina kelis receptus", async () => {
    const twoRecipes = [sampleRecipe, { ...sampleRecipe, title: "Kiaušinienė" }];
    makeMockCreate({
      choices: [{ message: { content: JSON.stringify({ recipes: twoRecipes }) } }],
    });

    const result = await generateRecipes(["Kiaušiniai", "Pienas"]);
    expect(result).toHaveLength(2);
  });
});

describe("AC-4: Klaidos atveju išmetama klaida su pranešimu", () => {
  it("meta klaidą tinklo klaidos atveju", async () => {
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValueOnce(new Error("Network error")),
        },
      },
    }));

    await expect(generateRecipes(["Kiaušiniai"])).rejects.toThrow("Network error");
  });

  it("meta klaidą timeout atveju", async () => {
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValueOnce(new Error("Request timeout")),
        },
      },
    }));

    await expect(generateRecipes(["Kiaušiniai"])).rejects.toThrow("timeout");
  });
});
