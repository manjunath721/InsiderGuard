@echo off
echo ===================================================
echo   InsiderGuard AI Platform - Windows Setup
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js (v18+ or v20+) from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.10+ and make sure it is added to your PATH.
    pause
    exit /b 1
)

echo [1/3] Setting up Python virtual environment...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

echo [2/3] Installing backend dependencies (this might take a few minutes)...
pip install -r requirements.txt
cd ..

echo [3/3] Installing frontend dependencies (this might take a few minutes)...
cd app
call npm install
cd ..

echo.
echo ===================================================
echo Setup complete successfully!
echo To run the project, double-click run.bat
echo ===================================================
pause
