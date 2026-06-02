"use client";

import { useState, useRef, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";
import { filterIngredients } from "@/data/ingredients";

interface IngredientInputProps {
  onAdd: (ingredient: string) => void;
  addedIngredients?: string[];
  editingIngredient?: string | null;
  onReplace?: (oldIngredient: string, newIngredient: string) => void;
}

export default function IngredientInput({
  onAdd,
  addedIngredients = [],
  editingIngredient = null,
  onReplace,
}: IngredientInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // When editingIngredient changes, pre-fill the fields
  useEffect(() => {
    if (!editingIngredient) return;
    const parts = editingIngredient.split(" - ");
    const name = parts[0] ?? "";
    const quantityPart = parts[1] ?? "";

    setQuery(name);
    setSelectedIngredient(name);
    setShowDropdown(false);

    if (quantityPart && quantityPart !== "pasirinktinis kiekis") {
      const tokens = quantityPart.trim().split(" ");
      const unitToken = tokens[tokens.length - 1];
      const quantityToken = tokens.slice(0, -1).join(" ");
      setQuantity(quantityToken);
      setUnit(unitToken);
    } else {
      setQuantity("");
      setUnit("g");
    }
  }, [editingIngredient]);

  // AC-1: Pradėjus vesti tekstą (bent 2 raidės), rodomas dropdown
  useEffect(() => {
    if (query.length >= 2 && !selectedIngredient) {
      const addedNames = addedIngredients
        .filter((i) => i !== editingIngredient)
        .map((i) => i.split(" - ")[0]);
      const filtered = filterIngredients(query).filter(
        (ing) => !addedNames.includes(ing)
      );
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
    setHighlightedIndex(-1);
  }, [query, addedIngredients, editingIngredient, selectedIngredient]);

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

  function handleAdd() {
    if (!selectedIngredient) return;

    const alreadyAdded = addedIngredients.some(
      (ing) => ing !== editingIngredient && ing.split(" - ")[0] === selectedIngredient
    );
    if (alreadyAdded) return;

    const quantityText = quantity.trim()
      ? `${quantity.trim()} ${unit}`
      : "pasirinktinis kiekis";
    const ingredientWithQuantity = `${selectedIngredient} - ${quantityText}`;

    if (editingIngredient && onReplace) {
      onReplace(editingIngredient, ingredientWithQuantity);
    } else {
      onAdd(ingredientWithQuantity);
    }

    setQuery("");
    setSelectedIngredient(null);
    setQuantity("");
    setUnit("g");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
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

  const isQueryLongEnough = query.length >= 2;
  const noMatchFound =
    isQueryLongEnough && suggestions.length === 0 && !selectedIngredient;

  const isAddDisabled = !selectedIngredient;
  const isEditing = !!editingIngredient;

  const fieldClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-muted)]/70 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";

  return (
    <div className="w-full max-w-md">
      <label
        htmlFor="ingredient-input"
        className="mb-2 block text-sm font-medium text-[var(--ink)]"
      >
        Įveskite ingredientą
      </label>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              size={16}
              strokeWidth={2}
              aria-hidden
            />
            <input
              ref={inputRef}
              id="ingredient-input"
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pvz.: Pomidoras, Sviestas..."
              autoComplete="off"
              className={`${fieldClass} pl-9`}
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
                className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(166,124,82,0.12)]"
              >
                {suggestions.map((ingredient, index) => (
                  <li
                    key={ingredient}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                      highlightedIndex === index
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--ink)] hover:bg-[var(--bg)]"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
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
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="ingredient-quantity"
              className="mb-1 block text-xs font-medium text-[var(--ink-muted)]"
            >
              Kiekis
            </label>
            <input
              id="ingredient-quantity"
              type="number"
              min="1"
              max="1000"
              step="any"
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 1 && Number(val) <= 1000)) setQuantity(val);
              }}
              placeholder="pvz.: 500"
              className={fieldClass.replace("px-4 py-2.5", "px-3 py-2")}
            />
          </div>
          <div>
            <label
              htmlFor="ingredient-unit"
              className="mb-1 block text-xs font-medium text-[var(--ink-muted)]"
            >
              Vienetai
            </label>
            <select
              id="ingredient-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={fieldClass.replace("px-4 py-2.5", "px-3 py-2")}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="vnt.">vnt.</option>
              <option value="šaukštas">šaukštas</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAddDisabled}
            className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              isAddDisabled
                ? "cursor-not-allowed bg-[var(--border)] text-[var(--ink-muted)]"
                : isEditing
                ? "bg-[var(--secondary)] text-white hover:brightness-95 active:brightness-90"
                : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:brightness-95"
            }`}
          >
            {isEditing ? "Pakeisti ingredientą" : "Pridėti"}
          </button>
        </div>

        {/* AC-3: Klaidos pranešimas */}
        {noMatchFound && (
          <div
            className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>Tokio ingrediento neradome. Prašome pasirinkti iš sąrašo.</span>
          </div>
        )}
      </div>
    </div>
  );
}
