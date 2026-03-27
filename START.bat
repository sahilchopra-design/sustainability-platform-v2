@echo off
setlocal

:: ============================================================
::  A2 Intelligence - Risk Analytics Platform
::  Double-click to start backend + frontend, then open browser
::
::  Ports:    Backend  http://localhost:8001
::            Frontend http://localhost:4000
:: ============================================================

set "PYTHON=C:\Users\SahilChopra\AppData\Local\Programs\Python\Python312\python.exe"
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"

cls
echo.
echo  ============================================================
echo   A2 Intelligence   Risk Analytics Platform
echo  ============================================================
echo.

:: Validate Python
if not exist "%PYTHON%" (
    echo  ERROR: Python not found at:
    echo  %PYTHON%
    echo.
    echo  Edit the PYTHON variable at the top of START.bat
    echo.
    pause
    exit /b 1
)

:: Check if backend is already running
netstat -ano 2>nul | findstr "LISTENING" | findstr ":8001 " >nul 2>&1
if not errorlevel 1 (
    echo  NOTE: Port 8001 is already in use.
    echo  The application may already be running.
    echo.
    echo  To restart cleanly, run STOP.bat first.
    echo.
    echo  Opening browser at http://localhost:4000 ...
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:4000"
    echo.
    pause
    exit /b 0
)

:: Start backend in its own window
echo  [1/2] Backend   starting on http://localhost:8001
start "A2 Backend (port 8001)" /D "%BACKEND%" cmd /k ""%PYTHON%" -m uvicorn server:app --host 0.0.0.0 --port 8001"

:: Brief pause for backend init before frontend starts
timeout /t 4 /nobreak >nul

:: Start frontend in its own window (uses start-fe.py which handles CRACO + node paths)
echo  [2/2] Frontend  starting on http://localhost:4000
start "A2 Frontend (port 4000)" /D "%ROOT%" cmd /k ""%PYTHON%" start-fe.py"

echo.
echo  Both servers are starting up.
echo  Frontend compilation takes ~25 seconds.
echo  Browser will open automatically...
echo.
timeout /t 25 /nobreak

echo.
start "" "http://localhost:4000"

echo.
echo  ============================================================
echo   Application is running
echo.
echo   Frontend    http://localhost:4000
echo   API Docs    http://localhost:8001/docs
echo   API Health  http://localhost:8001/api/health
echo.
echo   Login: use any email + password in development mode
echo.
echo   To stop: run STOP.bat, or close the two server windows
echo  ============================================================
echo.
pause
endlocal
