"use client";

import { useState, useRef, useEffect } from "react";
import { filterIngredients, INGREDIENTS } from "@/data/ingredients";

interface IngredientInputProps {
  onAdd: (ingredient: string) => void;
  addedIngredients?: string[];
}

export default function IngredientInput({
  onAdd,
  addedIngredients = [],
}: IngredientInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // AC-1: Pradėjus vesti tekstą (bent 2 raidės), rodomas dropdown
  useEffect(() => {
    if (query.length >= 2) {
      const filtered = filterIngredients(query).filter(
        (ing) => !addedIngredients.includes(ing)
      );
      setSuggestions(filtered);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
    setHighlightedIndex(-1);
  }, [query, addedIngredients]);

  // Uždaryti dropdown paspaudus šalia
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // AC-2: Pasirinkimas tik iš sąrašo
  function handleSelectIngredient(ingredient: string) {
    setSelectedIngredient(ingredient);
    setQuery(ingredient);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  }

  // AC-2: Pridėti mygtukas aktyvus tik kai pasirinktas ingredientas iš sąrašo
  function handleAdd() {
    if (selectedIngredient && !addedIngredients.includes(selectedIngredient)) {
      onAdd(selectedIngredient);
      // AC-4: Po pridėjimo laukelis išvalomas
      setQuery("");
      setSelectedIngredient(null);
      setSuggestions([]);
      inputRef.current?.focus();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    // Jei vartotojas keičia tekstą, atšaukiame pasirinkimą
    setSelectedIngredient(null);
  }

  // Klaviatūros navigacija dropdown'e
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter" && selectedIngredient) {
        e.preventDefault();
        handleAdd();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectIngredient(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("li");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // AC-3: Ar rodyti klaidos pranešimą
  const isQueryLongEnough = query.length >= 2;
  const noMatchFound =
    isQueryLongEnough && suggestions.length === 0 && !selectedIngredient;

  // AC-2: Mygtukas aktyvus tik su pasirinktu ingredientu
  const isAddDisabled = !selectedIngredient;

  return (
    <div className="w-full max-w-md">
      <label
        htmlFor="ingredient-input"
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Įveskite ingredientą
      </label>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="ingredient-input"
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pvz.: Pomidoras, Sviestas..."
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              role="combobox"
            />

            {/* Dropdown sąrašas */}
            {showDropdown && suggestions.length > 0 && (
              <ul
                ref={dropdownRef}
                role="listbox"
                className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
              >
                {suggestions.map((ingredient, index) => (
                  <li
                    key={ingredient}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                      highlightedIndex === index
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Kad input neprarastų fokuso prieš click
                      handleSelectIngredient(ingredient);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AC-2: Pridėti mygtukas */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAddDisabled}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              isAddDisabled
                ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
            }`}
          >
            Pridėti
          </button>
        </div>

        {/* AC-3: Klaidos pranešimas */}
        {noMatchFound && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            Tokio ingrediento neradome. Prašome pasirinkti iš sąrašo.
          </p>
        )}
      </div>
    </div>
  );
}
