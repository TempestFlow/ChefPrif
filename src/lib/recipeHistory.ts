// REQ-7 (Logic): Serverio helper'is — įrašo receptus į istoriją ir
// užtikrina, kad išliktų tik MAX_HISTORY_PER_USER naujausių įrašų vienam vartotojui.
import { Recipe } from "@/types/recipe";
import { MAX_HISTORY_PER_USER } from "@/types/recipeHistory";
import { supabaseServer } from "@/lib/supabase";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://demo.supabase.co" &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function resolveUserIdFromBearer(authorizationHeader: string | null): Promise<string | null> {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const { data, error } = await supabaseServer.auth.getUser(match[1]);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function saveRecipesToHistory(userId: string, recipes: Recipe[]): Promise<void> {
  if (!isSupabaseConfigured || recipes.length === 0) return;

  const rows = recipes.map((recipe) => ({
    user_id: userId,
    title: recipe.title,
    recipe_data: recipe,
  }));

  const { error: insertError } = await supabaseServer.from("recipe_history").insert(rows);
  if (insertError) {
    console.error("[recipeHistory] Klaida įrašant į istoriją:", insertError);
    return;
  }

  // Apkarpyti iki MAX_HISTORY_PER_USER naujausių įrašų.
  const { data: all, error: selectError } = await supabaseServer
    .from("recipe_history")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (selectError || !all) {
    console.error("[recipeHistory] Klaida nuskaitant istoriją apkarpymui:", selectError);
    return;
  }

  if (all.length <= MAX_HISTORY_PER_USER) return;

  const idsToDelete = all.slice(MAX_HISTORY_PER_USER).map((row) => row.id);
  const { error: deleteError } = await supabaseServer
    .from("recipe_history")
    .delete()
    .in("id", idsToDelete);

  if (deleteError) {
    console.error("[recipeHistory] Klaida šalinant senus įrašus:", deleteError);
  }
}
