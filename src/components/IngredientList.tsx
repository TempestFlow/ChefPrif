"use client";

import { Trash2, X } from "lucide-react";

interface IngredientListProps {
  ingredients: string[];
  onRemove: (ingredient: string) => void;
  onRemoveAll: () => void;
  onEdit: (ingredient: string) => void;
}

export default function IngredientList({
  ingredients,
  onRemove,
  onRemoveAll,
  onEdit,
}: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <p className="text-sm italic text-[var(--ink-muted)]">
        Kol kas nepridėta jokių ingredientų.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onRemoveAll}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--saved)]"
      >
        <Trash2 size={14} aria-hidden />
        Pašalinti visus ingredientus
      </button>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <span
            key={ingredient}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary-soft)] py-1.5 pl-3 pr-1.5 text-sm font-medium text-[var(--secondary)]"
          >
            <button
              type="button"
              onClick={() => onEdit(ingredient)}
              className="hover:underline focus:outline-none"
            >
              {ingredient}
            </button>
            <button
              type="button"
              onClick={() => onRemove(ingredient)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--secondary)] transition-colors hover:bg-[var(--secondary)] hover:text-white"
              aria-label={`Pašalinti ${ingredient}`}
            >
              <X size={12} strokeWidth={2.5} aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
