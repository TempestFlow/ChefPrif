"use client";

import { useState, useEffect } from "react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";

const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co';

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  // Task 2.3 (GUI): receptų būsena
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [showSaved, setShowSaved] = useState(false);

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
      setShowSaved(false); // Switch back to generated recipes
    } catch (err) {
      // AC-4: Klaida parodoma vartotojui
      const message =
        err instanceof Error ? err.message : "Nepavyko sugeneruoti receptų.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShowSavedRecipes() {
    setError(null);
    await loadSavedRecipes();
    setShowSaved(true);
  }

  async function loadSavedRecipes() {
    if (isDemo) {
      const stored = localStorage.getItem('savedRecipes');
      if (stored) {
        setSavedRecipes(JSON.parse(stored));
      } else {
        setSavedRecipes([]);
      }
    } else {
      try {
        const response = await fetch("/api/recipes/saved");
        const data = await response.json();
        if (response.ok) {
          setSavedRecipes(data.recipes);
        } else {
          setError(data.error ?? "Nepavyko įkelti išsaugotų receptų.");
        }
      } catch (err) {
        setError("Nepavyko įkelti išsaugotų receptų.");
      }
    }
  }

  function handleToggleSave(recipe: Recipe) {
    const isCurrentlySaved = savedRecipes.some(r => r.title === recipe.title);
    if (isCurrentlySaved) {
      // unsave
      const newSaved = savedRecipes.filter(r => r.title !== recipe.title);
      setSavedRecipes(newSaved);
      if (isDemo) {
        localStorage.setItem('savedRecipes', JSON.stringify(newSaved));
      } else {
        fetch('/api/recipes/unsave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe }),
        });
      }
    } else {
      // save
      const newSaved = [...savedRecipes, recipe];
      setSavedRecipes(newSaved);
      if (isDemo) {
        localStorage.setItem('savedRecipes', JSON.stringify(newSaved));
      } else {
        fetch('/api/recipes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe }),
        });
      }
    }
  }

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const hasRecipes = recipes !== null;
  const hasContent = hasRecipes || showSaved;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Kai nėra receptų — centruotas layout; kai yra — dviejų stulpelių */}
      <div
        className={`flex min-h-screen ${
          hasContent
            ? "flex-col lg:flex-row items-start"
            : "items-start justify-center"
        }`}
      >
        {/* Kairė pusė — ingredientai */}
        <main
          className={`px-4 py-12 sm:px-8 ${
            hasContent
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
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGenerateRecipes}
              disabled={isLoading || ingredients.length === 0}
              className={`w-full rounded-lg px-6 py-3 text-sm font-medium transition-colors ${
                isLoading || ingredients.length === 0
                  ? "cursor-not-allowed bg-gray-400 text-gray-200 dark:bg-gray-600 dark:text-gray-400"
                  : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generuojama...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🔍</span>
                  Ieškoti receptų
                </span>
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

          {/* Išsaugoti receptai mygtukas */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleShowSavedRecipes}
              className="w-full rounded-lg px-6 py-3 text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>❤️</span>
              Išsaugoti receptai
            </button>
          </div>
        </main>

        {/* Dešinė pusė — receptai (kai sugeneruota arba išsaugoti) */}
        {(hasRecipes || showSaved) && (
          <section className="flex-1 px-4 py-12 sm:px-8">
            <h2 className="mb-6 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              {showSaved ? `Išsaugoti receptai (${savedRecipes.length})` : `Sugeneruoti receptai (${recipes?.length || 0})`}
            </h2>

            <div className="flex flex-col gap-6">
              {(showSaved ? savedRecipes : recipes)?.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  isSaved={savedRecipes.some(r => r.title === recipe.title)}
                  onToggleSave={() => handleToggleSave(recipe)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
