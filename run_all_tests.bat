@echo off
echo ========================================
echo TEST 1: Sėkmingas ingrediento pridėjimas ir receptų paieška
echo ========================================
npm test -- -t "leidžia pridėti ingredientą su kiekiu ir vienetu, tada ieškoti receptų" --no-coverage
echo.
echo Press any key to continue to Test 2...
pause >nul

echo ========================================
echo TEST 2: Ingrediento pridėjimas be kiekio
echo ========================================
npm test -- -t "leidžia pridėti ingredientą be kiekio kaip" --no-coverage
echo.
echo Press any key to continue to Test 3...
pause >nul

echo ========================================
echo TEST 3: Kelių ingredientų pridėjimas
echo ========================================
npm test -- -t "leidžia pridėti kelis skirtingus ingredientus į sąrašą" --no-coverage
echo.
echo Press any key to continue to Test 4...
pause >nul

echo ========================================
echo TEST 4: Klaida - bandymas įvesti 0 kiekį
echo ========================================
npm test -- -t "neleidžia įvesti 0 kaip kiekį ir rodo tuščią laukelį" --no-coverage
echo.
echo Press any key to continue to Test 5...
pause >nul

echo ========================================
echo TEST 5: Klaida - bandymas įvesti 9999 kg
echo ========================================
npm test -- -t "neleidžia įvesti daugiau nei 1000 ir rodo tuščią laukelį" --no-coverage
echo.
echo Press any key to continue to Test 6...
pause >nul

echo ========================================
echo TEST 6: Vienetų pasirinkimas su skirtingais vienetais
echo ========================================
npm test -- -t "leidžia pasirinkti skirtingus matavimo vienetus" --no-coverage
echo.
echo Press any key to continue to Test 7...
pause >nul

echo ========================================
echo TEST 7: Paieška su keliais ingredientais
echo ========================================
npm test -- -t "siunčia visus ingredientus į API paieškai" --no-coverage
echo.
echo Press any key to continue to Test 8...
pause >nul

echo ========================================
echo TEST 8: API klaidos apdorojimas
echo ========================================
npm test -- -t "rodo klaidos pranešimą kai API nepavyksta" --no-coverage
echo.
echo Press any key to continue to Test 9...
pause >nul

echo ========================================
echo TEST 9: Įkėlimo būsena paieškos metu
echo ========================================
npm test -- -t "rodo įkėlimo indikatorių kol vyksta paieška" --no-coverage
echo.
echo Press any key to continue to Test 10...
pause >nul

echo ========================================
echo TEST 10: Dublikatų ingredientų prevencija
echo ========================================
npm test -- -t "neleidžia pridėti to paties ingrediento du kartus" --no-coverage
echo.
echo Press any key to continue to Test 11...
pause >nul

echo ========================================
echo TEST 11: Netinkamo ingrediento įvedimas
echo ========================================
npm test -- -t "nerodytų ingrediento sąraše kai nerastas" --no-coverage
echo.
echo Press any key to continue to Test 12...
pause >nul

echo ========================================
echo TEST 12: Paieškos mygtukas neaktyvus be ingredientų
echo ========================================
npm test -- -t "nerodomas paieškos mygtukus kai nėra pridėtų ingredientų" --no-coverage
echo.
echo ========================================
echo VISI TESTAI BAIGTI!
echo ========================================