import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock supabase
const mockSignIn = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    },
  },
}));

import LoginPage from "@/app/login/page";

beforeEach(() => {
  jest.clearAllMocks();
});

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/el\. paštas/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/slaptažodis/i), { target: { value: password } });
}

describe("LoginPage", () => {
  describe("Renderinimas", () => {
    it("rodo prisijungimo formą", () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/el\. paštas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slaptažodis/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /prisijungti/i })).toBeInTheDocument();
    });

    it("rodo nuorodą į registraciją", () => {
      render(<LoginPage />);
      expect(screen.getByRole("link", { name: /registruotis/i })).toBeInTheDocument();
    });
  });

  describe("Sėkmingas prisijungimas", () => {
    it("nukreipia į pagrindinį puslapį po sėkmingo prisijungimo", async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });
      render(<LoginPage />);
      fillForm("test@test.lt", "slaptazodis");
      fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
    });

    it("rodo 'Jungiamasi...' kol vyksta užklausa", async () => {
      mockSignIn.mockImplementation(() => new Promise(() => {}));
      render(<LoginPage />);
      fillForm("test@test.lt", "slaptazodis");
      fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /jungiamasi/i })).toBeDisabled()
      );
    });
  });

  describe("Klaidos pranešimai", () => {
    it("rodo lietuvišką klaidą kai neteisingi duomenys", async () => {
      mockSignIn.mockResolvedValueOnce({ error: { message: "Invalid login credentials" } });
      render(<LoginPage />);
      fillForm("test@test.lt", "blogasslaptazodis");
      fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("Neteisingas el. paštas arba slaptažodis.")
      );
    });

    it("rodo lietuvišką klaidą kai el. paštas nepatvirtintas", async () => {
      mockSignIn.mockResolvedValueOnce({ error: { message: "Email not confirmed" } });
      render(<LoginPage />);
      fillForm("test@test.lt", "slaptazodis");
      fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("El. paštas nepatvirtintas")
      );
    });

    it("rodo bendrą klaidą nežinomai klaidai", async () => {
      mockSignIn.mockResolvedValueOnce({ error: { message: "Unknown error" } });
      render(<LoginPage />);
      fillForm("test@test.lt", "slaptazodis");
      fireEvent.submit(screen.getByRole("button", { name: /prisijungti/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("Prisijungimo klaida")
      );
    });

    it("nerodo klaidos kai forma dar nepateikta", () => {
      render(<LoginPage />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
