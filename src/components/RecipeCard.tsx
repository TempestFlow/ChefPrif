"use client";

import { useState, useEffect } from "react";
import { Heart, Copy, AlertTriangle } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: () => void;
}

export default function RecipeCard({ recipe, isSaved, onToggleSave }: RecipeCardProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [prevIsSaved, setPrevIsSaved] = useState(isSaved);

  useEffect(() => {
    if (isSaved !== prevIsSaved) {
      setToast(isSaved ? "Receptas išsaugotas!" : "Receptas pašalintas iš išsaugotų!");
      setTimeout(() => setToast(null), 2500);
      setPrevIsSaved(isSaved);
    }
  }, [isSaved, prevIsSaved]);

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
      <article className="animate-fade-in-up rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_2px_12px_rgba(166,124,82,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(166,124,82,0.12)]">
        {/* Pavadinimas ir porcijos */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink)]">
            {recipe.title}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleSave}
              title={isSaved ? "Pašalinti iš išsaugotų" : "Išsaugoti receptą"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                isSaved
                  ? "border-transparent bg-[var(--saved)]/12 text-[var(--saved)]"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:border-[var(--saved)]/40 hover:text-[var(--saved)]"
              }`}
              data-testid="save-recipe"
            >
              <Heart
                size={20}
                strokeWidth={2}
                fill={isSaved ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* Meta — porcijos + kalorijos */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)]" aria-hidden />
            {recipe.servings} porcij{recipe.servings === 1 ? "a" : "os"}
          </span>
          <span className="text-[var(--border)]" aria-hidden>·</span>
          <span>~{recipe.estimated_calories} kcal / porcijai</span>
        </div>

        {/* Ingredientai */}
        <div className="mb-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Ingredientai
          </h4>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--ink)]">
                <span className="text-[var(--secondary)]" aria-hidden>•</span>
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trūkstami ingredientai */}
        {recipe.missing_ingredients.length > 0 && (
          <div className="mb-5 rounded-xl border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--warning)]">
                <AlertTriangle size={15} aria-hidden />
                Trūkstami ingredientai
              </h4>
              <button
                type="button"
                onClick={handleCopyShoppingList}
                title="Kopijuoti sąrašą"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--warning)]/30 bg-[var(--surface)]/60 px-3 py-1.5 text-xs font-medium text-[var(--warning)] transition-colors hover:bg-[var(--warning)]/10"
                data-testid="copy-shopping-list"
              >
                <Copy size={13} aria-hidden />
                Kopijuoti
              </button>
            </div>
            <p className="text-sm text-[var(--ink)]/80">
              {recipe.missing_ingredients.join(", ")}
            </p>
          </div>
        )}

        {/* Gaminimo žingsniai */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Gaminimo žingsniai
          </h4>
          <ol className="space-y-2.5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--ink)]">
                <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/12 text-xs font-semibold text-[var(--primary)]">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </article>

      {/* Toast notifikacija */}
      {toast && (
        <div
          className="animate-fade-in-up fixed bottom-4 left-4 right-4 z-50 max-w-sm rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(166,124,82,0.25)] sm:left-auto sm:right-4"
          data-testid="toast"
        >
          {toast}
        </div>
      )}
    </>
  );
}
