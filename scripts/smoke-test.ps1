# Smoke Test Script for Student Flow UX Fixes (PowerShell)
# Run this after implementing Master's fixes to verify everything works

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Student Flow - Smoke Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$BaseUrl = "http://localhost:3000"

Write-Host "✓ Testing against: $BaseUrl" -ForegroundColor Green
Write-Host ""

# Test 1: Create Project
Write-Host "Test 1: Create Project via API" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

$createBody = @{
    title = "Smoke Test Project"
    elevator = "Quick smoke test"
    must_have_features = @("auth", "crud")
    team_size = 2
    members = @()
    appType = "web"
    skillLevel = "beginner"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BaseUrl/api/student/project/create" `
        -Method Post `
        -ContentType "application/json" `
        -Body $createBody

    $projectId = $createResponse.id

    if ([string]::IsNullOrEmpty($projectId)) {
        Write-Host "✗ Failed to create project" -ForegroundColor Red
        Write-Host "Response: $createResponse"
        exit 1
    }

    Write-Host "✓ Project created: $projectId" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "✗ Failed to create project: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Trigger Snapshot Generation
Write-Host "Test 2: Trigger Snapshot Generation" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

try {
    $seedResponse = Invoke-RestMethod -Uri "$BaseUrl/api/student/project/$projectId/seed" `
        -Method Post `
        -ContentType "application/json"

    Write-Host "Seed response: $($seedResponse | ConvertTo-Json -Compress)"

    if ($seedResponse.ok) {
        Write-Host "✓ Seed job triggered" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Seed job may have failed (check server logs)" -ForegroundColor Yellow
    }
    Write-Host ""
}
catch {
    Write-Host "⚠ Seed request failed: $_" -ForegroundColor Yellow
    Write-Host ""
}

# Test 3: Poll for Snapshot (with timeout)
Write-Host "Test 3: Poll for Snapshot Readiness" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

$maxAttempts = 25
$attempt = 0
$snapshotReady = $false
$snapshotResponse = $null

while ($attempt -lt $maxAttempts) {
    $attempt++
    
    try {
        $snapshotResponse = Invoke-RestMethod -Uri "$BaseUrl/api/student/project/$projectId/snapshot?mode=latest"
        
        if ($snapshotResponse.ready -eq $true) {
            $snapshotReady = $true
            Write-Host "✓ Snapshot ready after $attempt attempts" -ForegroundColor Green
            break
        }
        
        Write-Host "Attempt $attempt/$maxAttempts - Snapshot not ready yet..."
        Start-Sleep -Seconds 1
    }
    catch {
        Write-Host "Attempt $attempt/$maxAttempts - Request failed: $_"
        Start-Sleep -Seconds 1
    }
}

if (-not $snapshotReady) {
    Write-Host "✗ Snapshot never became ready after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Last response: $($snapshotResponse | ConvertTo-Json -Compress)"
    exit 1
}
Write-Host ""

# Test 4: Verify Snapshot Structure
Write-Host "Test 4: Verify Snapshot Structure" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

if ($snapshotResponse.snapshot.nodes.Count -gt 0 -and $snapshotResponse.snapshot.edges.Count -gt 0) {
    Write-Host "✓ Snapshot has $($snapshotResponse.snapshot.nodes.Count) nodes and $($snapshotResponse.snapshot.edges.Count) edges" -ForegroundColor Green
}
else {
    Write-Host "✗ Snapshot structure invalid" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 5: Verify Debug Endpoints (dev only)
Write-Host "Test 5: Check Debug Endpoints" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

try {
    $logsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/student/project/$projectId/logs"

    if ($logsResponse.ok) {
        Write-Host "✓ Logs endpoint working (found $($logsResponse.logs.Count) log entries)" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Logs endpoint returned unexpected response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠ Logs endpoint failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Export Project Data
Write-Host "Test 6: Export Project Data" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    $exportResponse = Invoke-RestMethod -Uri "$BaseUrl/api/student/project/$projectId/export"

    if ($exportResponse.project) {
        Write-Host "✓ Project export working" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Project export failed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "✗ Project export failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Smoke Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Project ID: $projectId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual verification steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000/student/$projectId/proposal"
Write-Host "2. Check BuilderStatusPanel shows 'Snapshot ready' (green)"
Write-Host "3. Click 'Open Editor' - should load instantly via sessionStorage"
Write-Host "4. Verify canvas shows nodes and edges"
Write-Host ""
Write-Host "If editor fails to load:" -ForegroundColor Yellow
Write-Host "- Check sessionStorage for key: snapshot:$projectId"
Write-Host "- View logs: http://localhost:3000/api/student/project/$projectId/logs"
Write-Host "- Check server terminal for [builder] logs"
Write-Host ""
