@echo off
setlocal
cd /d "%~dp0"
echo ========================================
echo        SkillLens AI - Local App
echo ========================================
where py >nul 2>nul
if %errorlevel%==0 (set "PYTHON=py") else (set "PYTHON=python")
if not exist ".venv\Scripts\python.exe" (
  echo [1/3] Creating a virtual environment...
  %PYTHON% -m venv .venv
  if errorlevel 1 goto error
)
echo [2/3] Installing or updating dependencies (internet needed on first run)...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error
echo [3/3] Starting SkillLens AI...
echo Keep this window open. Open http://127.0.0.1:8000 in your browser.
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
if errorlevel 1 goto error
goto end
:error
echo.
echo Startup failed. Check the message above. Make sure Python 3.10+ is installed and internet is available for package installation.
pause
:end
endlocal
