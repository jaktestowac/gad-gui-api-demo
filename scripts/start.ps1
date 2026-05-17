<#
Start the server in a new PowerShell window (natively on Windows) using npm run start.
This script runs PowerShell's Start-Process to open a new window and run the npm command.
#>
param(
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Definition)
)

$projectPath = Join-Path $ProjectRoot '..' | Resolve-Path -ErrorAction Stop
Write-Host "Starting GAD GUI API demo (npm run start) in: $projectPath"

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command`, `"cd \"$projectPath\"; npm run start`" -WorkingDirectory $projectPath
