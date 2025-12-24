# Quick Test - Members Fix Verification
# Run this after fixes to verify members are saved and retrieved

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Members Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Create project with members
Write-Host "Test 1: Create project with 2 members" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow

$createPayload = @{
    title = "Members Test"
    elevator = "Testing member persistence"
    must_have_features = @("auth")
    team_size = 2
    appType = "web"
    skillLevel = "beginner"
    members = @(
        @{
            name = "Alice Johnson"
            email = "alice@test.com"
            skill_tags = @(
                @{ name = "React"; level = "intermediate" },
                @{ name = "TypeScript"; level = "beginner" }
            )
        },
        @{
            name = "Bob Smith"
            email = "bob@test.com"
            skill_tags = @(
                @{ name = "Node.js"; level = "advanced" },
                @{ name = "MongoDB"; level = "intermediate" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/student/project/create" `
        -Method Post `
        -ContentType "application/json" `
        -Body $createPayload

    if ($createResponse.ok -and $createResponse.project) {
        $projectId = $createResponse.project._id
        Write-Host "✓ Project created: $projectId" -ForegroundColor Green
        Write-Host ""
        
        # Test 2: Verify project has members via GET endpoint
        Write-Host "Test 2: Verify project via GET endpoint" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Yellow
        
        Start-Sleep -Seconds 1
        
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/student/project/$projectId"
        
        if ($getResponse.ok -and $getResponse.project) {
            $project = $getResponse.project
            $memberCount = ($project.members | Measure-Object).Count
            
            Write-Host "✓ Project fetched successfully" -ForegroundColor Green
            Write-Host "  Title: $($project.title)" -ForegroundColor Cyan
            Write-Host "  Members: $memberCount" -ForegroundColor Cyan
            
            if ($memberCount -eq 2) {
                Write-Host "✓ PASS: Members saved correctly (expected 2, got $memberCount)" -ForegroundColor Green
                
                Write-Host "`nMember details:" -ForegroundColor Yellow
                foreach ($member in $project.members) {
                    Write-Host "  - $($member.name) ($($member.email))" -ForegroundColor White
                    Write-Host "    Skills: $($member.skill_tags | ForEach-Object { $_.name } | Join-String -Separator ', ')" -ForegroundColor Gray
                }
            } else {
                Write-Host "✗ FAIL: Expected 2 members, got $memberCount" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ FAIL: Could not fetch project" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Test 3: Check snapshot generation" -ForegroundColor Yellow
        Write-Host "----------------------------------" -ForegroundColor Yellow
        Write-Host "Waiting for snapshot to generate..." -ForegroundColor Gray
        
        # Poll for snapshot
        $maxAttempts = 15
        $attempt = 0
        $snapshotReady = $false
        
        while ($attempt -lt $maxAttempts) {
            $attempt++
            Start-Sleep -Seconds 1
            
            try {
                $snapshotResponse = Invoke-RestMethod -Uri "$baseUrl/api/student/project/$projectId/snapshot?mode=latest"
                
                if ($snapshotResponse.ok -and $snapshotResponse.ready -and $snapshotResponse.snapshot) {
                    $snapshotReady = $true
                    Write-Host "✓ Snapshot ready after $attempt seconds" -ForegroundColor Green
                    Write-Host "  Nodes: $($snapshotResponse.snapshot.nodes.Count)" -ForegroundColor Cyan
                    Write-Host "  Edges: $($snapshotResponse.snapshot.edges.Count)" -ForegroundColor Cyan
                    break
                }
                
                Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
            } catch {
                Write-Host "  Attempt $attempt/$maxAttempts (snapshot not ready yet)" -ForegroundColor Gray
            }
        }
        
        if (-not $snapshotReady) {
            Write-Host "⚠ Snapshot not ready after $maxAttempts seconds" -ForegroundColor Yellow
            Write-Host "  Check server logs for errors" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Summary" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Project ID: $projectId" -ForegroundColor White
        Write-Host ""
        Write-Host "Manual verification:" -ForegroundColor Yellow
        Write-Host "1. Open: $baseUrl/student/$projectId/proposal" -ForegroundColor White
        Write-Host "2. Check if members are displayed" -ForegroundColor White
        Write-Host "3. Verify 'expectedTeams' calculation shows 1 team" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "✗ FAIL: Could not create project" -ForegroundColor Red
        Write-Host "Response: $($createResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Server not running on port 3000" -ForegroundColor White
    Write-Host "2. Authentication required - try logging in first" -ForegroundColor White
    Write-Host "3. Database connection issue" -ForegroundColor White
}

Write-Host ""
