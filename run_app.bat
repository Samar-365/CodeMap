@echo off
echo ===================================================
echo     Starting CodeMap AI (Hacktoberfest 2026)
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start cmd /k "cd backend && python run.py"

echo [2/2] Launching Vite Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo CodeMap AI is starting up!
echo Open your browser at: http://localhost:5173
echo.
