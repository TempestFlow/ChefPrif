"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChefHat, AlertCircle, MailCheck } from "lucide-react";

function translateAuthError(message: string): string {
  if (message.includes("User already registered")) return "Šis el. paštas jau užregistruotas.";
  if (message.includes("already registered")) return "Šis el. paštas jau užregistruotas.";
  if (message.includes("Password should be at least")) return "Slaptažodis turi būti bent 6 simbolių.";
  if (message.includes("Unable to validate email")) return "Neteisingas el. pašto formatas.";
  if (message.includes("invalid email")) return "Neteisingas el. pašto formatas.";
  if (message.includes("Too many requests")) return "Per daug bandymų. Palaukite ir bandykite vėliau.";
  if (message.includes("rate limit")) return "Per daug bandymų. Palaukite ir bandykite vėliau.";
  if (message.includes("Email rate limit")) return "Viršyta el. pašto siuntimo riba. Bandykite vėliau.";
  if (message.includes("Signups not allowed")) return "Registracija šiuo metu išjungta.";
  if (message.includes("not allowed")) return "Registracija šiuo metu išjungta.";
  if (message.includes("weak password") || message.includes("Password")) return "Slaptažodis per silpnas.";
  return `Registracijos klaida: ${message}`;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-muted)]/70 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Slaptažodžiai nesutampa.");
      return;
    }

    if (password.length < 6) {
      setError("Slaptažodis turi būti bent 6 simbolių.");
      return;
    }

    if (password.length > 30) {
      setError("Slaptažodis negali būti ilgesnis nei 30 simbolių.");
      return;
    }

    if (password.toLowerCase() == password) {
      setError("Slaptažodis turi turėti bent 1 didžiąją raidę.");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError("Slaptažodis turi turėti bent vieną specialų simbolį (pvz. !@#$%).");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(translateAuthError(error.message));
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <span
            className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--secondary-soft)] text-[var(--secondary)]"
            aria-hidden
          >
            <MailCheck size={28} />
          </span>
          <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
            Patikrinkite el. paštą
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Išsiuntėme patvirtinimo nuorodą į <strong className="text-[var(--ink)]">{email}</strong>.
            Paspauskite joje esančią nuorodą, kad aktyvuotumėte paskyrą.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            ← Grįžti į prisijungimą
          </Link>
        </div>
      </div>
    );
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
            Sukurkite naują paskyrą
          </p>
        </div>

        <form
          onSubmit={handleRegister}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-[var(--ink)]"
            >
              Pakartokite slaptažodį
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "Kuriama paskyra..." : "Registruotis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Jau turite paskyrą?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            Prisijungti
          </Link>
        </p>
      </div>
    </div>
  );
}
