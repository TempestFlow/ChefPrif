// Task 2.2 (Logic): API route — priima ingredientus, grąžina receptus
import { NextRequest, NextResponse } from "next/server";
import { generateRecipes } from "@/lib/generateRecipes";

export async function POST(request: NextRequest) {
  let ingredients: string[];

  let excludeTitles: string[] = [];

  try {
    const body = await request.json();
    ingredients = body.ingredients;
    excludeTitles = Array.isArray(body.excludeTitles) ? body.excludeTitles : [];
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
    const recipes = await generateRecipes(ingredients, excludeTitles);
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
