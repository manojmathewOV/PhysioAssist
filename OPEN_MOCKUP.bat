@echo off
REM Script to open the mockup in your browser (Windows)

echo Opening PhysioAssist Mockup...

set MOCKUP_PATH=%~dp0docs\APP_MOCKUP.html

echo File location: %MOCKUP_PATH%

REM Try different browsers
start chrome "%MOCKUP_PATH%" 2>nul
if %ERRORLEVEL% neq 0 (
    start firefox "%MOCKUP_PATH%" 2>nul
)
if %ERRORLEVEL% neq 0 (
    start msedge "%MOCKUP_PATH%" 2>nul
)
if %ERRORLEVEL% neq 0 (
    start "" "%MOCKUP_PATH%"
)

echo Mockup opened in browser!
pause
