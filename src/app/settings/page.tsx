"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ALLERGIES, DIETS } from "@/data/preferences";
import { EMPTY_PREFERENCES, UserPreferences } from "@/types/preferences";

const isDemo =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://demo.supabase.co";

const LOCAL_STORAGE_KEY = "userPreferences";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "success"; text: string } | { kind: "error"; text: string };

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserEmail(data.session.user.email ?? null);

      const prefs = await loadPreferences(data.session.access_token);
      setAllergies(prefs.allergies);
      setDiets(prefs.diets);
      setIsLoading(false);
    }
    init();
  }, [router]);

  async function loadPreferences(accessToken: string): Promise<UserPreferences> {
    if (isDemo) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UserPreferences) : EMPTY_PREFERENCES;
      } catch {
        return EMPTY_PREFERENCES;
      }
    }
    try {
      const response = await fetch("/api/user/preferences", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return EMPTY_PREFERENCES;
      const data = await response.json();
      return {
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        diets: Array.isArray(data.diets) ? data.diets : [],
      };
    } catch {
      return EMPTY_PREFERENCES;
    }
  }

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSave() {
    setStatus({ kind: "saving" });

    if (isDemo) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ allergies, diets }));
        setStatus({ kind: "success", text: "Preferencijos išsaugotos (Demo režimas)." });
      } catch {
        setStatus({ kind: "error", text: "Nepavyko išsaugoti į vietinę saugyklą." });
      }
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ allergies, diets }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Nepavyko išsaugoti preferencijų.");
      }
      // Atnaujinti ir vietinę saugyklą, kad pagrindinis puslapis matytų pakeitimus.
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ allergies, diets }));
      } catch {
        // ignoruoti
      }
      setStatus({ kind: "success", text: "Preferencijos išsaugotos." });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Nepavyko išsaugoti preferencijų.";
      setStatus({ kind: "error", text });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-8">
        <div className="mb-8 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">⚙️ Nustatymai</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pasirinkite alergijas ir dietas — į jas bus atsižvelgta generuojant receptus.
            </p>
          </div>
          <div className="text-right">
            {userEmail && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-35">{userEmail}</p>
            )}
            <Link
              href="/"
              className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              ← Grįžti į pradžią
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Įkeliama...</p>
        ) : (
          <div className="space-y-8">
            <fieldset className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <legend className="px-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Alergijos
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ALLERGIES.map((allergy) => {
                  const checked = allergies.includes(allergy);
                  return (
                    <label
                      key={allergy}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(allergies, setAllergies, allergy)}
                        className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500 dark:border-zinc-600"
                      />
                      <span>{allergy}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <legend className="px-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Dietos
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DIETS.map((diet) => {
                  const checked = diets.includes(diet);
                  return (
                    <label
                      key={diet}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(diets, setDiets, diet)}
                        className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500 dark:border-zinc-600"
                      />
                      <span>{diet}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={status.kind === "saving"}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
                  status.kind === "saving"
                    ? "cursor-not-allowed bg-gray-400 text-gray-200 dark:bg-gray-600 dark:text-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                }`}
              >
                {status.kind === "saving" ? "Saugoma..." : "Išsaugoti"}
              </button>

              {status.kind === "success" && (
                <p className="text-sm text-green-600 dark:text-green-400" role="status">
                  {status.text}
                </p>
              )}
              {status.kind === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {status.text}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
