import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock supabase auth.getSession
const mockGetSession = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

import HistoryPage, { formatDate } from "@/app/history/page";

const HISTORY_KEY = "recipeHistory";

function makeEntry(title: string, createdAt: string) {
  return {
    id: `${title}-${createdAt}`,
    title,
    recipe: {
      title,
      servings: 2,
      ingredients: ["ing 1", "ing 2"],
      steps: ["žingsnis 1", "žingsnis 2"],
      missing_ingredients: [],
      estimated_calories: 400,
    },
    createdAt,
  };
}

function sessionResponse() {
  return {
    data: {
      session: {
        access_token: "test-token",
        user: { id: "user-1", email: "test@test.lt" },
      },
    },
  };
}

// Fetch mock — reads from localStorage so the same test works in demo and non-demo modes.
const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url.includes("/api/recipes/history")) {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    return {
      ok: true,
      status: 200,
      json: async () => ({ history }),
    } as Response;
  }
  return { ok: true, status: 200, json: async () => ({}) } as Response;
});

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockGetSession.mockResolvedValue(sessionResponse());
});

describe("HistoryPage", () => {
  describe("AC: Atvaizdavimas", () => {
    it("rodo žinutę, kai istorija tuščia", async () => {
      render(<HistoryPage />);

      await screen.findByText(/Istorija tuščia/i, undefined, { timeout: 3000 });
    });

    it("grąžina originalų ISO, jei datos formatas neteisingas", () => {
      expect(formatDate("neteisinga-data")).toBe("neteisinga-data");
    });

    it("rodo iki 10 įrašų sąraše", async () => {
      const entries = Array.from({ length: 12 }, (_, i) =>
        makeEntry(`Receptas ${i + 1}`, new Date(2026, 0, i + 1).toISOString())
      );
      // Saugomi naujausi 10 (pirmieji 10 sąraše po slice)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 10)));

      render(<HistoryPage />);

      const list = await screen.findByTestId("history-list", undefined, { timeout: 3000 });
      const items = list.querySelectorAll('[data-testid="history-item"]');
      expect(items.length).toBe(10);
    });
  });

  describe("AC: Naujausi pirma", () => {
    it("įrašai rodomi įkrautu eiliškumu (naujausi pirma)", async () => {
      const newest = makeEntry("Naujausias", "2026-05-25T10:00:00.000Z");
      const middle = makeEntry("Vidurinis", "2026-05-20T10:00:00.000Z");
      const oldest = makeEntry("Seniausias", "2026-05-15T10:00:00.000Z");
      // localStorage saugo jau surūšiuotus naujausi → seniausi
      localStorage.setItem(HISTORY_KEY, JSON.stringify([newest, middle, oldest]));

      render(<HistoryPage />);

      const list = await screen.findByTestId("history-list", undefined, { timeout: 3000 });
      const items = list.querySelectorAll('[data-testid="history-item"]');
      expect(items[0]).toHaveTextContent("Naujausias");
      expect(items[1]).toHaveTextContent("Vidurinis");
      expect(items[2]).toHaveTextContent("Seniausias");
    });
  });

  describe("AC: Click → pilnas recepto vaizdas", () => {
    it("paspaudus įrašą atsidaro modalas su recepto detalėmis", async () => {
      const entry = makeEntry("Sviesto pyragas", "2026-05-25T10:00:00.000Z");
      entry.recipe.ingredients = ["200g sviesto", "300g miltų"];
      entry.recipe.steps = ["Sumaišyti", "Kepinti"];
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry]));

      render(<HistoryPage />);

      const item = await screen.findByTestId("history-item", undefined, { timeout: 3000 });
      fireEvent.click(item);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      expect(screen.getByText(/200g sviesto/)).toBeInTheDocument();
      expect(screen.getByText(/Sumaišyti/)).toBeInTheDocument();
      expect(screen.getByText(/Kepinti/)).toBeInTheDocument();
    });

    it("paspaudus uždarymo mygtuką modalas užsidaro", async () => {
      const entry = makeEntry("Receptas", "2026-05-25T10:00:00.000Z");
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry]));

      render(<HistoryPage />);

      const item = await screen.findByTestId("history-item", undefined, { timeout: 3000 });
      fireEvent.click(item);

      const closeBtn = await screen.findByLabelText(/uždaryti/i);
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Sesijos patikra", () => {
    it("nukreipia į /login, kai sesijos nėra", async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });
  });
});
