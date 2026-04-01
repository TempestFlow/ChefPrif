// Task 2.2 (Logic): Verslo logika — ingredientai → OpenAI → receptai
// Atskiras failas leidžia testuoti be Next.js Web API priklausomybių
import OpenAI from "openai";
import { Recipe } from "@/types/recipe";

const SYSTEM_PROMPT = `Tu esi kulinarijos asistentas. Vartotojas pateiks ingredientų sąrašą.
Sugeneruok 3 receptus, kuriuos galima pagaminti iš tų ingredientų.

Grąžink tik JSON objektą šia struktūra:
{
  "recipes": [
    {
      "title": "Recepto pavadinimas",
      "servings": 2,
      "ingredients": ["ingredientas su kiekiu", "..."],
      "steps": ["žingsnis 1", "žingsnis 2", "..."],
      "missing_ingredients": ["ingredientas kurio nėra sąraše, bet reikia receptui", "..."],
      "estimated_calories": 450
    }
  ]
}

Taisyklės:
- ingredients masyve naudok turimus ingredientus su kiekiais
- missing_ingredients — ingredientai kurių NĖRA vartotojo sąraše, bet reikia receptui
- estimated_calories — apytikslės kalorijos vienai porcijai
- Viskas lietuvių kalba`;

// AC-2: OpenAI užklausa su json_object formatu
// AC-3: Atsakymas paverčiamas į Recipe[] masyvą
export async function generateRecipes(ingredients: string[]): Promise<Recipe[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // Timeout padidintas — OpenAI gali atsakyti lėčiau
  });

  const userMessage = `Mano ingredientai: ${ingredients.join(", ")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Tuščias atsakymas iš OpenAI.");
  }

  const parsed = JSON.parse(content) as { recipes: Recipe[] };

  if (!Array.isArray(parsed.recipes)) {
    throw new Error("Neteisingas atsakymo formatas — nėra 'recipes' masyvo.");
  }

  return parsed.recipes;
}
