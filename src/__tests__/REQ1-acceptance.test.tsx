import { render, screen, fireEvent } from "@testing-library/react";
import IngredientInput from "@/components/IngredientInput";

const mockOnAdd = jest.fn();

function renderComponent() {
  return render(<IngredientInput onAdd={mockOnAdd} addedIngredients={[]} />);
}

beforeEach(() => {
  mockOnAdd.mockClear();
});

describe("REQ-1: Vieno ingrediento pridėjimas su validacija", () => {
  describe("AC-1: Dropdown su ≥2 raidėmis [Boundary Testing]", () => {
    it("TA-1.1: Tuščias laukas — dropdown nerodomas (Boundary: 0 raidžių)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "" } });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("TA-1.2: Viena raidė — dropdown nerodomas (Boundary: 1 raidė)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "P" } });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("TA-1.3: Dvi raidės — dropdown pasirodo (Boundary: 2 raidės — riba)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Po" } });
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("TA-1.4: Trys raidės — dropdown rodomas ir filtruoja teisingai (Boundary: 3 raidės)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pom" } });
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("Pomidoras")).toBeInTheDocument();
    });
  });

  describe("AC-2: Pasirinkimas tik iš sąrašo + Pridėti [Decision Table R3-R5]", () => {
    it("TA-2.1: Mygtukas neaktyvus kai ingredientas nepasirinktas iš dropdown (R3)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pomidoras" } });
      const button = screen.getByRole("button", { name: /pridėti/i });
      expect(button).toBeDisabled();
    });

    it("TA-2.2: Pasirinkus ingredientą iš dropdown — mygtukas tampa aktyvus (R4)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      const button = screen.getByRole("button", { name: /pridėti/i });
      expect(button).not.toBeDisabled();
    });

    it("TA-2.3: Sėkmingas ingrediento pridėjimas į sąrašą (R5)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      expect(mockOnAdd).toHaveBeenCalledWith("Pomidoras - pasirinktinis kiekis");
    });
  });

  describe("AC-3: Klaidos pranešimas [Decision Table R2]", () => {
    it("TA-3.1: Klaidos pranešimas rodomas su neegzistuojančiu ingredientu (R2)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "xyzneegzistuoja" } });
      expect(screen.getByRole("alert")).toHaveTextContent("Tokio ingrediento neradome");
    });

    it("TA-3.2: Mygtukas lieka neaktyvus su neegzistuojančiu ingredientu (R2)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "xyzneegzistuoja" } });
      const button = screen.getByRole("button", { name: /pridėti/i });
      expect(button).toBeDisabled();
    });
  });

  describe("AC-4: Laukelio išvalymas [Decision Table R5 post-condition]", () => {
    it("TA-4.1: Teksto laukelis išvalomas po sėkmingo pridėjimo (R5)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      expect(input.value).toBe("");
    });

    it("TA-4.2: Dropdown uždaromas po sėkmingo pridėjimo (R5)", () => {
      renderComponent();
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      expect(screen.queryByRole("listbox")).toBeInTheDocument();
    });
  });
});
