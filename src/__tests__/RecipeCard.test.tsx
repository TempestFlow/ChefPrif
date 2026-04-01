import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";

// Mockuojame navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const sampleRecipe: Recipe = {
  title: "Pomidorų sriuba",
  servings: 4,
  ingredients: ["400g pomidorų", "500ml vandens"],
  steps: ["Supiaustyti pomidorus", "Verdinti 15 min"],
  missing_ingredients: ["Česnakus", "Druską"],
  estimated_calories: 150,
};

describe("RecipeCard - Shopping List Copy Feature", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renderina mygtuką 'Kopijuoti' kai yra trūkstamų ingredientų", () => {
    render(<RecipeCard recipe={sampleRecipe} />);
    expect(screen.getByTestId("copy-shopping-list")).toBeInTheDocument();
  });

  it("nerenderina mygtuko kai nėra trūkstamų ingredientų", () => {
    const recipeLessMissing = { ...sampleRecipe, missing_ingredients: [] };
    render(<RecipeCard recipe={recipeLessMissing} />);
    expect(screen.queryByTestId("copy-shopping-list")).not.toBeInTheDocument();
  });

  it("kopijuoja sąrašą į clipboard su bullet points formatu", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("copy-shopping-list"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "• Česnakus\n• Druška"
      );
    });
  });

  it("rodo 'Sąrašas nukopijuotas!' toast po sėkmingo kopijuojimo", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("copy-shopping-list"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Sąrašas nukopijuotas!");
    });
  });

// Mockuojame fetch API
global.fetch = jest.fn();

describe("RecipeCard - Save Recipe Feature", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renderina širdelės mygtuką", () => {
    render(<RecipeCard recipe={sampleRecipe} />);
    expect(screen.getByTestId("save-recipe")).toBeInTheDocument();
  });

  it("rodo baltą širdelę kai receptas neišsaugotas", () => {
    render(<RecipeCard recipe={sampleRecipe} />);
    const button = screen.getByTestId("save-recipe");
    expect(button).toHaveTextContent("🤍");
    expect(button).toHaveClass("w-10", "h-10"); // Larger button
  });

  it("siunčia POST užklausą į /api/recipes/save kai paspaudžiamas mygtukas", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Receptas išsaugotas!" }),
    });

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("save-recipe"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: sampleRecipe }),
      });
    });
  });

  it("rodo raudoną širdelę ir sėkmės toast po sėkmingo išsaugojimo", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Receptas išsaugotas!" }),
    });

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("save-recipe"));

    await waitFor(() => {
      expect(screen.getByTestId("save-recipe")).toHaveTextContent("❤️");
      expect(screen.getByTestId("toast")).toHaveTextContent("Receptas išsaugotas!");
    });
  });

  it("rodo dublikatų pranešimą kai receptas jau išsaugotas", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "Šis receptas jau išsaugotas." }),
    });

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("save-recipe"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Šis receptas jau išsaugotas!");
    });
  });

  it("rodo klaidos pranešimą kai nepavyksta išsaugoti", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Nepavyko išsaugoti recepto." }),
    });

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("save-recipe"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Nepavyko išsaugoti recepto.");
    });
  });

  it("rodo loading būseną kol vyksta išsaugojimas", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, message: "Receptas išsaugotas!" }),
      }), 100))
    );

    render(<RecipeCard recipe={sampleRecipe} />);
    const button = screen.getByTestId("save-recipe");

    fireEvent.click(button);

    // Kol vyksta loading, mygtukas turi būti disabled
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
