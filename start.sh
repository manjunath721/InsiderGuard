#!/bin/bash
set -e

echo "==================================================="
echo "  InsiderGuard AI Platform - macOS/Linux Auto-Start"
echo "==================================================="
echo

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+ or v20+)."
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed. Please install Python 3.10+."
    exit 1
fi

# Port Cleanup (Release ports 8000 and 3000 if in use)
for port in 8000 3000; do
    if command -v lsof &>/dev/null; then
        PID=$(lsof -t -i:$port)
        if [ ! -z "$PID" ]; then
            echo "[INFO] Port $port is already in use by PID $PID. Terminating process to avoid conflict..."
            kill -9 $PID 2>/dev/null || true
            sleep 1
        fi
    elif command -v fuser &>/dev/null; then
        echo "[INFO] Port $port is already in use. Terminating process to avoid conflict..."
        fuser -k -n tcp $port 2>/dev/null || true
        sleep 1
    fi
done

# Conditional backend setup
if [ ! -d "backend/venv" ]; then
    echo "[INFO] Python virtual environment not found. Running backend setup..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo "[INFO] Installing backend dependencies..."
    pip install -r requirements.txt
    cd ..
fi

# Conditional frontend setup
if [ ! -d "app/node_modules" ]; then
    echo "[INFO] Frontend node_modules not found. Running frontend setup..."
    cd app
    npm install
    cd ..
fi

# Clean up background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "[INFO] Starting Backend Server (FastAPI on Port 8000)..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "[INFO] Starting Frontend Server (Vite on Port 3000)..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# Keep the script running to monitor processes
wait
