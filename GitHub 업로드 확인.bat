@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   배움 앱 GitHub 업로드 도우미
echo ========================================
echo.

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo 이 폴더는 Git 저장소가 아닙니다.
  echo Codex에게 GitHub 연결을 먼저 요청해주세요.
  pause
  exit /b 1
)

echo 현재 GitHub 연결:
git remote -v
echo.

echo 현재 변경된 파일:
git status --short
echo.

git diff --quiet && git diff --cached --quiet
if not errorlevel 1 (
  echo 업로드할 변경사항이 없습니다.
  pause
  exit /b 0
)

set /p CONFIRM=GitHub에 업로드할까요? (Y/N): 
if /I not "%CONFIRM%"=="Y" (
  echo 업로드를 취소했습니다.
  pause
  exit /b 0
)

echo.
set /p MESSAGE=커밋 메모를 입력하세요. 그냥 Enter를 누르면 자동 메모를 사용합니다: 
if "%MESSAGE%"=="" set MESSAGE=Update app changes

echo.
echo 변경사항을 저장합니다...
git add -A

git commit -m "%MESSAGE%"
if errorlevel 1 (
  echo 커밋 중 문제가 생겼습니다.
  pause
  exit /b 1
)

echo.
echo GitHub로 업로드합니다...
git push
if errorlevel 1 (
  echo GitHub 업로드 중 문제가 생겼습니다.
  echo 로그인을 요구하거나 권한 확인이 필요할 수 있습니다.
  pause
  exit /b 1
)

echo.
echo 완료되었습니다. GitHub에 업로드됐습니다.
pause