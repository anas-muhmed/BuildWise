# BuildWise Performance Cleanup Script
# Run this if dev server is still slow

Write-Host "🧹 Cleaning BuildWise for Maximum Performance..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "Stopping Next.js dev server..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Clear Next.js cache
Write-Host "Clearing .next cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# Clear node_modules cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
}

# Clear TypeScript build info
Write-Host "Clearing TypeScript build info..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Filter "*.tsbuildinfo" | Remove-Item -Force

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
Write-Host "You should see: ⚡ Next.js (turbo)" -ForegroundColor Yellow
