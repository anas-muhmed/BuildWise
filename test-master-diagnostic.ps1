$payload = @{
    title = "SMOKE - members test"
    elevator = "test"
    team_size = 2
    appType = "web"
    skillLevel = "beginner"
    members = @(
        @{
            name = "Alice"
            email = "alice@example.com"
            skill_tags = @(@{ name = "React"; level = "beginner" })
        },
        @{
            name = "Bob"
            email = "bob@example.com"
            skill_tags = @(@{ name = "Node"; level = "intermediate" })
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Creating project..."
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/student/project/create" -Method Post -ContentType "application/json" -Body $payload

Write-Host "CREATE RESPONSE:"
$response | ConvertTo-Json -Depth 10

if ($response.project) {
    $projectId = $response.project._id
    Write-Host "`n`nProject ID: $projectId"
    
    Write-Host "`n`nFetching project..."
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/student/project/$projectId"
    
    Write-Host "GET PROJECT RESPONSE:"
    $getResponse | ConvertTo-Json -Depth 10
}
