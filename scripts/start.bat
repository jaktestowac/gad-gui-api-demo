@echo off
REM Start the server in the current console so closing this console will stop the server
cd /d "%~dp0\.."
echo Starting GAD GUI API demo (npm run start) in %CD%
npm run start
