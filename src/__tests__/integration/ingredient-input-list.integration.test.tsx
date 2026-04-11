/**
 * Integraciniai testai: IngredientInput + IngredientList sąveika
 *
 * Testuoja dviejų GUI komponentų sąveiką per bendrą React state:
 *   1. IngredientInput — ingrediento paieška ir pridėjimas
 *   2. IngredientList — pridėtų ingredientų sąrašas, šalinimas
 */

import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IngredientInput from "@/components/IngredientInput";
import IngredientList from "@/components/IngredientList";

// Wrapper komponentas — simuliuoja page.tsx bendrą state
function TestWrapper() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<string | null>(
    null
  );
  return (
    <>
      <IngredientInput
        onAdd={(ing) => setIngredients((prev) => [...prev, ing])}
        addedIngredients={ingredients}
        editingIngredient={editingIngredient}
        onReplace={(old, newIng) => {
          setIngredients((prev) => prev.map((i) => (i === old ? newIng : i)));
          setEditingIngredient(null);
        }}
      />
      <IngredientList
        ingredients={ingredients}
        onRemove={(ing) =>
          setIngredients((prev) => prev.filter((i) => i !== ing))
        }
        onRemoveAll={() => setIngredients([])}
        onEdit={(ing) => setEditingIngredient(ing)}
      />
    </>
  );
}

// Helper: prideda ingredientą per IngredientInput UI
function addIngredient(name: string, queryPrefix: string) {
  const input = screen.getByLabelText(/įveskite ingredientą/i);
  fireEvent.change(input, { target: { value: queryPrefix } });
  fireEvent.mouseDown(screen.getByText(name));
  fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
}

// ---------------------------------------------------------------------------
// 1 integracinis testas: Ingrediento pridėjimas ir atvaizdavimas
// ---------------------------------------------------------------------------
describe("Integracinis testas 1: Ingrediento pridėjimas ir atvaizdavimas (IngredientInput → IngredientList)", () => {
  it("1 atvejis: pridėtas ingredientas atsiranda IngredientList sąraše", () => {
    render(<TestWrapper />);

    // IngredientInput: įvesti "Pomid", pasirinkti "Pomidoras" iš dropdown, paspausti Pridėti
    addIngredient("Pomidoras", "Pomid");

    // IngredientList: patikrinti kad "Pomidoras" tekstas matomas ekrane
    expect(
      screen.getByText(/Pomidoras - pasirinktinis kiekis/)
    ).toBeInTheDocument();
  });

  it("2 atvejis: pridėtas ingredientas nebesiūlomas dropdown antram pridėjimui", () => {
    render(<TestWrapper />);

    // Pridėti "Pomidoras" per IngredientInput
    addIngredient("Pomidoras", "Pomid");

    // Vėl įvesti "Pomid" į IngredientInput
    const input = screen.getByLabelText(/įveskite ingredientą/i);
    fireEvent.change(input, { target: { value: "Pomid" } });

    // Dropdown nerodo "Pomidoras" (jau pridėtas)
    const listbox = screen.getByRole("listbox");
    expect(listbox).not.toHaveTextContent("Pomidoras");

    // Bet rodo "Pomidorų padažas"
    expect(screen.getByText("Pomidorų padažas")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2 integracinis testas: Ingrediento šalinimas ir redagavimas
// ---------------------------------------------------------------------------
describe("Integracinis testas 2: Ingrediento šalinimas ir redagavimas (IngredientList → IngredientInput)", () => {
  it("1 atvejis: pašalinus ingredientą iš IngredientList, jis vėl siūlomas IngredientInput dropdown", () => {
    render(<TestWrapper />);

    // Pridėti "Pomidoras"
    addIngredient("Pomidoras", "Pomid");
    expect(
      screen.getByText(/Pomidoras - pasirinktinis kiekis/)
    ).toBeInTheDocument();

    // IngredientList: paspausti × prie "Pomidoras"
    fireEvent.click(
      screen.getByLabelText(/pašalinti pomidoras/i)
    );

    // IngredientInput: įvesti "Pomid" — dropdown vėl rodo "Pomidoras"
    const input = screen.getByLabelText(/įveskite ingredientą/i);
    fireEvent.change(input, { target: { value: "Pomid" } });

    expect(screen.getByText("Pomidoras")).toBeInTheDocument();
  });

  it("2 atvejis: pašalinus visus ingredientus, rodomas tuščio sąrašo pranešimas", () => {
    render(<TestWrapper />);

    // Pridėti "Pomidoras" ir "Sviestas"
    addIngredient("Pomidoras", "Pomid");
    addIngredient("Sviestas", "Svies");

    // IngredientList: paspausti "Pašalinti visus ingredientus"
    fireEvent.click(screen.getByText(/pašalinti visus/i));

    // Patikrinti kad rodomas tekstas "Kol kas nepridėta jokių ingredientų"
    expect(
      screen.getByText("Kol kas nepridėta jokių ingredientų.")
    ).toBeInTheDocument();
  });
});