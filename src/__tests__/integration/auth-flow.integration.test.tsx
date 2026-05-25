/**
 * Integraciniai testai: Autentifikacijos srautas
 *
 * Testuoja dviejų lygių sąveiką:
 *   1. UI lygis   — forma (LoginPage / RegisterPage)
 *   2. Servisų lygis — Supabase auth (supabase.auth.signIn / signUp)
 *
 * El. pašto patvirtinimas IŠJUNGTAS Supabase projekte.
 */

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 1 integracinis testas: Prisijungimo srautas (UI → Supabase auth → navigacija)
// ---------------------------------------------------------------------------
describe("Integracinis testas 1: Prisijungimo srautas", () => {
  it("1 atvejis: sėkmingas prisijungimas — forma iškviečia auth servisą ir nukreipia į pagrindinį puslapį", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    render(<LoginPage />);

    // UI lygis: vartotojas užpildo formą
    fireEvent.change(screen.getByLabelText(/el\. paštas/i), {
      target: { value: "test@test.lt" },
    });
    fireEvent.change(screen.getByLabelText(/slaptažodis/i), {
      target: { value: "Testas1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

    // Servisų lygis: Supabase auth iškviestas su teisingais duomenimis
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@test.lt",
        password: "Testas1!",
      })
    );

    // Navigacijos lygis: po sėkmingo prisijungimo nukreipiama į "/"
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("2 atvejis: neteisingi duomenys — auth servisas grąžina klaidą, UI parodo lietuvišką pranešimą", async () => {
    mockSignIn.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    render(<LoginPage />);

    // UI lygis: vartotojas įveda blogus duomenis
    fireEvent.change(screen.getByLabelText(/el\. paštas/i), {
      target: { value: "blogas@test.lt" },
    });
    fireEvent.change(screen.getByLabelText(/slaptažodis/i), {
      target: { value: "Blogas1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

    // Servisų lygis: Supabase auth iškviestas
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));

    // UI lygis: klaida iš servisų lygio paverčiama į lietuvišką pranešimą
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Neteisingas el. paštas arba slaptažodis."
      )
    );

    // Navigacijos lygis: nukreipimo neįvyksta
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2 integracinis testas: Registracijos srautas (UI validacija → Supabase auth)
// ---------------------------------------------------------------------------
describe("Integracinis testas 2: Registracijos srautas (be el. pašto patvirtinimo)", () => {
  it("1 atvejis: sėkminga registracija — validacija praeina, auth servisas iškviestas, rodoma sėkmės būsena", async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    render(<RegisterPage />);

    // UI lygis: vartotojas užpildo visus laukus su tinkamais duomenimis
    fireEvent.change(screen.getByLabelText(/el\. paštas/i), {
      target: { value: "naujas@test.lt" },
    });
    fireEvent.change(screen.getByLabelText(/^slaptažodis$/i), {
      target: { value: "Naujas1!" },
    });
    fireEvent.change(screen.getByLabelText(/pakartokite/i), {
      target: { value: "Naujas1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

    // Servisų lygis: Supabase signUp iškviestas su teisingais duomenimis
    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "naujas@test.lt",
        password: "Naujas1!",
      })
    );

    // UI lygis: po sėkmingos registracijos rodoma patvirtinimo būsena
    await waitFor(() =>
      expect(screen.getByText(/patikrinkite el\. paštą/i)).toBeInTheDocument()
    );

    // Supabase iškviestas tik vieną kartą
    expect(mockSignUp).toHaveBeenCalledTimes(1);
  });

  it("2 atvejis: kliento validacija sustabdo užklausą — Supabase auth neiškviestas kai slaptažodis neatitinka reikalavimų", async () => {
    render(<RegisterPage />);

    // UI lygis: slaptažodis be specialaus simbolio
    fireEvent.change(screen.getByLabelText(/el\. paštas/i), {
      target: { value: "test@test.lt" },
    });
    fireEvent.change(screen.getByLabelText(/^slaptažodis$/i), {
      target: { value: "Slaptazodis1" },
    });
    fireEvent.change(screen.getByLabelText(/pakartokite/i), {
      target: { value: "Slaptazodis1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

    // UI validacijos lygis: klaida rodoma prieš pasiekiant servisų lygį
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("specialų simbolį")
    );

    // Servisų lygis: Supabase auth NEiškviestas — validacija sustabdė srautą
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
