import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Home from "@/app/page";

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Home Page Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful auth session
    const mockSupabase = require("@/lib/supabase").supabase;
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "test@example.com" },
        },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: Successful ingredient addition and recipe search
  describe("Test 1: Sėkmingas ingrediento pridėjimas ir receptų paieška", () => {
    it("leidžia pridėti ingredientą su kiekiu ir vienetu, tada ieškoti receptų", async () => {
      console.log("🚀 TEST 1 STARTED");
      console.log("📝 Step 1: Įvesti ingredientą (test data) sviestas");

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recipes: [
            {
              title: "Sviesto pyragas",
              servings: 4,
              ingredients: ["200g sviesto", "300g miltų"],
              steps: ["Sumaišyti ingredientus", "Kepinti orkaitėje"],
              missing_ingredients: [],
              estimated_calories: 500,
            },
          ],
        }),
      } as Response);

      render(<Home />);

      // Step 1: Įvesti ingredientą (test data) sviestas
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      console.log("✅ Step 1 PASSED: Ingredient selected");

      // Step 2: Pasirinkti matavimo vienetą (test data) "g"
      const unitSelect = screen.getByLabelText(/vienetai/i);
      fireEvent.change(unitSelect, { target: { value: "g" } });
      console.log("✅ Step 2 PASSED: Unit 'g' selected");

      // Step 3: Pasirinkti kiekį (test data) "200"
      const quantityInput = screen.getByLabelText(/kiekis/i);
      fireEvent.change(quantityInput, { target: { value: "200" } });
      console.log("✅ Step 3 PASSED: Quantity '200' entered");

      // Step 4: Spausti "pridėti" (expected result) turėtų atsirasti "Sviestas - 200g" prie ieškos filtrų
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      expect(screen.getByText("Sviestas - 200 g")).toBeInTheDocument();
      console.log("✅ Step 4 PASSED: Ingredient 'Sviestas - 200 g' added to list");

      // Step 5: Spausti "ieškoti receptų" (expected result) Sistema turi nusiųsti promptą į API, kuris surastų receptus su šiuo ingredientu ir juos parodytų naudotojui
      const searchButton = screen.getByRole("button", { name: /ieškoti receptų/i });
      fireEvent.click(searchButton);
      console.log("✅ Step 5 PASSED: Search button clicked");

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/generate-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: ["Sviestas - 200 g"], excludeTitles: [] }),
        });
      });
      console.log("✅ Step 6 PASSED: API call verified");

      // Verify recipes are displayed
      await waitFor(() => {
        expect(screen.getByText("Sviesto pyragas")).toBeInTheDocument();
      });
      console.log("✅ Step 7 PASSED: Recipe displayed");
      console.log("🎉 TEST 1 COMPLETED SUCCESSFULLY");
    });
  });

  // Test 2: Adding ingredient without quantity
  describe("Test 2: Ingrediento pridėjimas be kiekio", () => {
    it("leidžia pridėti ingredientą be kiekio kaip 'pasirinktinis kiekis'", async () => {
      console.log("🚀 TEST 2 STARTED: Testing ingredient addition without quantity");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Select ingredient from dropdown");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Pomid" } });
      fireEvent.mouseDown(screen.getByText("Pomidoras"));
      console.log("✅ Step 2 PASSED: Ingredient 'Pomidoras' selected");

      console.log("📝 Step 3: Click add button without entering quantity");
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 3 PASSED: Add button clicked");

      console.log("📝 Step 4: Verify ingredient added with default quantity text");
      expect(screen.getByText("Pomidoras - pasirinktinis kiekis")).toBeInTheDocument();
      console.log("✅ Step 4 PASSED: Ingredient 'Pomidoras - pasirinktinis kiekis' appears in list");
      console.log("🎉 TEST 2 COMPLETED: Ingredient added without quantity successfully");
    });
  });

  // Test 3: Multiple ingredients addition
  describe("Test 3: Kelių ingredientų pridėjimas", () => {
    it("leidžia pridėti kelis skirtingus ingredientus į sąrašą", async () => {
      console.log("🚀 TEST 3 STARTED: Testing multiple ingredient addition");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Add first ingredient without quantity");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 2 PASSED: First ingredient added");

      console.log("📝 Step 3: Add second ingredient with quantity and unit");
      fireEvent.change(input, { target: { value: "Kiauš" } });
      fireEvent.mouseDown(screen.getByText("Kiaušiniai"));
      const quantityInputs = screen.getAllByPlaceholderText(/pvz.: 500/i);
      fireEvent.change(quantityInputs[0], { target: { value: "2" } });
      const unitSelects = screen.getAllByDisplayValue("g");
      fireEvent.change(unitSelects[0], { target: { value: "vnt." } });
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 3 PASSED: Second ingredient added with quantity and unit");

      console.log("📝 Step 4: Verify both ingredients appear in the list");
      expect(screen.getByText("Sviestas - pasirinktinis kiekis")).toBeInTheDocument();
      expect(screen.getByText("Kiaušiniai - 2 vnt.")).toBeInTheDocument();
      console.log("✅ Step 4 PASSED: Both ingredients are visible in the list");
      console.log("🎉 TEST 3 COMPLETED: Multiple ingredient addition verified");
    });
  });

  // Test 4: Error - trying to enter 0 quantity
  describe("Test 4: Klaida - bandymas įvesti 0 kiekį", () => {
    it("neleidžia įvesti 0 kaip kiekį ir rodo tuščią laukelį", () => {
      console.log("🚀 TEST 4 STARTED: Testing 0 quantity validation");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Try to enter 0 in quantity field");
      const quantityInput = screen.getByLabelText(/kiekis/i) as HTMLInputElement;

      fireEvent.change(quantityInput, { target: { value: "0" } });
      console.log("✅ Step 2 PASSED: Entered 0 in quantity field");

      console.log("📝 Step 3: Verify field remains empty (validation works)");
      expect(quantityInput.value).toBe("");
      console.log("✅ Step 3 PASSED: Field correctly remains empty - validation working!");
      console.log("🎉 TEST 4 COMPLETED: 0 quantity correctly blocked");
    });
  });

  // Test 5: Error - trying to enter 9999 kg
  describe("Test 5: Klaida - bandymas įvesti 9999 kg", () => {
    it("neleidžia įvesti daugiau nei 1000 ir rodo tuščią laukelį", () => {
      console.log("🚀 TEST 5 STARTED: Testing 9999 kg validation");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Select kg unit");
      const quantityInput = screen.getByLabelText(/kiekis/i) as HTMLInputElement;
      const unitSelect = screen.getByLabelText(/vienetai/i);

      fireEvent.change(unitSelect, { target: { value: "kg" } });
      console.log("✅ Step 2 PASSED: kg unit selected");

      console.log("📝 Step 3: Try to enter 9999");
      fireEvent.change(quantityInput, { target: { value: "9999" } });
      console.log("✅ Step 3 PASSED: Entered 9999 in quantity field");

      console.log("📝 Step 4: Verify field remains empty (validation works)");
      expect(quantityInput.value).toBe("");
      console.log("✅ Step 4 PASSED: Field correctly remains empty - validation working!");
      console.log("🎉 TEST 5 COMPLETED: 9999 kg correctly blocked");
    });
  });

  // Test 6: Unit selection with different units
  describe("Test 6: Vienetų pasirinkimas su skirtingais vienetais", () => {
    it("leidžia pasirinkti skirtingus matavimo vienetus", async () => {
      console.log("🚀 TEST 6 STARTED: Testing unit selection with different units");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Select ingredient and enter quantity");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      const quantityInput = screen.getByLabelText(/kiekis/i);
      const unitSelect = screen.getByLabelText(/vienetai/i);
      fireEvent.change(input, { target: { value: "Pien" } });
      fireEvent.mouseDown(screen.getByText("Pienas"));
      fireEvent.change(quantityInput, { target: { value: "500" } });
      console.log("✅ Step 2 PASSED: Ingredient selected and quantity entered");

      console.log("📝 Step 3: Change unit to ml and add ingredient");
      fireEvent.change(unitSelect, { target: { value: "ml" } });
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 3 PASSED: Unit changed to ml and add clicked");

      console.log("📝 Step 4: Verify ingredient appears with ml unit");
      expect(screen.getByText("Pienas - 500 ml")).toBeInTheDocument();
      console.log("✅ Step 4 PASSED: Ingredient displayed with correct unit");
      console.log("🎉 TEST 6 COMPLETED: Unit selection verified");
    });
  });

  // Test 7: Search with multiple ingredients
  describe("Test 7: Paieška su keliais ingredientais", () => {
    it("siunčia visus ingredientus į API paieškai", async () => {
      console.log("🚀 TEST 7 STARTED: Testing search with multiple ingredients");
      console.log("📝 Step 1: Mock API and render component");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recipes: [] }),
      } as Response);

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered and API mocked");

      console.log("📝 Step 2: Add first ingredient (Sviestas - 200 g)");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      const quantityInput = screen.getByLabelText(/kiekis/i);
      const unitSelect = screen.getByLabelText(/vienetai/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.change(quantityInput, { target: { value: "200" } });
      fireEvent.change(unitSelect, { target: { value: "g" } });
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 2 PASSED: First ingredient added");

      console.log("📝 Step 3: Add second ingredient (Kiaušiniai - 3 vnt.)");
      fireEvent.change(input, { target: { value: "Kiauš" } });
      fireEvent.mouseDown(screen.getByText("Kiaušiniai"));
      fireEvent.change(quantityInput, { target: { value: "3" } });
      fireEvent.change(unitSelect, { target: { value: "vnt." } });
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 3 PASSED: Second ingredient added");

      console.log("📝 Step 4: Click search and verify API payload");
      const searchButton = screen.getByRole("button", { name: /ieškoti receptų/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/generate-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredients: ["Sviestas - 200 g", "Kiaušiniai - 3 vnt."],
            excludeTitles: [],
          }),
        });
      });
      console.log("✅ Step 4 PASSED: API called with both ingredients");
      console.log("🎉 TEST 7 COMPLETED: Multiple ingredient search payload verified");
    });
  });

  // Test 8: API error handling
  describe("Test 8: API klaidos apdorojimas", () => {
    it("rodo klaidos pranešimą kai API nepavyksta", async () => {
      console.log("🚀 TEST 8 STARTED: Testing API error handling");
      console.log("📝 Step 1: Mock error response and render");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      } as Response);

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered and error mocked");

      console.log("📝 Step 2: Add ingredient and click search");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      const searchButton = screen.getByRole("button", { name: /ieškoti receptų/i });
      fireEvent.click(searchButton);
      console.log("✅ Step 2 PASSED: Ingredient added and search clicked");

      console.log("📝 Step 3: Verify error alert is shown");
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Server error");
      });
      console.log("✅ Step 3 PASSED: Error alert displayed");
      console.log("🎉 TEST 8 COMPLETED: API error handling verified");
    });
  });

  // Test 9: Loading state during search
  describe("Test 9: Įkėlimo būsena paieškos metu", () => {
    it("rodo įkėlimo indikatorių kol vyksta paieška", async () => {
      console.log("🚀 TEST 9 STARTED: Testing loading state during search");
      console.log("📝 Step 1: Mock delayed API response and render component");

      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ recipes: [] }),
          } as Response), 100)
        )
      );

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered and delayed API mocked");

      console.log("📝 Step 2: Add ingredient and click search");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      const searchButton = screen.getByRole("button", { name: /ieškoti receptų/i });
      fireEvent.click(searchButton);
      console.log("✅ Step 2 PASSED: Search started");

      console.log("📝 Step 3: Verify loading indicator appears");
      expect(screen.getByText("Generuojama...")).toBeInTheDocument();
      console.log("✅ Step 3 PASSED: Loading indicator visible");

      console.log("📝 Step 4: Wait until loading indicator disappears");
      await waitFor(() => {
        expect(screen.queryByText("Generuojama...")).not.toBeInTheDocument();
      });
      console.log("✅ Step 4 PASSED: Loading indicator hidden after search completion");
      console.log("🎉 TEST 9 COMPLETED: Loading state verified");
    });
  });

  // Test 10: Duplicate ingredient prevention
  describe("Test 10: Dublikatų ingredientų prevencija", () => {
    it("neleidžia pridėti to paties ingrediento du kartus", () => {
      console.log("🚀 TEST 10 STARTED: Testing duplicate ingredient prevention");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Add ingredient first time");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "Sviest" } });
      fireEvent.mouseDown(screen.getByText("Sviestas"));
      fireEvent.click(screen.getByRole("button", { name: /pridėti/i }));
      console.log("✅ Step 2 PASSED: First ingredient added");

      console.log("📝 Step 3: Try to enter same ingredient again");
      fireEvent.change(input, { target: { value: "Sviest" } });
      expect(screen.queryByText("Sviestas")).not.toBeInTheDocument();
      console.log("✅ Step 3 PASSED: Duplicate ingredient not shown");
      console.log("🎉 TEST 10 COMPLETED: Duplicate prevention verified");
    });
  });

  // Test 11: Invalid ingredient input
  describe("Test 11: Netinkamo ingrediento įvedimas", () => {
    it("nerodytų ingrediento sąraše kai nerastas", () => {
      console.log("🚀 TEST 11 STARTED: Testing invalid ingredient input");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Enter invalid ingredient text");
      const input = screen.getByLabelText(/įveskite ingredientą/i);
      fireEvent.change(input, { target: { value: "xyzneegzistuoja" } });
      console.log("✅ Step 2 PASSED: Invalid ingredient entered");

      console.log("📝 Step 3: Verify dropdown list is not shown");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      console.log("✅ Step 3 PASSED: No dropdown appears for invalid input");
      console.log("🎉 TEST 11 COMPLETED: Invalid ingredient handling verified");
    });
  });

  // Test 12: Search button disabled when no ingredients
  describe("Test 12: Paieškos mygtukas neaktyvus be ingredientų", () => {
    it("nerodomas paieškos mygtukas kai nėra pridėtų ingredientų", async () => {
      console.log("🚀 TEST 12 STARTED: Testing search button visibility without ingredients");
      console.log("📝 Step 1: Render component");

      render(<Home />);
      console.log("✅ Step 1 PASSED: Component rendered");

      console.log("📝 Step 2: Verify search button is not visible");
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /ieškoti receptų/i })).not.toBeInTheDocument();
      });
      console.log("✅ Step 2 PASSED: Search button is not shown without ingredients");
      console.log("🎉 TEST 12 COMPLETED: Search button visibility verified");
    });
  });
});