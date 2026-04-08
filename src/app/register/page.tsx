"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">📧</div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Patikrinkite el. paštą
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Išsiuntėme patvirtinimo nuorodą į <strong>{email}</strong>.
            Paspauskite joje esančią nuorodą, kad aktyvuotumėte paskyrą.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
          >
            Grįžti į prisijungimą
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            🍳 Fridge Chef
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sukurkite naują paskyrą
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="jusu@pastas.lt"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              isLoading
                ? "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
            }`}
          >
            {isLoading ? "Kuriama paskyra..." : "Registruotis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Jau turite paskyrą?{" "}
          <Link
            href="/login"
            className="font-medium text-green-600 hover:text-green-700 dark:text-green-400"
          >
            Prisijungti
          </Link>
        </p>
      </div>
    </div>
  );
}
