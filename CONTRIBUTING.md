# Prisidėjimo gairės

## Šakų (branch) strategija

```
main        — stabili, produkcinė versija
develop     — integracinė šaka, PR'ai keliauja čia
feature/*   — naujos funkcijos (pvz. feature/REQ-17-login)
```

Kūrimo eiga:
1. Sukurkite šaką nuo `develop`: `git checkout -b feature/REQ-XX-aprasymas`
2. Dirbkite, commit'uokite
3. Atidarykite PR į `develop`
4. Po peržiūros — merge į `develop`
5. Kai `develop` stabili — merge į `main`

## Commit žinutės

Naudokite [Conventional Commits](https://www.conventionalcommits.org/) formatą:

```
<tipas>: [REQ-XX] Trumpas aprašymas
```

| Tipas      | Kada naudoti                        |
|------------|-------------------------------------|
| `feat`     | Nauja funkcija                      |
| `fix`      | Klaidos taisymas                    |
| `test`     | Testų pridėjimas/keitimas           |
| `refactor` | Kodo pertvarkymas be funkcijų keitimo |
| `chore`    | Konfigūracijos, priklausomybių keitimas |
| `docs`     | Dokumentacijos pakeitimai           |

Pavyzdžiai:
```
feat: [REQ-17] Pridėtas prisijungimo puslapis
fix: [REQ-14] Pataisyta neigiamų skaičių validacija
test: [REQ-17] Pridėti LoginPage testai
```

## CI Pipeline

Kiekvienas push ir PR automatiškai paleidžia:
1. **Test** — `npm test` (visi Jest testai)
2. **Build** — `npm run build` (Next.js kompiliacija)

Pipeline turi praeiti prieš merge į `develop` ar `main`.

## Versijų valdymas

Versija saugoma `package.json` laukelyje `"version"`.  
Naudokite [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- `PATCH` — klaidų taisymai
- `MINOR` — naujos funkcijos
- `MAJOR` — lūžtantys pokyčiai

## Slapti duomenys

Niekada nekelkite į repozitoriją:
- `.env.local`
- API raktų
- Slaptažodžių

Naudokite **GitHub Secrets** (Settings → Secrets and variables → Actions).
