import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/types/recipe";

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const sampleRecipe: Recipe = {
  title: "Pomidoru sriuba",
  servings: 4,
  ingredients: ["400g pomidoru", "500ml vandens"],
  steps: ["Supiaustyti pomidorus", "Verdinti 15 min"],
  missing_ingredients: ["Cesnakus", "Druska"],
  estimated_calories: 150,
};

const mockToggleSave = jest.fn();

function renderCard(isSaved = false) {
  return render(
    <RecipeCard recipe={sampleRecipe} isSaved={isSaved} onToggleSave={mockToggleSave} />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (navigator.clipboard.writeText as jest.Mock).mockClear();
});

describe("RecipeCard - Shopping List Copy Feature", () => {
  it("renderina mygtuka 'Kopijuoti' kai yra trukstamu ingredientu", () => {
    renderCard();
    expect(screen.getByTestId("copy-shopping-list")).toBeInTheDocument();
  });

  it("nerenderina mygtuko kai nera trukstamu ingredientu", () => {
    render(
      <RecipeCard
        recipe={{ ...sampleRecipe, missing_ingredients: [] }}
        isSaved={false}
        onToggleSave={mockToggleSave}
      />
    );
    expect(screen.queryByTestId("copy-shopping-list")).not.toBeInTheDocument();
  });

  it("kopijuoja sarasa i clipboard su bullet points formatu", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);
    renderCard();
    fireEvent.click(screen.getByTestId("copy-shopping-list"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "\u2022 Cesnakus\n\u2022 Druska"
      );
    });
  });

  it("rodo toast po sekmingo kopijuojimo", async () => {
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);
    renderCard();
    fireEvent.click(screen.getByTestId("copy-shopping-list"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
    });
  });
});

describe("RecipeCard - Save Recipe Feature", () => {
  it("renderina issaugojimo mygtuka", () => {
    renderCard();
    expect(screen.getByTestId("save-recipe")).toBeInTheDocument();
  });

  it("rodo balta sirdele kai receptas neissaugotas", () => {
    renderCard(false);
    const heartIcon = screen.getByTestId("save-recipe").querySelector("svg");
    expect(heartIcon).toBeInTheDocument();
    expect(heartIcon).toHaveAttribute("fill", "none");
  });

  it("rodo raudona sirdele kai receptas issaugotas", () => {
    renderCard(true);
    const heartIcon = screen.getByTestId("save-recipe").querySelector("svg");
    expect(heartIcon).toBeInTheDocument();
    expect(heartIcon).toHaveAttribute("fill", "currentColor");
  });

  it("isskviecia onToggleSave paspaudus mygtuka", () => {
    renderCard();
    fireEvent.click(screen.getByTestId("save-recipe"));
    expect(mockToggleSave).toHaveBeenCalledTimes(1);
  });

  it("rodo issaugojimo toast kai isSaved pasikeicia i true", async () => {
    const { rerender } = render(
      <RecipeCard recipe={sampleRecipe} isSaved={false} onToggleSave={mockToggleSave} />
    );
    rerender(
      <RecipeCard recipe={sampleRecipe} isSaved={true} onToggleSave={mockToggleSave} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Receptas i\u0161saugotas!");
    });
  });

  it("rodo pasalinimo toast kai isSaved pasikeicia i false", async () => {
    const { rerender } = render(
      <RecipeCard recipe={sampleRecipe} isSaved={true} onToggleSave={mockToggleSave} />
    );
    rerender(
      <RecipeCard recipe={sampleRecipe} isSaved={false} onToggleSave={mockToggleSave} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
    });
  });
});
