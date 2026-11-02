# ChefPrif – kodo kokybės suvestinė

Commit: `d000a27` (2026-06-02), šaka `develop`. Sugeneruota: 2026-11-02 13:49 UTC.

Įrankiai: node v24.20.0, eslint 9.39.4, typescript 5.9.3, jest 30.3.0, fta 3.1.0, jscpd 4.3.0, lizard 1.24.3.

## Dydis

| Rodiklis | Reikšmė |
| --- | --- |
| Produkcinio kodo failai | 24 |
| Fizinės eilutės (produkcinis kodas) | 2612 |
| NLOC (lizard, be tuščių eilučių ir komentarų) | 2244 |
| Funkcijos | 111 |
| Vidutinis funkcijos NLOC | 16,4 |
| Testų failai / eilutės | 14 / 2342 |

## Ciklomatinis sudėtingumas

lizard: vidutinis CCN 3,2, didžiausias 18; ribą 10 viršija 7 funkcijos. ESLint `complexity`: ribą viršija 8 funkcijos.

| CCN intervalas (lizard) | Funkcijų |
| --- | --- |
| 1–5 | 88 |
| 6–10 | 16 |
| 11–20 | 7 |
| 21+ | 0 |

| Funkcija | Vieta | CCN (lizard) | CCN (ESLint) | NLOC | Ilgis (eil.) |
| --- | --- | --- | --- | --- | --- |
| `Home` | src/app/page.tsx:19 | 18 | 30 | 246 | 436 |
| `handleGenerateRecipes` | src/app/page.tsx:54 | 14 | 15 | 54 | 73 |
| `POST` | src/app/api/generate-recipe/route.ts:8 | 14 | 14 | 55 | 68 |
| `translateAuthError` | src/app/register/page.tsx:8 | 13 | 13 | 14 | 14 |
| `handleKeyDown` | src/components/IngredientInput.tsx:132 | 12 | 11 | 24 | 25 |
| `POST` | src/app/api/recipes/save/route.ts:6 | 11 | 11 | 77 | 94 |
| `HistoryPage` | src/app/history/page.tsx:33 | 11 | 11 | 85 | 177 |
| `IngredientInput` | src/components/IngredientInput.tsx:14 | 4 | 11 | 27 | 146 |

## Failų metrikos (FTA, lizard, Jest)

MI – palaikomumo indeksas (0–100, didesnis geriau): MI = max(0, (171 − 5,2·ln V − 0,23·CC − 16,2·ln LOC)·100/171); lygiai: < 10 žemas, 10–19 vidutinis, ≥ 20 aukštas. FTA įvertis – mažesnis geriau.

| Failas | NLOC | Funkc. | Maks. CCN | Cyclo | Halstead V | D | E | B | MI | FTA | Padengimas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| app/page.tsx | 416 | 23 | 30 | 57 | 8008 | 53,3 | 426896 | 2,67 | 7,5 (žemas) | 67,7 (Needs improvement) | 64,8 % |
| components/IngredientInput.tsx | 280 | 21 | 12 | 44 | 5491 | 54,5 | 299232 | 1,83 | 14,3 (vidutinis) | 61,7 (Needs improvement) | 63,5 % |
| app/settings/page.tsx | 198 | 11 | 9 | 24 | 3567 | 36,9 | 131491 | 1,19 | 21,6 (aukštas) | 56,8 (Could be better) | 66,2 % |
| app/history/page.tsx | 194 | 14 | 11 | 27 | 3169 | 35,4 | 112060 | 1,06 | 21,9 (aukštas) | 56,2 (Could be better) | 65,2 % |
| app/register/page.tsx | 189 | 3 | 13 | 23 | 2390 | 29,7 | 71064 | 0,8 | 23,2 (aukštas) | 56,2 (Could be better) | 92,5 % |
| components/RecipeCard.tsx | 135 | 7 | 6 | 11 | 1710 | 28,3 | 48341 | 0,57 | 29 (aukštas) | 53,3 (Could be better) | 82,6 % |
| app/login/page.tsx | 119 | 3 | 5 | 9 | 1278 | 18,6 | 23797 | 0,43 | 31,4 (aukštas) | 52,2 (Could be better) | 100 % |
| app/api/user/preferences/route.ts | 101 | 6 | 9 | 23 | 2336 | 38,5 | 89857 | 0,78 | 29,6 (aukštas) | 49,1 (OK) | 0 % |
| data/ingredients.ts | 89 | 2 | 2 | 2 | 734 | 4,2 | 3107 | 0,24 | 37,1 (aukštas) | 14,1 (OK) | 100 % |
| app/api/recipes/save/route.ts | 80 | 1 | 11 | 11 | 1208 | 15,9 | 19257 | 0,4 | 35,4 (aukštas) | 46,6 (OK) | 83,3 % |
| lib/generateRecipes.ts | 68 | 1 | 8 | 6 | 913 | 17,5 | 15941 | 0,3 | 38,8 (aukštas) | 46,9 (OK) | 100 % |
| app/api/generate-recipe/route.ts | 59 | 3 | 14 | 14 | 1134 | 20,6 | 23322 | 0,38 | 38,1 (aukštas) | 43,4 (OK) | 0 % |
| components/IngredientList.tsx | 56 | 4 | 2 | 2 | 358 | 15,7 | 5612 | 0,12 | 43,4 (aukštas) | 10,6 (OK) | 83,3 % |
| app/api/recipes/saved/route.ts | 50 | 1 | 5 | 5 | 735 | 7,8 | 5755 | 0,25 | 42,2 (aukštas) | 45,6 (OK) | 0 % |
| lib/recipeHistory.ts | 46 | 4 | 8 | 14 | 1116 | 19,5 | 21758 | 0,37 | 40,5 (aukštas) | 41,1 (OK) | 0 % |
| app/api/recipes/history/route.ts | 37 | 2 | 4 | 6 | 757 | 13,8 | 10438 | 0,25 | 44,8 (aukštas) | 41,1 (OK) | 0 % |
| app/layout.tsx | 32 | 1 | 1 | 1 | 308 | 8,9 | 2725 | 0,1 | 49,3 (aukštas) | 10,8 (OK) | 0 % |
| app/api/recipes/unsave/route.ts | 27 | 1 | 7 | 7 | 593 | 10,6 | 6262 | 0,2 | 48,4 (aukštas) | 36,9 (OK) | 0 % |
| data/preferences.ts | 22 | 2 | 1 | 1 | 260 | 8,2 | 2138 | 0,09 | 53,7 (aukštas) | 10,3 (OK) | 33,3 % |
| app/auth/callback/route.ts | 14 | 1 | 2 | 2 | 243 | 11,5 | 2783 | 0,08 | 58 (aukštas) | 9,9 (OK) | 0 % |

## Dubliavimas (jscpd)

Pasikartojančių fragmentų: 6. Unikalių pasikartojančių eilučių (abiejose kopijose): 242 iš 2612 (9,3 %). jscpd paties suvestinė: 153 iš 3351 eil. (4,57 %) – TSX failus jis skaičiuoja dviem formatais (tsx ir javascript), todėl vardiklis didesnis.

| Formatas | Eil. | Fragmentas A | Fragmentas B |
| --- | --- | --- | --- |
| javascript | 47 | src/app/login/page.tsx:62–108 | src/app/register/page.tsx:124–177 |
| tsx | 18 | src/app/login/page.tsx:40–57 | src/app/register/page.tsx:102–119 |
| tsx | 38 | src/app/login/page.tsx:58–95 | src/app/register/page.tsx:120–157 |
| tsx | 28 | src/app/login/page.tsx:95–122 | src/app/register/page.tsx:176–203 |
| tsx | 11 | src/app/history/page.tsx:40–50 | src/app/settings/page.tsx:24–35 |
| tsx | 17 | src/app/history/page.tsx:125–141 | src/app/settings/page.tsx:122–138 |

## Testai ir padengimas (Jest)

Testų rinkinių: 14, testų: 118, praėjo: 118, nepraėjo: 0.

| Matavimas | Failų | Sakiniai | Šakos | Funkcijos | Eilutės |
| --- | --- | --- | --- | --- | --- |
| Visi src failai | 21 | 52,5 % | 45,2 % | 58,5 % | 54,7 % |
| Numatytoji Jest konfigūracija (kaip CI) | 14 | 69,7 % | 60,7 % | 68,5 % | 72,6 % |
| Verslo logika (src/app/api/, src/data/) | 8 | 19 % | 16,5 % | 16,7 % | 17,5 % |

Failai be jokio padengimo (9): `src/app/layout.tsx`, `src/app/api/generate-recipe/route.ts`, `src/app/api/recipes/history/route.ts`, `src/app/api/recipes/saved/route.ts`, `src/app/api/recipes/unsave/route.ts`, `src/app/api/user/preferences/route.ts`, `src/app/auth/callback/route.ts`, `src/lib/recipeHistory.ts`, `src/lib/supabase.ts`.

## Statinė analizė

ESLint (projekto taisyklės, kaip `npm run lint`): klaidų – 14, įspėjimų – 5 (produkciniame kode 9, testuose 9, kituose failuose 1). Papildomai įjungta `complexity` riba 10: 8 įspėjimai. TypeScript (tsc --noEmit): klaidų – 0.

| ESLint taisyklė | Tipas | Produkcinis kodas | Testai | Kiti failai |
| --- | --- | --- | --- | --- |
| `@typescript-eslint/no-explicit-any` | klaida | 0 | 7 | 0 |
| `@typescript-eslint/no-unused-vars` | įspėjimas | 2 | 1 | 0 |
| `react-hooks/set-state-in-effect` | klaida | 3 | 0 | 0 |
| `@typescript-eslint/no-require-imports` | klaida | 0 | 1 | 1 |
| `react-hooks/immutability` | klaida | 2 | 0 | 0 |
| `react-hooks/exhaustive-deps` | įspėjimas | 1 | 0 | 0 |
| `jsx-a11y/role-has-required-aria-props` | įspėjimas | 1 | 0 | 0 |

| Failas:eilutė | Taisyklė | Pranešimas |
| --- | --- | --- |
| jest.config.js:1 | `@typescript-eslint/no-require-imports` | A `require()` style import is forbidden. |
| src/__tests__/HomePage.test.tsx:2 | `@typescript-eslint/no-unused-vars` | 'useRouter' is defined but never used. |
| src/__tests__/HomePage.test.tsx:34 | `@typescript-eslint/no-require-imports` | A `require()` style import is forbidden. |
| src/__tests__/save-recipe.test.ts:74 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:75 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:95 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:133 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:134 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:174 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/__tests__/save-recipe.test.ts:175 | `@typescript-eslint/no-explicit-any` | Unexpected any. Specify a different type. |
| src/app/api/recipes/saved/route.ts:34 | `@typescript-eslint/no-unused-vars` | 'request' is defined but never used. |
| src/app/history/page.tsx:50 | `react-hooks/immutability` | Cannot access variable before it is declared |
| src/app/history/page.tsx:51 | `react-hooks/immutability` | Cannot access variable before it is declared |
| src/app/page.tsx:151 | `@typescript-eslint/no-unused-vars` | 'err' is defined but never used. |
| src/app/page.tsx:221 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array. |
| src/components/IngredientInput.tsx:40 | `react-hooks/set-state-in-effect` | Calling setState synchronously within an effect can trigger cascading renders |
| src/components/IngredientInput.tsx:65 | `react-hooks/set-state-in-effect` | Calling setState synchronously within an effect can trigger cascading renders |
| src/components/IngredientInput.tsx:210 | `jsx-a11y/role-has-required-aria-props` | Elements with the ARIA role "combobox" must have the following attributes defined: aria-controls,aria-expanded |
| src/components/RecipeCard.tsx:19 | `react-hooks/set-state-in-effect` | Calling setState synchronously within an effect can trigger cascading renders |

## Priklausomybių pažeidžiamumai (npm audit)

| Priklausomybės | Kritiniai | Aukšti | Vidutiniai | Žemi | Iš viso |
| --- | --- | --- | --- | --- | --- |
| Visos | 2 | 11 | 33 | 4 | 50 |
| Tik produkcinės (--omit=dev) | 1 | 6 | 1 | 0 | 8 |


Produkcinių priklausomybių pažeidžiamumai:

| Paketas | Lygis | Tiesioginė | Pranešimų | Pavyzdžiai | Pataisyta versija |
| --- | --- | --- | --- | --- | --- |
| next | critical | taip | 39 | Next.js: HTTP request smuggling in rewrites; Next.js: Unbounded next/image disk cache growth can exhaust storage (+37) | next@16.4.4 |
| nanoid | high | ne | 3 | nanoid: non-secure generators can loop indefinitely with negative size; nanoid: custom generators can loop indefinitely when size is zero (+1) | taip |
| postcss | high | ne | 4 | PostCSS has XSS via Unescaped </style> in its CSS Stringify Output; PostCSS: Arbitrary file read and information disclosure via attacker-controlled sourceMappingURL in CSS comments (+2) | next@16.4.4 |
| sharp | high | ne | 3 | sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591; sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 (+1) | next@16.4.4 |
| source-map-js | high | ne | 1 | source-map-js allows event-loop denial of service through indexed source-map section offsets | taip |
| ws | high | ne | 2 | ws: Uninitialized memory disclosure; ws: Memory exhaustion DoS from tiny fragments and data chunks | taip |
| zod | high | ne | 1 | Zod can exhaust memory while validating oversized constrained collections | taip |
| baseline-browser-mapping | moderate | ne | 1 | baseline-browser-mapping process termination on invalid input causes denial of service | taip |

