#!/bin/bash

echo "==================================================="
echo "  InsiderGuard AI Platform - macOS/Linux Runner"
echo "==================================================="
echo

# Function to clean up background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

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

echo "Starting Backend Server (FastAPI on Port 8000)..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend Server (Vite on Port 3000)..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# Keep the script running to monitor processes and catch Ctrl+C
wait
