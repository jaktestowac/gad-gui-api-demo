@echo off
REM Start the server in a new cmd window using npm run start
SETLOCAL
cd /d "%~dp0\.."
echo Starting GAD GUI API demo (npm run start) in %CD%
start "GAD Demo - npm start" cmd /k "npm run start"
ENDLOCAL
