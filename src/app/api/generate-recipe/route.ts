// Task 2.2 (Logic): API route — priima ingredientus, grąžina receptus
import { NextRequest, NextResponse } from "next/server";
import { generateRecipes } from "@/lib/generateRecipes";
import { EMPTY_PREFERENCES, UserPreferences } from "@/types/preferences";

export async function POST(request: NextRequest) {
  let ingredients: string[];

  let excludeTitles: string[] = [];
  let preferences: UserPreferences = EMPTY_PREFERENCES;

  try {
    const body = await request.json();
    ingredients = body.ingredients;
    excludeTitles = Array.isArray(body.excludeTitles) ? body.excludeTitles : [];

    if (body.preferences && typeof body.preferences === "object") {
      preferences = {
        allergies: Array.isArray(body.preferences.allergies)
          ? body.preferences.allergies.filter((v: unknown) => typeof v === "string")
          : [],
        diets: Array.isArray(body.preferences.diets)
          ? body.preferences.diets.filter((v: unknown) => typeof v === "string")
          : [],
      };
    }
  } catch {
    return NextResponse.json(
      { error: "Neteisingas užklausos formatas." },
      { status: 400 }
    );
  }

  // AC-1: Validuojame ingredientų sąrašą
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredientų sąrašas yra tuščias." },
      { status: 400 }
    );
  }

  try {
    const recipes = await generateRecipes(ingredients, excludeTitles, preferences);
    return NextResponse.json({ recipes });
  } catch (error) {
    // AC-4: Klaida registruojama žurnale
    console.error("[generate-recipe] Klaida:", error);

    const isTimeout =
      error instanceof Error && error.message.includes("timeout");

    return NextResponse.json(
      {
        error: isTimeout
          ? "Užklausa užtruko per ilgai. Bandykite dar kartą."
          : "Nepavyko sugeneruoti receptų. Bandykite dar kartą.",
      },
      { status: 500 }
    );
  }
}
