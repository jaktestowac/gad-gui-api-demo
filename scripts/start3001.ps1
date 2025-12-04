param(
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Definition)
)

$projectPath = Join-Path $ProjectRoot '..' | Resolve-Path -ErrorAction Stop
Write-Host "Starting GAD GUI API demo (npm run start3001) in: $projectPath"

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command`, `"cd \"$projectPath\"; npm run start3001`" -WorkingDirectory $projectPath
