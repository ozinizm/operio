Write-Host "================================================" -ForegroundColor Magenta
Write-Host "   OPERIO SYSTEM CHECK" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

Set-Location -Path "$PSScriptRoot\.."
$rootDir = Get-Location
$backendDir = Join-Path $rootDir "backend"

# --- 1. Backend Import Test ---
Write-Host "[1/2] Backend import test..." -ForegroundColor Cyan
Push-Location $backendDir
$backendResult = python -c "from app.main import app; print('Backend import OK')" 2>&1
Pop-Location

if ($backendResult -match "Backend import OK") {
    Write-Host "  PASS: Backend imports OK" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Backend import error:" -ForegroundColor Red
    Write-Host "  $backendResult" -ForegroundColor Red
}

Write-Host ""

# --- 2. Frontend Build Test ---
Write-Host "[2/2] Frontend build test (npm run build)..." -ForegroundColor Cyan
$buildOutput = npm run build 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -eq 0) {
    Write-Host "  PASS: npm run build succeeded" -ForegroundColor Green
} else {
    Write-Host "  FAIL: npm run build failed:" -ForegroundColor Red
    $buildOutput | Where-Object { $_ -match "error" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  STARTUP COMMANDS" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  BACKEND  -> .\scripts\run_backend.ps1" -ForegroundColor Yellow
Write-Host "             OR: cd backend && python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  FRONTEND -> .\scripts\run_frontend.ps1" -ForegroundColor Yellow
Write-Host "             OR: npm run dev" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  API DOCS -> http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  APP      -> http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
