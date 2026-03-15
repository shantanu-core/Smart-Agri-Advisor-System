@echo off
echo Stopping any process on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
cd /d "%~dp0Smart-Agri-Advisor-System-main"
echo Starting Smart Agri Advisor...
echo Open browser at: http://localhost:3000/main.html
node server.js
pause
