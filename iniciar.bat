@echo off
echo.
echo  ========================================
echo    Nova Salud - Iniciando sistema...
echo  ========================================
echo.

cd /d %~dp0\backend
start "Nova Salud Backend" cmd /k "npm run dev"

timeout /t 2 >nul

cd /d %~dp0\frontend
start "Nova Salud Frontend" cmd /k "npm run dev"

echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  Abriendo navegador...
timeout /t 4 >nul
start http://localhost:5173
