@echo off
setlocal

:: ============================================================
::  A2 Intelligence - Check server status
:: ============================================================

echo.
echo  ============================================================
echo   A2 Intelligence   Server Status
echo  ============================================================
echo.

:: Backend check
netstat -ano 2>nul | findstr "LISTENING" | findstr ":8001 " >nul 2>&1
if not errorlevel 1 (
    echo   Backend   [RUNNING]   http://localhost:8001
    echo              Swagger     http://localhost:8001/docs
    echo              Health      http://localhost:8001/api/health
) else (
    echo   Backend   [STOPPED]   Run START.bat to launch
)

echo.

:: Frontend check
netstat -ano 2>nul | findstr "LISTENING" | findstr ":4000 " >nul 2>&1
if not errorlevel 1 (
    echo   Frontend  [RUNNING]   http://localhost:4000
) else (
    echo   Frontend  [STOPPED]   Run START.bat to launch
)

echo.
echo  ============================================================
echo.
echo  Quick reference - Key pages:
echo.
echo   /interactive          Full analytics dashboard (start here)
echo   /portfolio-analytics  Portfolio metrics, WACI, ITR
echo   /financial-risk       ECL, PCAF, temperature scores
echo   /carbon               Carbon calculator, CDM/VCS/CBAM
echo   /nature-risk          TNFD LEAP, water risk, biodiversity
echo   /stranded-assets      Fossil fuel, real estate, power plants
echo   /regulatory           SFDR, EU Taxonomy, TCFD, CSRD, ISSB
echo   /scenario-analysis    NGFS v2 scenario engine
echo   /valuation            Asset valuation (income/cost/sales)
echo   /supply-chain         Scope 3, SBTi targets
echo   /sector-assessments   Data centres, CAT risk, power plants
echo.
echo  ============================================================
echo.
pause
endlocal
