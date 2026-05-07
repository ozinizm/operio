# Check for localhost in build files
Write-Host "Checking for localhost/127.0.0.1 in dist/ assets..." -ForegroundColor Cyan

# Check if dist directory exists
if (-Not (Test-Path "dist")) {
    Write-Host "ERROR: dist/ directory not found. Run npm run build first." -ForegroundColor Red
    exit 1
}

$matches = Select-String -Path "dist/assets/*.js" -Pattern "localhost:8000|127.0.0.1:8000"
if ($matches) {
    Write-Host "WARNING: Found hardcoded API URLs in build files!" -ForegroundColor Yellow
    $matches | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber)" }
} else {
    Write-Host "No hardcoded API URLs found in build files." -ForegroundColor Green
}
