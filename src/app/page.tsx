"use client";

import { useState } from "react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  // Task 2.3 (GUI): receptų būsena
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddIngredient(ingredient: string) {
    setIngredients((prev) => [...prev, ingredient]);
  }

  function handleRemoveIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((i) => i !== ingredient));
  }

  // Task 2.3 (GUI): "Ieškoti receptų" mygtuko logika
  async function handleGenerateRecipes() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Nepavyko sugeneruoti receptų.");
      }

      setRecipes(data.recipes);
    } catch (err) {
      // AC-4: Klaida parodoma vartotojui
      const message =
        err instanceof Error ? err.message : "Nepavyko sugeneruoti receptų.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const hasRecipes = recipes !== null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Kai nėra receptų — centruotas layout; kai yra — dviejų stulpelių */}
      <div
        className={`flex min-h-screen ${
          hasRecipes
            ? "flex-col lg:flex-row items-start"
            : "items-start justify-center"
        }`}
      >
        {/* Kairė pusė — ingredientai */}
        <main
          className={`px-4 py-12 sm:px-8 ${
            hasRecipes
              ? "w-full lg:w-80 xl:w-96 lg:min-h-screen lg:border-r border-zinc-200 dark:border-zinc-800 shrink-0"
              : "w-full max-w-2xl"
          }`}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              🍳 Fridge Chef
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Įveskite turimus ingredientus ir gaukite receptų pasiūlymus
            </p>
          </div>

          {/* Ingredientų įvedimas (REQ-1) */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Mano ingredientai
            </h2>
            <IngredientInput
              onAdd={handleAddIngredient}
              addedIngredients={ingredients}
            />
          </section>

          {/* Pridėtų ingredientų sąrašas */}
          <section>
            <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Pridėti ingredientai ({ingredients.length})
            </h2>
            <IngredientList
              ingredients={ingredients}
              onRemove={handleRemoveIngredient}
            />
          </section>

          {/* Task 2.3 (GUI): "Ieškoti receptų" mygtukas */}
          {ingredients.length > 0 && (
            <div className="mt-8">
              <button
                type="button"
                onClick={handleGenerateRecipes}
                disabled={isLoading}
                className={`w-full rounded-lg px-6 py-3 text-sm font-medium transition-colors ${
                  isLoading
                    ? "cursor-not-allowed bg-green-400 text-white dark:bg-green-800"
                    : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generuojama...
                  </span>
                ) : (
                  "Ieškoti receptų"
                )}
              </button>

              {/* AC-4: Klaidos pranešimas */}
              {error && (
                <p
                  className="mt-3 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          )}
        </main>

        {/* Dešinė pusė — receptai (tik kai sugeneruota) */}
        {hasRecipes && (
          <section className="flex-1 px-4 py-12 sm:px-8">
            <h2 className="mb-6 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Sugeneruoti receptai ({recipes.length})
            </h2>

            <div className="flex flex-col gap-6">
              {recipes.map((recipe, index) => (
                <RecipeCard key={index} recipe={recipe} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
