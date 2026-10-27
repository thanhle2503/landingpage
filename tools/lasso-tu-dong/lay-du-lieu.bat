@echo off
chcp 65001 >nul
title Lay du lieu Lasso
set "DIR=D:\TrangQuanLy-App\lasso-tu-dong"
set "SRC=https://raw.githubusercontent.com/thanhle2503/landingpage/claude/project-thread-t4hu8s/tools/lasso-tu-dong"
if not exist "%DIR%" mkdir "%DIR%"
cd /d "%DIR%"

where node >nul 2>nul || (echo Chua co Node.js. Cai tu https://nodejs.org roi chay lai. & pause & exit /b)
where git >nul 2>nul || (echo Chua co Git. Cai tu https://git-scm.com roi chay lai. & pause & exit /b)

echo Tai ban moi nhat cua script...
curl -fsSL "%SRC%/pull.mjs" -o pull.mjs || (echo Khong tai duoc script. & pause & exit /b)
curl -fsSL "%SRC%/sites.json" -o sites.json
curl -fsSL "%SRC%/lay-du-lieu.bat" -o lay-du-lieu.new && copy /y lay-du-lieu.new "%USERPROFILE%\Desktop\Lay du lieu Lasso.bat" >nul
if not exist package.json echo {"type":"module"}> package.json
if not exist node_modules\playwright (
  echo Cai Playwright lan dau, doi 1 chut...
  set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
  call npm i playwright@1.48.2 --no-audit --no-fund --silent
)

rem ---- Mo Chrome rieng cho Lasso (Chrome thuong, de Google cho dang nhap) ----
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (echo Khong tim thay Chrome. & pause & exit /b)

:open
curl -fs http://127.0.0.1:9333/json/version >nul 2>nul && goto ready
echo Mo cua so Chrome Lasso...
start "" "%CHROME%" --user-data-dir="%DIR%\chrome-profile" --no-first-run --remote-debugging-port=9333 https://app.getlasso.co/plus
for /l %%i in (1,1,15) do (
  timeout /t 1 >nul
  curl -fs http://127.0.0.1:9333/json/version >nul 2>nul && goto ready
)
echo.
echo Dang co mot cua so Chrome Lasso CU dang mo. Hay DONG cua so do (bam X),
echo roi quay lai day bam phim bat ky de thu lai.
pause >nul
goto open

:ready
node pull.mjs
echo.
echo Xong. File nam trong %DIR%\out
pause
