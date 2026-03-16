"use client";

import { useState } from "react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);

  function handleAddIngredient(ingredient: string) {
    setIngredients((prev) => [...prev, ingredient]);
  }

  function handleRemoveIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((i) => i !== ingredient));
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl px-4 py-12 sm:px-8">
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

        {/* Receptų paieškos mygtukas (placeholder ateičiai - REQ-2) */}
        {ingredients.length > 0 && (
          <div className="mt-8">
            <button
              type="button"
              disabled
              className="w-full rounded-lg bg-zinc-300 px-6 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400 cursor-not-allowed"
            >
              Ieškoti receptų (netrukus)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
