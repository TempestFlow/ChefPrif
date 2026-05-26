// Task 3.2 (Logic): API route receptų išsaugojimui
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { Recipe } from "@/types/recipe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipe }: { recipe: Recipe } = body;

    // Validacija
    if (!recipe || !recipe.title || !recipe.ingredients) {
      return NextResponse.json(
        { error: "Neteisingi recepto duomenys." },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // For demo purposes, simulate successful save
      return NextResponse.json({
        success: true,
        message: "Receptas išsaugotas! (Demo režimas)",
        recipe: {
          id: Date.now(),
          user_id: "demo-user",
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          calories: recipe.estimated_calories,
        }
      });
    }

    // AC-2: Patikrinti dublikatus (UNIQUE constraint ant (user_id, title))
    // Šiuo metu nėra autentifikacijos, todėl naudojame fiktyvų user_id
    // Ateityje čia bus realus user_id iš sesijos
    const userId = "demo-user"; // Placeholder

    const { data: existingRecipe, error: checkError } = await supabaseServer
      .from("saved_recipes")
      .select("id")
      .eq("user_id", userId)
      .eq("title", recipe.title)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = not found
      console.error("Klaida tikrinant dublikatus:", checkError);
      return NextResponse.json(
        { error: "Nepavyko patikrinti dublikatų." },
        { status: 500 }
      );
    }

    if (existingRecipe) {
      return NextResponse.json(
        { error: "Šis receptas jau išsaugotas." },
        { status: 409 }
      );
    }

    // AC-3: Įrašyti receptą į duomenų bazę
    const { data, error } = await supabaseServer
      .from("saved_recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        calories: recipe.estimated_calories,
        servings: recipe.servings,
        missing_ingredients: recipe.missing_ingredients,
      })
      .select()
      .single();

    if (error) {
      console.error("Klaida įrašant receptą:", error);
      return NextResponse.json(
        { error: "Nepavyko išsaugoti recepto." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Receptas išsaugotas!",
      recipe: data
    });

  } catch (error) {
    console.error("Serverio klaida:", error);
    return NextResponse.json(
      { error: "Serverio klaida." },
      { status: 500 }
    );
  }
}