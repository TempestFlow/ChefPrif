# CLAUDE.md — Fridge Chef Project Context

## Projekto apžvalga

**Fridge Chef** — receptų generatorius, kuris pagal vartotojo turimus ingredientus sugeneruoja receptus naudojant OpenAI API, sudaro trūkstamų ingredientų pirkinių sąrašą ("shopping list") ir apskaičiuoja kalorijų kiekį. Tikslas — mažinti maisto švaistymą ir skatinti gaminimą namuose.

**Universitetas:** VILNIUS TECH, Informacinių sistemų katedra.
**Dalykas:** Programų kūrimo procesas. Dėstytoja — doc. Dr. Asta Slotkienė.
**Komanda:** Prif-23/1 grupė, 4 nariai — Evald German, Naglis Butkevičius, Augustas Ilgis, Romuald Chatkevič.

## Technologijų stack'as

- **Framework:** Next.js (App Router, full-stack — vienas projektas frontendui ir backendui)
- **Kalba:** TypeScript
- **Frontend:** React 19 + Tailwind CSS 4
- **Backend:** Next.js API Routes (`src/app/api/`)
- **Duomenų bazė:** PostgreSQL per Supabase su Prisma ORM (MVP etape naudojami mock duomenys)
- **AI:** OpenAI API (gpt-4o-mini) su JSON structured output
- **Autentifikacija:** Supabase Auth (Google OAuth, email) — dar neimplementuota
- **Hostingas:** Vercel (frontend + API) + Supabase (DB + auth)
- **Testavimas:** Jest 30 + React Testing Library + jest-environment-jsdom
- **IDE:** Visual Studio Code

## Architektūra — Sluoksniuotas monolitas (Layered Monolith)

Visas kodas vienoje repozitorijoje, logiškai padalintas į 3 sluoksnius:

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # GUI sluoksnis — pagrindinis puslapis
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Tailwind stiliai
│   └── api/                # Verslo logikos sluoksnis (API Routes)
│       └── generate-recipe/  # (bus REQ-2)
├── components/             # GUI sluoksnis — React komponentai
│   ├── IngredientInput.tsx # Ingrediento įvedimas su autocomplete
│   └── IngredientList.tsx  # Pridėtų ingredientų atvaizdavimas
├── data/                   # Duomenų sluoksnis (mock, vėliau Prisma)
│   └── ingredients.ts      # Mock ingredientų sąrašas + filterIngredients()
└── __tests__/              # Testai
    ├── ingredients.test.ts         # Unit testai duomenų logikai
    └── IngredientInput.test.tsx    # Komponentų testai
```

### Sluoksnių atsakomybės

1. **GUI (Presentation):** React komponentai (`src/components/`), puslapiai (`src/app/page.tsx`). Atsakingi tik už UI — ką vartotojas mato ir su kuo sąveikauja.
2. **Verslo logika (Business Logic):** Next.js API Routes (`src/app/api/`), utility funkcijos. Tvarko OpenAI API bendravimą, duomenų validaciją, verslo taisykles.
3. **Duomenų sluoksnis (Data):** `src/data/` — dabar mock duomenys, ateityje Prisma ORM modeliai ir Supabase PostgreSQL.

## Nefunkciniai reikalavimai (ISO 25010)

| NFR | Metrika | Tikslas |
|-----|---------|---------|
| Performance Efficiency (Time Behaviour) | AI užklausos atsako laikas | ≤ 8 sekundžių |
| Performance Efficiency (Time Behaviour) | DB operacijos | ≤ 1 sekundė |
| Flexibility (Scalability) | Vienalaikiai vartotojai | ≥ 100 |
| Maintainability (Testability) | Verslo logikos unit test coverage | ≥ 90% |
| Reliability (Availability) | Sistemos pasiekiamumas per mėnesį | ≥ 99% |

## Reikalavimai (REQ)

### Evald German
- **REQ-1:** ✅ Ingrediento pridėjimas su autocomplete validacija — IMPLEMENTUOTA
  - Autocomplete dropdown nuo 2 raidžių
  - Pasirinkimas tik iš sąrašo, "Pridėti" mygtukas neaktyvus be pasirinkimo
  - Klaidos pranešimas kai ingredientas nerastas
  - Laukelis išvalomas po pridėjimo
- **REQ-2:** Ingredientų siuntimas į OpenAI API (gpt-4o-mini) receptų generavimui
  - Task 2.1 (Data): Recepto TypeScript interface (title, servings, ingredients[], steps[], missing_ingredients[], estimated_calories)
  - Task 2.2 (Logic): API route `/api/generate-recipe` — priima ingredientus, siunčia OpenAI, grąžina JSON
  - Task 2.3 (GUI): "Ieškoti receptų" mygtukas su loading būsena
- **REQ-3:** Recepto išsaugojimas į Supabase PostgreSQL
  - Task 3.1 (Data): saved_recipes lentelė su UNIQUE constraint (user_id, title)
  - Task 3.2 (Logic): POST `/api/recipes/save`
  - Task 3.3 (GUI): Širdelės ikonėlė recepto kortelėje
- **REQ-4:** Sistemos greitaveika — 8s timeout AI, 1s DB operacijos, loading indikatorius

### Augustas Ilgis
- **REQ-5:** Alergijų ir dietų pasirinkimas profilyje (JSONB preferencijos)
- **REQ-6:** Trūkstamų ingredientų eksportas į clipboard
- **REQ-7:** Sugeneruotų receptų istorijos langas (paskutiniai 10)
- **REQ-8:** Responsive dizainas nuo 360px

### Naglis Butkevičius
- **REQ-9:** Recepto vaizdavimas (pavadinimas, ingredientai, žingsniai, kalorijos)
- **REQ-10:** Sugeneruotų receptų sąrašas iš OpenAI atsakymo
- **REQ-11:** Naujų receptų generavimas (nesikartojantys)
- **REQ-12:** Receptų tikslumas (ingredientų ≥85%, kalorijų ≥80%)

### Romuald Chatkevič
- Reikalavimai dar nepateikti

## Git strategija

- **Repozitorija:** https://github.com/TempestFlow/ChefPrif (privati)
- **Šakų modelis:** Modifikuotas Git Flow
  - `main` — produkcinė versija, tik stabilus kodas
  - `develop` — integracinė šaka, visos feature šakos jungiamos čia
  - `feature/REQ-X-trumpas-aprašymas` — kiekvieno nario darbo šaka
- **Merge taisyklės:** Pull Request privalomas prieš merge į develop, bent 1 code review
- **Commit formatas:** Conventional Commits — `feat:`, `fix:`, `test:`, `docs:` su `[REQ-X]` nuoroda
  - Pvz.: `feat: [REQ-1] ingrediento pridėjimas su autocomplete validacija`
  - Pvz.: `test: [REQ-1] unit testai filterIngredients funkcijai`

## Testavimo konvencijos

- **Framework:** Jest 30 + React Testing Library
- **Konfigūracija:** `jest.config.js` su `next/jest` wrapper
- **Setup:** `jest.setup.ts` importuoja `@testing-library/jest-dom`
- **Testų vieta:** `src/__tests__/` katalogas
- **Testų failų pavadinimas:** `[ComponentName].test.tsx` arba `[moduleName].test.ts`
- **Paleidimas:** `npm test` (visi testai), `npm run test:coverage` (su coverage ataskaita)
- **Coverage tikslas:** ≥90% verslo logikos (`src/data/`, `src/app/api/`)
- **Testavimo principai:**
  - Kiekvienas Acceptance Criteria turi bent vieną testą
  - Testai grupuojami pagal AC naudojant `describe` blokus
  - Mock funkcijos per `jest.fn()`
  - Komponentų testai simuliuoja vartotojo veiksmus (`fireEvent`)

## Kodo stilius ir konvencijos

- TypeScript strict mode
- Tailwind CSS utility klases (ne custom CSS)
- "use client" direktyva komponentams su React hooks
- Komponentai — funkciniai su hooks (ne klasės)
- Props per TypeScript interfaces
- Failų struktūra: vienas komponentas per failą
- Lietuviški UI tekstai (pranešimai, labels)
- Komentarai kode gali būti anglų arba lietuvių kalba

## Dabartinė būsena

- ✅ Projektas inicializuotas (Next.js + TypeScript + Tailwind + Jest)
- ✅ REQ-1 implementuotas su 18 testų (visi PASS)
- ⏳ REQ-2 – REQ-12 laukia implementacijos
- ⏳ Supabase integracija (naudojami mock duomenys)
- ⏳ OpenAI API integracija

## Svarbios pastabos

- Komanda mokosi nuo pagrindų — kodas turi būti aiškus ir paprastas
- MVP pirma, optimizacija vėliau
- Mock duomenys naudojami vietoj tikros DB kol kas
- Kiekvienas komandos narys atsako už savo REQ implementaciją ir testus
- Gynimo metu reikia gebėti paaiškinti kiekvieną kodo eilutę
