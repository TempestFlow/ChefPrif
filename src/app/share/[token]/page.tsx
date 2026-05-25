import React from "react";
import { supabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { token: string } }) {
  const token = params.token;

  const { data, error } = await supabaseServer
    .from("saved_recipes")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !data) {
    notFound();
  }

  const recipe = data as any;

  return (
    <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-900">
      <main className="mx-auto max-w-3xl px-4">
        <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{recipe.title}</h1>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{recipe.servings} porcij{recipe.servings === 1 ? "a" : "os"}</div>
          </div>

          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">~{recipe.calories} kcal / porcijai</p>

          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Ingredientai</h3>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing: string, i: number) => (
                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">• {ing}</li>
              ))}
            </ul>
          </div>

          {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
            <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
              <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">Trūkstami ingredientai</h4>
              <p className="text-sm text-amber-600 dark:text-amber-500">{recipe.missing_ingredients.join(", ")}</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Gaminimo žingsniai</h3>
            <ol className="space-y-2">
              {recipe.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </article>
      </main>
    </div>
  );
}
