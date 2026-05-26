# REQ-5 Testavimo Planų - Greita Nuoroda

## 🟩 KAN-T51: Alergijų ir Dietų Sąrašo Atvaizdavimas

**Failas**: `src/__tests__/REQ5-allergies-diets.test.tsx`

### Test Cases:

1. ✓ Sekcija matoma ir rodo atskirus alergijų bei dietų sąrašus
2. ✓ Visi checkboxai atvaizduojami checkbox formatu
3. ✓ Visi checkboxai pagal nutylėjimą yra nepažymėti (naujam vartotojui)

### Equivalence Partitioning:

1. ✓ Pasirinkus NE PER DAUG elementų (vieno elemento atvejis)
2. ✓ Pasirinkus kelis elementus
3. ✓ Nepasirinkus nieko (tuščia būsena)

---

## 🟩 KAN-T52: Sėkmingas Išsaugojimas ir Išlaikymas

**Failas**: `src/__tests__/REQ5-allergies-diets.test.tsx`

### Test Cases:

1. ✓ Žingsnis 1: Pažymėta viena alergija ir viena dieta
2. ✓ Žingsnis 2: Sėkmingas išsaugojimas (pranešimas rodomas)
3. ✓ Žingsnis 3: Po perkrovimo pažymėti checkboxai lieka pažymėti
4. ✓ Žingsnis 4: Atžymėus ir išsaugojus, checkboxas lieka atžymėtas

---

## 🟩 KAN-T53: Recepto Generavimas su Filtramis

**Failai**:

- `src/__tests__/REQ5-allergies-diets.test.tsx`
- `src/__tests__/integration/req5-settings-recipe-integration.test.ts`
- `src/__tests__/integration/req5-homepage-settings-integration.test.tsx`

### Test Cases:

1. ✓ Žingsnis 1-2: Ingredientai sėkmingai pridėti ir pradedamas generavimas
2. ✓ Žingsnis 3: Sugeneruotame recepte nėra mėsos, pieno produktų
3. ✓ Kito recepto generavimo metu filtrai veikia
4. ✓ Kai profilo nustatymuose išsaugota alergija, AI prompt'e atsiranda draudimas
5. ✓ Kai profilo nustatymuose išsaugota dieta, AI prompt'e atsiranda reikalavimas
6. ✓ Kelios alergijos ir dietos - visos įtraukiamos
7. ✓ Vartotojas su alergija ir veganiška dieta generuoja receptą
8. ✓ Preferencijų kaita - naujas receptas su naujomis

---

## 🟩 KAN-T54: Redagavimas ir Momentinis Įsigaliojimas

**Failai**:

- `src/__tests__/REQ5-allergies-diets.test.tsx`
- `src/__tests__/integration/req5-homepage-settings-integration.test.tsx`

### Test Cases:

1. ✓ Žingsnis 1: Baseline - generuojamas receptas su pienu
2. ✓ Žingsnis 3: Išsaugojus naują alergiją (Pienas), ji turėtų veikti
3. ✓ Žingsnis 4: Pakeitę nustatymą, naujas receptas neturi draudžiamų
4. ✓ Vartotojas keičia nustatymą ir iš kart jis veikia
5. ✓ Kelis kartus iš eilės keičiant - kiekvienas pokytis atsispindi

---

## 🟩 KAN-T55: Loginio Konflikto Valdymas

**Failai**:

- `src/__tests__/REQ5-allergies-diets.test.tsx`
- `src/__tests__/integration/req5-settings-recipe-integration.test.ts`
- `src/__tests__/integration/req5-homepage-settings-integration.test.tsx`

### Test Cases:

1. ✓ Žingsnis 1: Vartotojas turi alergiją ir ingredientą
2. ✓ Žingsnis 3: AI ignoruoja draudžiamą ingredientą
3. ✓ Kitu atveju - receptas gali būti modifikuotas
4. ✓ Kelios alergijos ir dietų pasirinkimai
5. ✓ Kelios dietos (pvz. veganiška ir be laktozės)
6. ✓ Multiple alergijos ir ingredientai - visos eliminuojamos
7. ✓ Draudžiamas produktas - AI jį eliminuoja

### Edge Cases:

1. ✓ Tuščias ingredientų sąrašas
2. ✓ Vartotojas turi alergiją ir šią ingredientą prideda

---

## 📊 Papildomi Testai

### Black Box Testai (REQ5-allergies-diets.test.tsx):

1. ✓ Receptų filtravimas pagal pavadinimą (nepakartojimas)
2. ✓ Preferencijos iš localStorage jei API nesisekė
3. ✓ Išsaugojimas su tuščiais pasirinkimais

### Integration - API Testai (req5-settings-recipe-integration.test.ts):

1. ✓ Nėra preferencijų - prompt'as jų neturi
2. ✓ Atnaujinus preferencijas - kitas generavimas naudoja naujas
3. ✓ Pilna workflow - Settings iki Recipe API
4. ✓ Preferencijos tuščios - receptai be filtro

### Data Persistence (req5-homepage-settings-integration.test.tsx):

1. ✓ Išsaugoti preferencijos lieka po perkrovimo
2. ✓ Tuščios preferencijos gali būti išsaugotos

---

## 🎯 Test Kategorijos Suvestinė

| Kategorija        | Failas                                      | Test Case'ai        | Scenarijų |
| ----------------- | ------------------------------------------- | ------------------- | --------- |
| Unit - UI         | REQ5-allergies-diets.test.tsx               | KAN-T51, T52        | 12        |
| Integration - API | req5-settings-recipe-integration.test.ts    | KAN-T53, T54, T55   | 18        |
| E2E - Workflow    | req5-homepage-settings-integration.test.tsx | KAN-T53, T54, T55   | 15        |
| Extra             | Visuose                                     | -                   | 8+        |
| **IŠ VISO**       | 3 failai                                    | **KAN-T51 iki T55** | **50+**   |

---

## 🚀 Kaip Paleisti Konkrečius Testus

### Vienas Test Case:

```bash
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T51"
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T52"
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T53"
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T54"
npm test -- REQ5-allergies-diets.test.tsx -t "KAN-T55"
```

### Viena Kategorija:

```bash
npm test -- REQ5-allergies-diets.test.tsx  # UI testai
npm test -- req5-settings-recipe-integration.test.ts  # API testai
npm test -- req5-homepage-settings-integration.test.tsx  # E2E testai
```

### Visi REQ-5 Testai:

```bash
npm test -- REQ5
npm test -- req5
```

### Su Coverage:

```bash
npm test -- REQ5-allergies-diets.test.tsx --coverage
npm test -- REQ5 --coverage
```

---

## 📋 Greitai Paleidžiamos Komandos

```bash
# Visi REQ-5 testai
npm test -- --testPathPattern="REQ5|req5"

# Tik Equivalence Partitioning testai
npm test -- REQ5-allergies-diets.test.tsx -t "Equivalence"

# Tik Edge Case testai
npm test -- REQ5-allergies-diets.test.tsx -t "Edge Case"

# Tik integration testai
npm test -- --testPathPattern="integration.*req5"

# Tik E2E testai
npm test -- req5-homepage-settings-integration.test.tsx
```

---

## ✅ Testavimo Kriterijai

### AC-1: Checkboxes Atvaizdavimas

- [ ] Alergijos sekcija matoma
- [ ] Dietos sekcija matoma
- [ ] Checkboxai nepažymėti pradžioje

### AC-2: Išsaugojimas ir Persistencija

- [ ] Išsaugojimas greitas
- [ ] Duomenys lieka po perkrovimo
- [ ] Atžymėjimas veikia

### AC-3: Preferences Load ir Taikymas Receptuose

- [ ] Alergijos veikia (eliminuoja produktus)
- [ ] Dietos veikia (keičia receptą)
- [ ] Kombinacijos veikia (kelios alergijos ir dietos)

### Edge Cases:

- [ ] Konfliktai valdomi (alergia + ingredientas)
- [ ] Visos preferencijos kombinacijos veikia
- [ ] Tuščios preferencijos nesuardo sistemos

---

## 📚 Dokumentacija

- **Pilna Dokumentacija**: `REQ5_TESTING_DOCUMENTATION.md`
- **Test Failai**: 3 failai su 50+ scenarijų
- **Coverage**: ~1800 linijų kodo

---

## 🔗 Susijusios Funkcijos ir Komponentai

- **SettingsPage**: `src/app/settings/page.tsx`
- **Preferences Types**: `src/types/preferences.ts`
- **Preferences Data**: `src/data/preferences.ts`
- **Generate Recipes**: `src/lib/generateRecipes.ts`
- **API Route**: `src/app/api/user/preferences/route.ts`

---

**Status**: ✅ Visi testai sukurti ir dokumentuoti  
**Data**: 2026-05-25  
**Paruošta**: Pilna testavimo aprėptis pagal REQ-5 testavimo planą
