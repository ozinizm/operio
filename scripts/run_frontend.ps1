Set-Location -Path "$PSScriptRoot\.."

# Ensure .env.local exists with VITE_API_URL
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating $envFile with default VITE_API_URL..." -ForegroundColor Cyan
    "VITE_API_URL=http://localhost:8000/api" | Out-File -FilePath $envFile -Encoding utf8
} else {
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "VITE_API_URL") {
        Write-Host "Adding VITE_API_URL to $envFile..." -ForegroundColor Cyan
        Add-Content -Path $envFile -Value "`nVITE_API_URL=http://localhost:8000/api"
    }
}

Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Starting frontend dev server..." -ForegroundColor Green
npm run dev
