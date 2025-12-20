@echo off
echo.
echo ============================================================
echo   PragnaPath - Full Stack Startup
echo   Cognitive-Adaptive Multi-Agent Learning Companion
echo ============================================================
echo.

REM Start backend in a new window
start "PragnaPath Backend" cmd /k "%~dp0start-backend.bat"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

REM Start frontend in a new window
start "PragnaPath Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ============================================================
echo   Both servers are starting!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Press any key to open the app in your browser...
echo ============================================================
pause > nul

start http://localhost:3000
