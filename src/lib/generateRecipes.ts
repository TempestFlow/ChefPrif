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
- ingredients masyve įtrauk VISUS receptui reikalingus ingredientus su kiekiais (ir turimus, ir trūkstamus)
- missing_ingredients — ingredientai kurių NĖRA vartotojo sąraše, bet reikia receptui
- estimated_calories — apytikslės kalorijos vienai porcijai
- Viskas lietuvių kalba
- Jei pateiktas sąrašas "Jau sugeneruoti receptai", NEGENERUOK receptų su tais pavadinimais — sugeneruok visiškai skirtingus receptus to pačio JSON formato`;

export async function generateRecipes(
  ingredients: string[],
  excludeTitles: string[] = []
): Promise<Recipe[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
  });

  const excludePart =
    excludeTitles.length > 0
      ? `\nJau sugeneruoti receptai (NEKARTOK šių): ${excludeTitles.join(", ")}`
      : "";

  const userMessage = `Mano ingredientai: ${ingredients.join(", ")}${excludePart}`;

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
