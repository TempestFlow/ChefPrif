"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, AlertCircle } from "lucide-react";

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Neteisingas el. paštas arba slaptažodis.";
  if (message.includes("Email not confirmed")) return "El. paštas nepatvirtintas. Patikrinkite savo paštą.";
  if (message.includes("Too many requests")) return "Per daug bandymų. Palaukite ir bandykite vėliau.";
  if (message.includes("User not found")) return "Toks vartotojas nerastas.";
  return "Prisijungimo klaida. Bandykite dar kartą.";
}

const fieldClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-muted)]/70 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(translateAuthError(error.message));
      setIsLoading(false);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]"
            aria-hidden
          >
            <ChefHat size={26} />
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
            Fridge Chef
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Prisijunkite prie paskyros
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_2px_12px_rgba(166,124,82,0.06)]"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[var(--ink)]"
            >
              El. paštas
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="jusu@pastas.lt"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[var(--ink)]"
            >
              Slaptažodis
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-[var(--primary)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
              isLoading
                ? "cursor-not-allowed bg-[var(--border)] text-[var(--ink-muted)]"
                : "bg-[var(--primary)] text-white shadow-[0_4px_14px_rgba(198,107,61,0.25)] hover:bg-[var(--primary-hover)] active:translate-y-px"
            }`}
          >
            {isLoading ? "Jungiamasi..." : "Prisijungti"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Neturite paskyros?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            Registruotis
          </Link>
        </p>
      </div>
    </div>
  );
}
