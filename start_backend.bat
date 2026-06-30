@echo off
REM Postur Kocu - Backend baslatici
REM UTF-8 modu Windows konsolundaki emoji crash'ini onler
cd /d "%~dp0backend"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
call venv\Scripts\python.exe main.py
pause