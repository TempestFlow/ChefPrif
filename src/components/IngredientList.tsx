"use client";

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
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Kol kas nepridėta jokių ingredientų.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onRemoveAll}
        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Pašalinti visus ingredientus
      </button>
    <div className="flex flex-wrap gap-2">
      {ingredients.map((ingredient) => (
        <span
          key={ingredient}
          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
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
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-green-600 transition-colors hover:bg-green-200 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-800 dark:hover:text-green-200"
            aria-label={`Pašalinti ${ingredient}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
    </div>
  );
}
