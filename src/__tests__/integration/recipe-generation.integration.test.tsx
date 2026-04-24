/**
 * Integraciniai testai: IngredientInput + RecipeCard sąveika
 *
 * Testuoja dviejų GUI komponentų sąveiką per receptų generavimo srautą:
 *   1. IngredientInput — ingrediento paieška ir pridėjimas
 *   2. RecipeCard — sugeneruotų receptų rodymas
 */

import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IngredientInput from "@/components/IngredientInput";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Wrapper komponentas — simuliuoja page.tsx receptų generavimo logiką
function TestWrapper() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddIngredient = (ingredient: string) => {
    setIngredients((prev) => [...prev, ingredient]);
  };

  const handleReplaceIngredient = (oldIngredient: string, newIngredient: string) => {
    setIngredients((prev) => prev.map((i) => (i === oldIngredient ? newIngredient : i)));
    setEditingIngredient(null);
  };

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <IngredientInput
        onAdd={handleAddIngredient}
        addedIngredients={ingredients}
        editingIngredient={editingIngredient}
        onReplace={handleReplaceIngredient}
      />
      <button onClick={handleGenerateRecipes} disabled={isLoading || ingredients.length === 0}>
        Ieškoti receptų
      </button>
      {recipes && recipes.map((recipe, index) => (
        <RecipeCard key={index} recipe={recipe} />
      ))}
    </div>
  );
}

// Helper: prideda ingredientą per IngredientInput UI
function addIngredient(name: string, queryPrefix: string) {
  const input = screen.getByLabelText(/įveskite ingredientą/i);
  fireEvent.change(input, { target: { value: queryPrefix } });
  fireEvent.mouseDown(screen.getByText(name));
  fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Integracinis testas: IngredientInput → RecipeCard per generavimo API
// ---------------------------------------------------------------------------
describe("Integracinis testas: IngredientInput ir RecipeCard sąveika", () => {
  it("1 atvejis: sėkmingas receptų generavimas — ingredientai pridedami, API iškviečiamas, receptai rodomi RecipeCard", async () => {
    const mockRecipes: Recipe[] = [
      {
        title: "Test Recipe 1",
        servings: 2,
        ingredients: ["ingredient 1", "ingredient 2"],
        steps: ["step 1", "step 2"],
        missing_ingredients: [],
        estimated_calories: 300,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ recipes: mockRecipes }),
    });

    render(<TestWrapper />);

    // IngredientInput lygis: vartotojas prideda ingredientus
    addIngredient("Miltai", "mil");
    addIngredient("Kiaušiniai", "kia");

    // Generavimo lygis: paspaudžiamas mygtukas
    fireEvent.click(screen.getByRole("button", { name: /ieškoti receptų/i }));

    // API lygis: fetch iškviečiamas su teisingais ingredientais
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ["Miltai - pasirinktinis kiekis", "Kiaušiniai - pasirinktinis kiekis"] }),
      })
    );

    // RecipeCard lygis: receptai rodomi
    await waitFor(() => expect(screen.getByText("Test Recipe 1")).toBeInTheDocument());
  });

  it("2 atvejis: API klaida — ingredientai pridedami, API grąžina klaidą, receptai nerodomi", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API error"));

    render(<TestWrapper />);

    // IngredientInput lygis: vartotojas prideda ingredientus
    addIngredient("Miltai", "mil");

    // Generavimo lygis: paspaudžiamas mygtukas
    fireEvent.click(screen.getByRole("button", { name: /ieškoti receptų/i }));

    // API lygis: fetch iškviečiamas
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // RecipeCard lygis: receptai nerodomi dėl klaidos
    expect(screen.queryByText("Test Recipe")).not.toBeInTheDocument();
  });
});