"use client";

import { useState } from "react";
import { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [toast, setToast] = useState<string | null>(null);

  async function handleCopyShoppingList() {
    if (recipe.missing_ingredients.length === 0) {
      return;
    }

    const listText = recipe.missing_ingredients
      .map((ing) => `• ${ing}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(listText);
      setToast("Sąrašas nukopijuotas!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Klaida kopijuojant:", err);
      setToast("Nepavyko nukopijuoti");
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <>
      <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {/* Pavadinimas ir porcijos */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {recipe.title}
          </h3>
          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {recipe.servings} porcij{recipe.servings === 1 ? "a" : "os"}
          </span>
        </div>

        {/* Kalorijos */}
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          ~{recipe.estimated_calories} kcal / porcijai
        </p>

        {/* Ingredientai */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ingredientai
          </h4>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                • {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Trūkstami ingredientai */}
        {recipe.missing_ingredients.length > 0 && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Trūkstami ingredientai
              </h4>
              <button
                type="button"
                onClick={handleCopyShoppingList}
                title="Kopijuoti sąrašą"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-bold text-amber-700 transition-colors hover:bg-amber-200 dark:text-amber-400 dark:hover:bg-amber-900/60"
                data-testid="copy-shopping-list"
              >
                <span className="text-xl">📋</span>
                Kopijuoti
              </button>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {recipe.missing_ingredients.join(", ")}
            </p>
          </div>
        )}

        {/* Gaminimo žingsniai */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Gaminimo žingsniai
          </h4>
          <ol className="space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </article>

      {/* Toast notifikacija */}
      {toast && (
        <div
          className="fixed bottom-4 left-4 right-4 max-w-sm rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-green-700 sm:left-auto sm:right-4"
          data-testid="toast"
        >
          {toast}
        </div>
      )}
    </>
  );
}
