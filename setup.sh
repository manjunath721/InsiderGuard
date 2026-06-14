#!/bin/bash
set -e

echo "==================================================="
echo "  InsiderGuard AI Platform - macOS/Linux Setup"
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

echo "[1/3] Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "[2/3] Installing backend dependencies (this might take a few minutes)..."
pip install -r requirements.txt
cd ..

echo "[3/3] Installing frontend dependencies (this might take a few minutes)..."
cd app
npm install
cd ..

echo
echo "==================================================="
echo "Setup complete successfully!"
echo "To run the project, run: ./run.sh"
echo "==================================================="
