# Test Master's Diagnostic Step 2: Create project with members

$body = @{
  studentId = 'test-student-123'
  appType = 'Educational App'
  skillLevel = 'beginner'
  selectedFeatures = @('authentication', 'database')
  members = @(
    @{ name = 'Alice Johnson'; skills = @('Frontend', 'React') }
    @{ name = 'Bob Smith'; skills = @('Backend', 'Node.js') }
  )
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Testing CREATE endpoint..." -ForegroundColor Cyan
  $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/student/project/create' -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
  
  Write-Host "`n=== CREATE RESPONSE ===" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 10 | Write-Host
  
  Write-Host "`nProject ID: $($response.project._id)" -ForegroundColor Yellow
  Write-Host "Members Count: $($response.project.members.Count)" -ForegroundColor Yellow
  if ($response.project.members.Count -gt 0) {
    Write-Host "Members:" -ForegroundColor Yellow
    $response.project.members | ForEach-Object { 
      Write-Host "  - $($_.name): $($_.skills -join ', ')" 
    }
  } else {
    Write-Host "ERROR: No members saved!" -ForegroundColor Red
  }
  
  # Store ID for next test
  $response.project._id | Out-File -FilePath ".\test-project-id.txt" -NoNewline
  Write-Host "`nProject ID saved to test-project-id.txt" -ForegroundColor Cyan
  
} catch {
  Write-Host "ERROR: $_" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
}
