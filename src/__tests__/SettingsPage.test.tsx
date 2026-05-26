import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

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

import SettingsPage from "@/app/settings/page";

const STORAGE_KEY = "userPreferences";

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

// Mock fetch — atspindi /api/user/preferences elgesį per localStorage,
// kad tas pats testas veiktų tiek demo, tiek ne-demo režime.
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url.includes("/api/user/preferences")) {
    if (init?.method === "POST") {
      const body = init.body ? JSON.parse(init.body as string) : { allergies: [], diets: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(body));
      return jsonResponse({ success: true, ...body });
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs = raw ? JSON.parse(raw) : { allergies: [], diets: [] };
    return jsonResponse(prefs);
  }
  return jsonResponse({}, 404);
});

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockGetSession.mockResolvedValue(sessionResponse());
});

describe("SettingsPage", () => {
  // AC-1: Checkboxes are shown
  describe("AC-1: Rodo alergijų ir dietų checkbox'us", () => {
    it("po įkrovimo rodo visus alergijų checkbox'us", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Pienas")).toBeInTheDocument();
      });
      expect(screen.getByLabelText("Kiaušiniai")).toBeInTheDocument();
      expect(screen.getByLabelText("Riešutai")).toBeInTheDocument();
      expect(screen.getByLabelText("Glitimas")).toBeInTheDocument();
      expect(screen.getByLabelText("Žuvis")).toBeInTheDocument();
      expect(screen.getByLabelText("Soja")).toBeInTheDocument();
    });

    it("po įkrovimo rodo visus dietų checkbox'us", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Veganiška")).toBeInTheDocument();
      });
      expect(screen.getByLabelText("Vegetariška")).toBeInTheDocument();
      expect(screen.getByLabelText("Be glitimo")).toBeInTheDocument();
      expect(screen.getByLabelText("Be laktozės")).toBeInTheDocument();
    });

    it("checkbox'ai pradžioje nepažymėti, kai nėra išsaugotų preferencijų", async () => {
      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Pienas")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Pienas")).not.toBeChecked();
      expect(screen.getByLabelText("Veganiška")).not.toBeChecked();
    });
  });

  // AC-2: Saving works (Supabase API + localStorage demo fallback)
  describe("AC-2: Išsaugojimas veikia", () => {
    it("pažymėjus checkbox'us ir spaudus 'Išsaugoti' duomenys išsaugomi", async () => {
      render(<SettingsPage />);

      const pienas = await screen.findByLabelText("Pienas", {}, { timeout: 3000 });
      fireEvent.click(pienas);
      fireEvent.click(screen.getByLabelText("Veganiška"));

      fireEvent.click(screen.getByRole("button", { name: /^išsaugoti$/i }));

      await screen.findByRole("status", undefined, { timeout: 3000 });
      expect(screen.getByRole("status")).toHaveTextContent(/išsaugotos/i);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.allergies).toEqual(["Pienas"]);
      expect(stored.diets).toEqual(["Veganiška"]);
    });

    it("pakartotinai paspaudus checkbox'ą jis tampa nepažymėtas", async () => {
      render(<SettingsPage />);

      const pienas = await screen.findByLabelText("Pienas", {}, { timeout: 3000 });
      fireEvent.click(pienas);
      expect(pienas).toBeChecked();
      fireEvent.click(pienas);
      expect(pienas).not.toBeChecked();
    });
  });

  // AC-3: Preferences load from API/localStorage on mount
  describe("AC-3: Mount metu įkraunamos ankstesnės preferencijos", () => {
    it("checkbox'ai pažymėti pagal įkrautas reikšmes", async () => {
      // Tiek demo (localStorage), tiek ne-demo (fetchMock skaito localStorage) keliai
      // grąžins šias reikšmes:
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ allergies: ["Riešutai", "Soja"], diets: ["Vegetariška"] })
      );

      render(<SettingsPage />);

      // findByLabelText laukia, kol elementas pasirodys + leidžia React'ui flush'inti useEffect'us
      const riesutai = await screen.findByLabelText("Riešutai", {}, { timeout: 3000 });
      await waitFor(() => expect(riesutai).toBeChecked(), { timeout: 3000 });

      expect(screen.getByLabelText("Soja")).toBeChecked();
      expect(screen.getByLabelText("Vegetariška")).toBeChecked();
      expect(screen.getByLabelText("Pienas")).not.toBeChecked();
      expect(screen.getByLabelText("Veganiška")).not.toBeChecked();
    });
  });

  // Bonus: redirect when no session
  describe("Sesijos patikra", () => {
    it("nukreipia į /login, kai sesijos nėra", async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await act(async () => {
        render(<SettingsPage />);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });
  });
});
