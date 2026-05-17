@echo off
REM Start the server on port 3001 in the current console so closing this console will stop the server
cd /d "%~dp0\.."
echo Starting GAD GUI API demo on port 3001 (npm run start3001) in %CD%
npm run start3001
