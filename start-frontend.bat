@echo off
echo.
echo ========================================
echo   PragnaPath - Starting Frontend
echo ========================================
echo.

cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting PragnaPath Frontend...
echo Open http://localhost:3000 in your browser
echo.
npm run dev
