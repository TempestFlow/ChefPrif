"use client";

import { useState } from "react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";
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

// Recepto kortelė
function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
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
          <h4 className="mb-1 text-sm font-medium text-amber-700 dark:text-amber-400">
            Trūkstami ingredientai
          </h4>
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
  );
}
