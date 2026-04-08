import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation (not used in register but Link needs it)
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock supabase
const mockSignUp = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

import RegisterPage from "@/app/register/page";

beforeEach(() => {
  jest.clearAllMocks();
});

function fillForm(email: string, password: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText(/el\. paštas/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^slaptažodis$/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/pakartokite/i), { target: { value: confirmPassword } });
}

describe("RegisterPage", () => {
  describe("Renderinimas", () => {
    it("rodo registracijos formą", () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/el\. paštas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^slaptažodis$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pakartokite/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /registruotis/i })).toBeInTheDocument();
    });

    it("rodo nuorodą į prisijungimą", () => {
      render(<RegisterPage />);
      expect(screen.getByRole("link", { name: /prisijungti/i })).toBeInTheDocument();
    });
  });

  describe("Kliento pusės validacija", () => {
    it("rodo klaidą kai slaptažodžiai nesutampa", async () => {
      render(<RegisterPage />);
      fillForm("test@test.lt", "slaptazodis1", "slaptazodis2");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("Slaptažodžiai nesutampa.")
      );
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("rodo klaidą kai slaptažodis per trumpas", async () => {
      render(<RegisterPage />);
      fillForm("test@test.lt", "abc", "abc");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("bent 6 simbolių")
      );
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("rodo klaidą kai slaptažodis neturi specialaus simbolio", async () => {
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1", "Slaptazodis1");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("specialų simbolį")
      );
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("leidžia registruotis kai slaptažodis turi specialų simbolį", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    });
  });

  describe("Sėkminga registracija", () => {
    it("rodo el. pašto patvirtinimo pranešimą po sėkmingos registracijos", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByText(/patikrinkite el\. paštą/i)).toBeInTheDocument()
      );
    });

    it("parodo vartotojo el. paštą patvirtinimo pranešime", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });
      render(<RegisterPage />);
      fillForm("mano@pastas.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByText("mano@pastas.lt")).toBeInTheDocument()
      );
    });

    it("rodo 'Kuriama paskyra...' kol vyksta užklausa", async () => {
      mockSignUp.mockImplementation(() => new Promise(() => {}));
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /kuriama paskyra/i })).toBeDisabled()
      );
    });
  });

  describe("Serverio klaidos pranešimai", () => {
    it("rodo klaidą kai el. paštas jau užregistruotas", async () => {
      mockSignUp.mockResolvedValueOnce({ error: { message: "User already registered" } });
      render(<RegisterPage />);
      fillForm("egzistuoja@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("jau užregistruotas")
      );
    });

    it("rodo klaidą per daug bandymų", async () => {
      mockSignUp.mockResolvedValueOnce({ error: { message: "Too many requests" } });
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("Per daug bandymų")
      );
    });

    it("rodo bendrą klaidą nežinomai klaidai", async () => {
      mockSignUp.mockResolvedValueOnce({ error: { message: "Unknown server error" } });
      render(<RegisterPage />);
      fillForm("test@test.lt", "Slaptazodis1!", "Slaptazodis1!");
      fireEvent.submit(screen.getByRole("button", { name: /registruotis/i }).closest("form")!);

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent("Registracijos klaida")
      );
    });
  });
});
