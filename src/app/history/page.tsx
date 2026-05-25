"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";
import { RecipeHistoryEntry } from "@/types/recipeHistory";
import { supabase } from "@/lib/supabase";

const isDemo =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://demo.supabase.co";

const HISTORY_STORAGE_KEY = "recipeHistory";
const SAVED_RECIPES_KEY = "savedRecipes";

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("lt-LT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [history, setHistory] = useState<RecipeHistoryEntry[]>([]);
  const [selected, setSelected] = useState<RecipeHistoryEntry | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserEmail(data.session.user.email ?? null);
      await loadHistory(data.session.access_token);
      loadSavedRecipesLocal();
      setIsLoading(false);
    }
    init();
  }, [router]);

  async function loadHistory(accessToken: string) {
    if (isDemo) {
      try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as RecipeHistoryEntry[]) : [];
        setHistory(parsed);
      } catch {
        setHistory([]);
      }
      return;
    }
    try {
      const response = await fetch("/api/recipes/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        setError("Nepavyko įkelti istorijos.");
        return;
      }
      const data = await response.json();
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch {
      setError("Nepavyko įkelti istorijos.");
    }
  }

  function loadSavedRecipesLocal() {
    if (!isDemo) return;
    try {
      const raw = localStorage.getItem(SAVED_RECIPES_KEY);
      if (raw) setSavedRecipes(JSON.parse(raw));
    } catch {
      // ignoruoti
    }
  }

  function handleToggleSave(recipe: Recipe) {
    const isCurrentlySaved = savedRecipes.some((r) => r.title === recipe.title);
    const newSaved = isCurrentlySaved
      ? savedRecipes.filter((r) => r.title !== recipe.title)
      : [...savedRecipes, recipe];
    setSavedRecipes(newSaved);

    if (isDemo) {
      try {
        localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSaved));
      } catch {
        // ignoruoti
      }
      return;
    }
    const endpoint = isCurrentlySaved ? "/api/recipes/unsave" : "/api/recipes/save";
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe }),
    }).catch(() => {
      // ignoruoti — UI būsena jau atnaujinta
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">📜 Istorija</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Paskutiniai 10 sugeneruotų receptų.
            </p>
          </div>
          <div className="text-right">
            {userEmail && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-35">{userEmail}</p>
            )}
            <Link
              href="/"
              className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              ← Grįžti į pradžią
            </Link>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Įkeliama...</p>
        )}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && history.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Istorija tuščia. Sugeneruokite bent vieną receptą pradžios puslapyje.
          </p>
        )}

        {!isLoading && history.length > 0 && (
          <ul className="space-y-2" data-testid="history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-green-500 hover:bg-green-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-600 dark:hover:bg-zinc-800"
                  data-testid="history-item"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.title}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setSelected(null)}
          data-testid="recipe-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Receptas: ${selected.title}`}
        >
          <div
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              aria-label="Uždaryti"
            >
              ✕
            </button>
            <RecipeCard
              recipe={selected.recipe}
              isSaved={savedRecipes.some((r) => r.title === selected.recipe.title)}
              onToggleSave={() => handleToggleSave(selected.recipe)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
