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

  it("rodo 'Nepavyko nukopijuoti' toast jei clipboard API nepavyksta", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
      new Error("Clipboard error")
    );

    render(<RecipeCard recipe={sampleRecipe} />);
    fireEvent.click(screen.getByTestId("copy-shopping-list"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Nepavyko nukopijuoti");
    });
  });
});
