import { render, screen, fireEvent } from "@testing-library/react";
import IngredientInput from "@/components/IngredientInput";

const mockOnAdd = jest.fn();

function renderComponent(addedIngredients: string[] = []) {
  return render(
    <IngredientInput onAdd={mockOnAdd} addedIngredients={addedIngredients} />
  );
}

beforeEach(() => {
  mockOnAdd.mockClear();
});

describe("IngredientInput", () => {
  // AC-1: Dropdown pasirodo su bent 2 raidėmis
  describe("AC-1: Dropdown su bent 2 raidėmis", () => {
    it("nerodo dropdown kai įvesta mažiau nei 2 raidės", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "P" } });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("rodo dropdown kai įvestos 2+ raidės ir yra atitikmenų", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "Po" } });
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("Pomidoras")).toBeInTheDocument();
    });
  });

  // AC-2: Pasirinkimas tik iš sąrašo, Pridėti mygtukas
  describe("AC-2: Pasirinkimas iš sąrašo", () => {
    it("Pridėti mygtukas neaktyvus be pasirinkimo", () => {
      renderComponent();
      const button = screen.getByRole("button", { name: /pridėti/i });
      expect(button).toBeDisabled();
    });

    it("Pridėti mygtukas aktyvus pasirinkus ingredientą", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));

      const button = screen.getByRole("button", { name: /pridėti/i });
      expect(button).not.toBeDisabled();
    });

    it("iškviečia onAdd su pasirinktu ingredientu", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));

      expect(mockOnAdd).toHaveBeenCalledWith("Sviestas");
    });
  });

  // AC-3: Klaidos pranešimas kai nerasta
  describe("AC-3: Klaidos pranešimas", () => {
    it("rodo klaidos pranešimą kai ingredientas nerastas", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "xyzneegzistuoja" } });
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Tokio ingrediento neradome"
      );
    });

    it("nerodo klaidos kai yra atitikmenų", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "Pomid" } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // AC-4: Laukelis išvalomas po pridėjimo
  describe("AC-4: Laukelis išvalomas", () => {
    it("išvalo laukelį po sėkmingo pridėjimo", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));

      expect(input.value).toBe("");
    });
  });

  // Papildomi testai
  describe("Papildomi testai", () => {
    it("nerodo jau pridėtų ingredientų dropdown'e", () => {
      renderComponent(["Pomidoras"]);
      const input = screen.getByPlaceholderText(/pvz/i);

      fireEvent.change(input, { target: { value: "Pomid" } });

      // Pomidoras neturėtų būti sąraše, bet Pomidorų padažas - turėtų
      expect(screen.queryByText("Pomidoras")).not.toBeInTheDocument();
      expect(screen.getByText("Pomidorų padažas")).toBeInTheDocument();
    });

    it("mygtukas tampa neaktyvus kai vartotojas pakeičia tekstą po pasirinkimo", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/pvz/i);

      // Pasirinkti
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      expect(
        screen.getByRole("button", { name: /pridėti/i })
      ).not.toBeDisabled();

      // Pakeisti tekstą - pasirinkimas atšauktas
      fireEvent.change(input, { target: { value: "Pomido" } });
      expect(
        screen.getByRole("button", { name: /pridėti/i })
      ).toBeDisabled();
    });
  });
});
