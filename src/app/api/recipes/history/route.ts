// REQ-7 (Logic): GET endpoint — grąžina iki 10 naujausių sugeneruotų receptų.
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { MAX_HISTORY_PER_USER, RecipeHistoryEntry } from "@/types/recipeHistory";
import { resolveUserIdFromBearer } from "@/lib/recipeHistory";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://demo.supabase.co" &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ history: [], demo: true });
  }

  const userId = await resolveUserIdFromBearer(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "Neprisijungę." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("recipe_history")
    .select("id, title, recipe_data, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_PER_USER);

  if (error) {
    console.error("[recipes/history GET] Klaida:", error);
    return NextResponse.json(
      { error: "Nepavyko įkelti istorijos." },
      { status: 500 }
    );
  }

  const history: RecipeHistoryEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    recipe: row.recipe_data,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ history });
}
