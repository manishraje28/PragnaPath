@echo off
echo.
echo ========================================
echo   PragnaPath - Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

REM Check for .env file
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your GOOGLE_API_KEY
    echo.
    copy .env.example .env
    echo Created .env from template. Please edit it with your API key.
    pause
    exit /b 1
)

echo.
echo Starting PragnaPath Backend...
echo.
python main.py
