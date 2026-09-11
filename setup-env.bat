@echo off

where scoop >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Scoop...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression"
)

echo Adding buckets...
powershell -NoProfile -ExecutionPolicy Bypass -Command "scoop bucket add java >$null 2>&1"

echo Installing tools via Scoop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "scoop install nodejs-lts python temurin25-jdk"

echo Installing graphify via pip...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install graphify

echo Done. Restart your terminal for PATH changes to take effect.
pause