@echo off
rem Double-click to preview EdenWise at http://localhost:5792 (keep this window open while browsing).
cd /d "%~dp0"
where node >nul 2>nul || (start "" "%~dp0index.html" & exit /b)
start "" http://localhost:5792
node serve.js
