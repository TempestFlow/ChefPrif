"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bookmark, ChefHat, AlertCircle, LogOut, BookmarkPlus, History, Settings } from "lucide-react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";
import { EMPTY_PREFERENCES, UserPreferences } from "@/types/preferences";
import { MAX_HISTORY_PER_USER, RecipeHistoryEntry } from "@/types/recipeHistory";
import { supabase } from "@/lib/supabase";

const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co';
const PREFERENCES_STORAGE_KEY = "userPreferences";
const HISTORY_STORAGE_KEY = "recipeHistory";

export default function Home() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const lastRequestRef = useRef<number>(0);
  const RATE_LIMIT_MS = 10000;

  function handleAddIngredient(ingredient: string) {
    setIngredients((prev) => [...prev, ingredient]);
  }

  function handleRemoveIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((i) => i !== ingredient));
  }

  function handleRemoveAllIngredients() {
    setIngredients([]);
  }

  function handleEditIngredient(ingredient: string) {
    setEditingIngredient(ingredient);
  }

  function handleReplaceIngredient(oldIngredient: string, newIngredient: string) {
    setIngredients((prev) => prev.map((i) => (i === oldIngredient ? newIngredient : i)));
    setEditingIngredient(null);
  }

  async function handleGenerateRecipes() {
    const now = Date.now();
    const elapsed = now - lastRequestRef.current;

    if (elapsed < RATE_LIMIT_MS && lastRequestRef.current !== 0) {
      const remaining = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      setError(`Per dažnai spaudžiate mygtuką. Palaukite dar ${remaining} sek.`);
      return;
    }

    lastRequestRef.current = now;
    setIsLoading(true);
    setError(null);

    const excludeTitles = recipes ? recipes.map((r) => r.title) : [];

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers,
        body: JSON.stringify({ ingredients, excludeTitles, preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Nepavyko sugeneruoti receptų.");
      }

      const newRecipes: Recipe[] = data.recipes;

      if (!newRecipes || newRecipes.length === 0) {
        setError("Naujų receptų nerasta. Pabandykite pakeisti ingredientus.");
        return;
      }

      setRecipes(newRecipes);
      setShowSaved(false);

      // REQ-7: Demo režime istorija saugoma vietinėje saugykloje (max 10 naujausių).
      if (isDemo) {
        try {
          const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
          const existing: RecipeHistoryEntry[] = raw ? JSON.parse(raw) : [];
          const now = new Date().toISOString();
          const newEntries: RecipeHistoryEntry[] = newRecipes.map((recipe) => ({
            id: `${Date.now()}-${recipe.title}`,
            title: recipe.title,
            recipe,
            createdAt: now,
          }));
          const combined = [...newEntries, ...existing].slice(0, MAX_HISTORY_PER_USER);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(combined));
        } catch {
          // ignoruoti — istorija yra papildoma funkcija
        }
      }
    } catch (err) {
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

  async function loadPreferences(accessToken: string) {
    if (isDemo) {
      try {
        const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (raw) setPreferences(JSON.parse(raw) as UserPreferences);
      } catch {
        // ignoruoti
      }
      return;
    }
    try {
      const response = await fetch("/api/user/preferences", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setPreferences({
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        diets: Array.isArray(data.diets) ? data.diets : [],
      });
    } catch {
      // ignoruoti — receptai vis tiek generuosis be filtrų
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserEmail(data.session.user.email ?? null);
      loadSavedRecipes();
      loadPreferences(data.session.access_token);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const hasRecipes = recipes !== null;
  const hasContent = hasRecipes || showSaved || isLoading;
  const displayedRecipes = showSaved ? savedRecipes : recipes;
  const showSavedEmpty = showSaved && savedRecipes.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div
        className={`flex min-h-screen ${
          hasContent
            ? "flex-col lg:flex-row items-start"
            : "items-start justify-center"
        }`}
      >
        {/* Kairė pusė — ingredientai */}
        <main
          className={`px-5 py-10 sm:px-8 ${
            hasContent
              ? "w-full lg:w-96 xl:w-[26rem] lg:min-h-screen lg:border-r border-[var(--border)] shrink-0"
              : "w-full max-w-2xl"
          }`}
        >
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary)]"
                  aria-hidden
                >
                  <ChefHat size={22} strokeWidth={2} />
                </span>
                <h1 className="font-display text-3xl font-semibold leading-none text-[var(--ink)]">
                  Fridge Chef
                </h1>
              </div>
              {userEmail && (
                <div className="text-right">
                  <p className="max-w-[10rem] truncate text-xs text-[var(--ink-muted)]">{userEmail}</p>
                  <div className="mt-1 flex items-center justify-end gap-2.5 text-xs">
                    <Link
                      href="/history"
                      className="inline-flex items-center gap-1 text-[var(--ink-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                      <History size={11} aria-hidden />
                      Istorija
                    </Link>
                    <span className="text-[var(--border)]" aria-hidden>•</span>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-1 text-[var(--ink-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                      <Settings size={11} aria-hidden />
                      Nustatymai
                    </Link>
                    <span className="text-[var(--border)]" aria-hidden>•</span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 text-[var(--ink-muted)] transition-colors hover:text-[var(--saved)]"
                    >
                      <LogOut size={11} aria-hidden />
                      Atsijungti
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              Įveskite turimus ingredientus ir gaukite receptų pasiūlymus.
            </p>
          </div>

          {/* Ingredientų įvedimas (REQ-1) */}
          <section className="mb-8">
            <h2 className="font-display mb-4 text-xl font-semibold text-[var(--ink)]">
              Mano ingredientai
            </h2>
            <IngredientInput
              onAdd={handleAddIngredient}
              addedIngredients={ingredients}
              editingIngredient={editingIngredient}
              onReplace={handleReplaceIngredient}
            />
          </section>

          {/* Pridėtų ingredientų sąrašas */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Pridėti ingredientai ({ingredients.length})
            </h2>
            <IngredientList
              ingredients={ingredients}
              onRemove={handleRemoveIngredient}
              onRemoveAll={handleRemoveAllIngredients}
              onEdit={handleEditIngredient}
            />
          </section>

          {/* Primary CTA — generate */}
          {ingredients.length > 0 && (
            <div className="mt-8 space-y-2">
              <button
                type="button"
                onClick={handleGenerateRecipes}
                disabled={isLoading || ingredients.length === 0}
                className={`inline-flex w-full max-w-md items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                  isLoading || ingredients.length === 0
                    ? "cursor-not-allowed bg-[var(--border)] text-[var(--ink-muted)]"
                    : "bg-[var(--primary)] text-white shadow-[0_4px_14px_rgba(198,107,61,0.25)] hover:bg-[var(--primary-hover)] hover:shadow-[0_6px_18px_rgba(198,107,61,0.32)] active:translate-y-px"
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Generuojama...
                  </>
                ) : (
                  <>
                    <Search size={16} aria-hidden />
                    Ieškoti receptų
                  </>
                )}
              </button>

              {error && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Secondary nav — show generated/saved (ghost style) */}
          <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
            {(hasRecipes || showSaved) && (
              <button
                type="button"
                onClick={() => setShowSaved(false)}
                disabled={!hasRecipes}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  !showSaved
                    ? "border-[var(--primary)]/40 bg-[var(--primary)]/8 text-[var(--primary)]"
                    : "border-[var(--border)] bg-transparent text-[var(--ink)] hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
                } ${!hasRecipes ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <Search size={14} aria-hidden />
                Sugeneruoti
              </button>
            )}
            <button
              type="button"
              onClick={handleShowSavedRecipes}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                showSaved
                  ? "border-[var(--saved)]/40 bg-[var(--saved)]/10 text-[var(--saved)]"
                  : "border-[var(--border)] bg-transparent text-[var(--ink)] hover:border-[var(--saved)]/30 hover:text-[var(--saved)]"
              } ${!(hasRecipes || showSaved) ? "sm:col-span-2" : ""}`}
            >
              <Bookmark size={14} aria-hidden />
              Išsaugoti
            </button>
          </div>
        </main>

        {/* Dešinė pusė — receptai (kai sugeneruota, įkeliama arba išsaugoti) */}
        {hasContent && (
          <section className="flex-1 px-5 py-10 sm:px-8">
            <h2 className="font-display mb-6 text-2xl font-semibold text-[var(--ink)]">
              {isLoading
                ? "Generuojami receptai..."
                : showSaved
                ? `Išsaugoti receptai (${savedRecipes.length})`
                : `Sugeneruoti receptai (${recipes?.length || 0})`}
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {[0, 1, 2].map((i) => (
                  <RecipeSkeleton key={i} />
                ))}
              </div>
            ) : showSavedEmpty ? (
              <EmptySaved />
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {displayedRecipes?.map((recipe, index) => (
                  <RecipeCard
                    key={index}
                    recipe={recipe}
                    isSaved={savedRecipes.some(r => r.title === recipe.title)}
                    onToggleSave={() => handleToggleSave(recipe)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function RecipeSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_2px_12px_rgba(166,124,82,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="skeleton h-7 w-2/3 rounded-md" />
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="skeleton mb-5 h-4 w-1/3 rounded-md" />
      <div className="mb-5 space-y-2">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-5/6 rounded-md" />
        <div className="skeleton h-3 w-4/6 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-3/4 rounded-md" />
      </div>
    </div>
  );
}

function EmptySaved() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 px-6 py-16 text-center">
      <span
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--saved)]/10 text-[var(--saved)]"
        aria-hidden
      >
        <BookmarkPlus size={22} />
      </span>
      <p className="font-display text-lg font-semibold text-[var(--ink)]">
        Dar neturite išsaugotų receptų
      </p>
      <p className="mt-1 max-w-sm text-sm text-[var(--ink-muted)]">
        Sugeneravę receptą, paspauskite širdelę, kad jį išsaugotumėte į savo kolekciją.
      </p>
    </div>
  );
}
