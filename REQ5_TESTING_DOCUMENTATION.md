# REQ-5: Alergijų ir Dietų Pasirinkimas Profilyje - Testavimo Dokumentacija

## 📋 Apžvalga

Sukurta komprehensyvi testavimo sistema pagal testavimo planą (5 pagrindiniai test case'ai: KAN-T51 iki KAN-T55). Testai apima:

- **Unit testus** - Settings puslapis ir checkbox'ų elgesys
- **Integraciją testus** - OpenAI API integracija su preferences
- **E2E testus** - Pilna user journey nuo Settings iki Recipe Generation

---

## 📁 Sukurti Test Failai

### 1. **`src/__tests__/REQ5-allergies-diets.test.tsx`**

Pagrindinis unit test failas su 5 test case'ais iš testavimo plano.

#### Aprašymas:

- **Failas**: `src/__tests__/REQ5-allergies-diets.test.tsx`
- **Linijas kodo**: ~700+
- **Sąlyga**: Veikia su localStorage mock'u ir fetch mock'u

#### Test Case'ai (KAN-T51 iki KAN-T55):

#### 🟩 KAN-T51: Alergijų ir Dietų Sąrašo Atvaizdavimas

- ✅ Sekcija matoma ir rodo atskirus sąrašus
- ✅ Checkboxai atvaizduojami checkbox formatu
- ✅ Checkboxai pagal nutylėjimą nepažymėti
- **Equivalence Partitioning**:
  - Nepasirinkus nieko (tuščia būsena)
  - Pasirinkus viena elementą
  - Pasirinkus kelis elementus

#### 🟩 KAN-T52: Išsaugojimas ir Išlaikymas Po Perkrovimo

- ✅ Žingsnis 1: Pažymėti checkbox'ai
- ✅ Žingsnis 2: Sėkmės pranešimas rodomas
- ✅ Žingsnis 3: Po perkrovimo išlieka pažymėti
- ✅ Žingsnis 4: Atžymėti checkboxai lieka atžymėti

#### 🟩 KAN-T53: Recepto Generavimas su Filtramis

- ✅ Ingredientai sėkmingai pridėti
- ✅ Generavimas pradedamas su preferencijomis
- ✅ Recepte nėra draudžiamų produktų
- ✅ Toliau veikia su kitais generavimais

#### 🟩 KAN-T54: Redagavimas ir Momentinis Įsigaliojimas

- ✅ Baseline - receptas su draudžiamais ingredientais
- ✅ Po nustatymo pasikeitimo - jie nebepateks
- ✅ Naujas receptas respektuoja naujas preferencijas

#### 🟩 KAN-T55: Loginio Konflikto Valdymas

- ✅ Vartotojas turi alergiją ir ingredientą
- ✅ AI ignoruoja draudžiamą ingredientą
- ✅ Alternatyvus receptas sugeneruojamas
- **Adicionalūs Edge Case'ai**:
  - Kelios alergijos ir dietos
  - Tuščias ingredientų sąrašas
  - Kelios dietos vienu metu

#### Papildomi Black Box Testai:

- ✅ Receptų filtravimas pagal pavadinimą
- ✅ Preferencijos iš localStorage
- ✅ Išsaugojimas su tuščiais pasirinkimais

---

### 2. **`src/__tests__/integration/req5-settings-recipe-integration.test.ts`**

Integration test failas - OpenAI API integracija.

#### Aprašymas:

- **Failas**: `src/__tests__/integration/req5-settings-recipe-integration.test.ts`
- **Linijas kodo**: ~500+
- **Sąlyga**: Mocked OpenAI API

#### Test Grupės:

#### A. Integration: Settings with Recipe Generation

- ✅ Alergija pridedama prie prompt'o su "DRAUDŽIAMA"
- ✅ Dieta pridedama prie prompt'o su "TURI ATITIKTI"
- ✅ Kelios alergijos ir dietos - visos pridedamos
- ✅ Be preferencijų - prompt'e jų nėra
- ✅ Po preferencijų atnaujinimo - naujas receptas su naujais filtramis

#### B. Integration: Preference Persistence

- ✅ Pilna workflow - nuo Settings iki Recipe API
- ✅ Tuščios preferencijos - receptai generuojami be filtro
- ✅ Prompt'as formavimas (ingredientai + alergijos + dietos)

#### C. Edge Cases: Conflicts and Special Scenarios

- ✅ Draudžiamas produktas ingredientuose - AI jį eliminuoja
- ✅ Visos dietos atitinka (veganiška + be glitimo)
- ✅ Kelios alergijos - visos eliminuojamos
- ✅ Preferencijos išsaugojimas ir pakartotinis naudojimas

#### D. API Integration: Verify Prompt Format

- ✅ System prompt'as teisingas
- ✅ Prompt'o formavimas: ingredientai + alergijos + dietos

---

### 3. **`src/__tests__/integration/req5-homepage-settings-integration.test.tsx`**

E2E style test failas - pilna user journey.

#### Aprašymas:

- **Failas**: `src/__tests__/integration/req5-homepage-settings-integration.test.tsx`
- **Linijas kodo**: ~600+
- **Sąlyga**: Simuliuoja pilną user journey

#### Test Grupės:

#### A. KAN-T53: Recipe Generation with User Preferences (E2E Flow)

- ✅ Vartotojas su alergija ir veganiška dieta
- ✅ Preferencijų kaita - naujas receptas su naujomis
- ✅ Kompleksinės preferencijos
- ✅ Iš naujo naudojant - preferencijos lieka aktyvios

#### B. KAN-T54: Immediate Application of Settings Changes

- ✅ Keičiamas nustatymas ir iš kart veikia
- ✅ Kelis kartus iš eilės keičiant - kiekvienas pokytis atsispindi

#### C. KAN-T55: Conflict Handling - Ingredient in Allergies

- ✅ Vartotojas turi alergiją ir ingredientą
- ✅ Sistema tvarko - draudžiamas ingredientas iš recepte eliminuojamas
- ✅ Kelios alergijos - visos eliminuojamos

#### D. Data Persistence

- ✅ Išsaugoti preferencijos lieka po perkrovimo
- ✅ Tuščios preferencijos gali būti išsaugotos

---

## 🔍 Testavimo Sąlygos (Mocks)

### localStorage Mock

```javascript
localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify({
    allergies: ["Pienas", "Kiaušiniai"],
    diets: ["Veganiška"],
  }),
);
```

### fetch Mock

- Simuliuoja `/api/user/preferences` endpoint'ą
- POST - išsaugo preferencijas
- GET - grąžina išsaugotas preferencijas

### Supabase Mock

- `getSession()` - grąžina test sesijas su access token'u

### generateRecipes Mock

- Leidžia kontroliuoti atsakymą per `mockResolvedValueOnce()`
- Verifuoja keičiant parametrus

---

## 📊 Test Coverage

### Sudengtų Scenarijų:

| Test Case     | Linijų | Aprašymas                                         |
| ------------- | ------ | ------------------------------------------------- |
| KAN-T51       | ~80    | Checkbox atvaizdavimas + Equivalence Partitioning |
| KAN-T52       | ~120   | Išsaugojimas ir perkrovimas                       |
| KAN-T53       | ~100   | API integracija                                   |
| KAN-T54       | ~80    | Momentinis įsigaliojimas                          |
| KAN-T55       | ~150   | Edge cases ir konfliktai                          |
| **Papildomi** | ~200+  | Black box + integracija + E2E                     |
| **IŠ VISO**   | ~1800+ | Komprehensyvi aprėptis                            |

---

## 🚀 Kaip Paleisti Testus

### Visi REQ-5 Testai:

```bash
npm test -- REQ5-allergies-diets.test.tsx
npm test -- req5-settings-recipe-integration.test.ts
npm test -- req5-homepage-settings-integration.test.tsx
```

### Tik vienas test case:

```bash
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T51"
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T52"
```

### Su coverage:

```bash
npm test -- REQ5-allergies-diets.test.tsx --coverage
```

---

## 📝 Test Scenarijų Sąrašas

### Testavimo Technikos:

1. **Black Box Testing** - Nežinant vidinio kodo
2. **Equivalence Partitioning** - Skirtingos klasės (0, 1, N elementų)
3. **Error Guessing** - Edge cases (alergija + ingredientas)
4. **Integration Testing** - Tarp komponentų
5. **E2E Testing** - Pilnas workflow

### Aprėptos Scenarijų:

- ✅ Alergijų ir dietų atvaizdavimas
- ✅ Išsaugojimas ir persistencija
- ✅ Perkrovimas - duomenų laikymas
- ✅ Receptų generavimas su filtramis
- ✅ Preferencijų atnaujinimas
- ✅ Tūkstančių filtramis kombinacijos
- ✅ Konfliktai - vartotojas su alerginiu ingredientu
- ✅ Tuščios būsenos
- ✅ localStorage fallback
- ✅ Prompt'o formavimas API

---

## 💡 Svarbi Informacija

### Numatyti Mockavimo Scenarijai:

1. **Demo režimas** - localStorage naudojimas
2. **Production režimas** - Supabase API
3. **OpenAI API** - gpt-4o-mini modelis

### Testavimo Aplinka:

- Jest + React Testing Library
- TypeScript
- Mocked Supabase ir OpenAI

### Papildomi Smulkmenys:

- Testai veikia nepriklausomai vienas nuo kito (`beforeEach`)
- Kiekvienas testas išvaloma localStorage
- Mock'ai iš naujo inicijuojami prieš kiekvieną testą

---

## ✅ Sudengtų Acceptance Criteria:

- **AC-1** ✓ - Checkboxes are shown (KAN-T51)
- **AC-2** ✓ - Saving works and persists (KAN-T52)
- **AC-3** ✓ - Preferences load and apply to recipes (KAN-T53, KAN-T54)
- **Edge Cases** ✓ - Conflict handling (KAN-T55)

---

## 📌 Sąrašas Visuose Test Failuose

| Failas                                      | Test Case'ai                        | Linijos |
| ------------------------------------------- | ----------------------------------- | ------- |
| REQ5-allergies-diets.test.tsx               | KAN-T51, T52, T53, T54, T55 + extra | ~700    |
| req5-settings-recipe-integration.test.ts    | Integration + API                   | ~500    |
| req5-homepage-settings-integration.test.tsx | E2E + DataPersistence               | ~600    |

---

## 📚 Nuorodos

- Testavimo Planas: REQ-5
- Komponenatlai: SettingsPage, HomePage, IngredientInput
- API Routes: `/api/user/preferences`
- Funkcijos: `generateRecipes()`, `loadPreferences()`

---

**Paruošta**: 2026-05-25  
**Statusas**: ✅ Visi testai sukurti ir dokumentuoti
