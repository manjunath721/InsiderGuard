# Windows Auto-Start Script for InsiderGuard AI Platform

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  InsiderGuard AI Platform - Windows Auto-Start" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js (v18+ or v20+) from https://nodejs.org/" -ForegroundColor Red
    Pause
    Exit 1
}

# 2. Check for Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed. Please install Python 3.10+ and add it to your PATH." -ForegroundColor Red
    Pause
    Exit 1
}

# 3. Port Cleanup (Release ports 8000 and 3000 if in use)
$ports = @(8000, 3000)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "[INFO] Port $port is already in use. Terminating blocking process to avoid conflict..." -ForegroundColor Yellow
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host "Killing Process ID: $pidToKill on port $port" -ForegroundColor DarkGray
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 1
    }
}

# 4. Backend Virtual Environment setup if missing
if (!(Test-Path "backend\venv")) {
    Write-Host "[INFO] Python virtual environment not found in backend/. Creating one now..." -ForegroundColor Cyan
    Push-Location backend
    try {
        python -m venv venv
        Write-Host "[INFO] Installing backend dependencies (requirements.txt)..." -ForegroundColor Cyan
        Start-Process -FilePath "venv\Scripts\pip.exe" -ArgumentList "install -r requirements.txt" -Wait -NoNewWindow
    }
    catch {
        Write-Host "[ERROR] Failed to set up Python virtual environment or install dependencies." -ForegroundColor Red
        Pop-Location
        Pause
        Exit 1
    }
    Pop-Location
}

# 5. Frontend node_modules setup if missing
if (!(Test-Path "app\node_modules")) {
    Write-Host "[INFO] Frontend node_modules not found in app/. Installing npm packages..." -ForegroundColor Cyan
    Push-Location app
    try {
        Start-Process -FilePath "npm.cmd" -ArgumentList "install" -Wait -NoNewWindow
    }
    catch {
        Write-Host "[ERROR] Failed to run npm install." -ForegroundColor Red
        Pop-Location
        Pause
        Exit 1
    }
    Pop-Location
}

# Create empty input file to safely redirect standard input
$nullInputFile = Join-Path $PSScriptRoot ".null_input"
if (!(Test-Path $nullInputFile)) {
    New-Item -Path $nullInputFile -ItemType File -Force | Out-Null
}

# 6. Start Backend Server using Venv Python (solves ModuleNotFoundError)
Write-Host "[INFO] Starting Backend Server (FastAPI on Port 8000)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn main:app --port 8000" -WorkingDirectory "backend" -RedirectStandardInput $nullInputFile -PassThru -NoNewWindow

# 7. Start Frontend Server (Vite on Port 3000)
Write-Host "[INFO] Starting Frontend Server (Vite on Port 3000)..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "app" -RedirectStandardInput $nullInputFile -PassThru -NoNewWindow

# 8. Cleanup Function on Exit
function Cleanup-Processes {
    Write-Host ""
    Write-Host "[INFO] Stopping servers..." -ForegroundColor Yellow
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[INFO] Servers stopped." -ForegroundColor Green
}

# Keep running and handle clean exit
try {
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "InsiderGuard AI Platform is running!" -ForegroundColor Green
    Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  - Backend:  http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  - API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "Press Ctrl+C in this window to stop both servers." -ForegroundColor Yellow
    Write-Host ""

    # Monitor processes
    while ($true) {
        Start-Sleep -Seconds 2
        if ($backendProcess.HasExited) {
            Write-Host "[WARN] Backend server has exited unexpectedly." -ForegroundColor Red
            break
        }
        if ($frontendProcess.HasExited) {
            Write-Host "[WARN] Frontend server has exited unexpectedly." -ForegroundColor Red
            break
        }
    }
}
finally {
    Cleanup-Processes
}
