@echo off
chcp 65001 >nul
cd /d "%~dp0"
set EXPO_NO_TELEMETRY=1
set EXPO_OFFLINE=1
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.109

echo.
echo Expo QR 서버를 시작합니다...
echo PC 와이파이 주소: 192.168.1.109
echo QR이 나올 때까지 이 검은 창을 닫지 마세요.
echo.

npx.cmd expo start --lan --clear --port 8083
pause
