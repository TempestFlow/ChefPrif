[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PALEIDŽIAMI VISI 12 HOME PAGE TESTAI" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
npm test --no-coverage
Write-Host "=========================================" -ForegroundColor Green
Write-Host "VISI 12 TESTŲ BAIGTI!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green