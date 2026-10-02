#!/usr/bin/env bash
echo "==================================================="
echo "    Starting CodeMap AI (Hacktoberfest 2026)"
echo "==================================================="

echo "[1/2] Starting FastAPI Backend on http://localhost:8000..."
(cd backend && python run.py) &

echo "[2/2] Starting Vite Frontend on http://localhost:5173..."
(cd frontend && npm run dev) &

echo ""
echo "CodeMap AI is starting up!"
echo "Open your browser at: http://localhost:5173"
echo ""

wait
