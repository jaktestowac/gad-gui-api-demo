@echo off
REM Start the server on 3001 in a new cmd window using npm run start3001
SETLOCAL
cd /d "%~dp0\.."
echo Starting GAD GUI API demo on port 3001 (npm run start3001) in %CD%
start "GAD Demo - npm run start3001" cmd /k "npm run start3001"
ENDLOCAL
