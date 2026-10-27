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
curl -fsSL "%SRC%/dang-nhap-lasso.bat" -o dang-nhap-lasso.bat && copy /y dang-nhap-lasso.bat "%USERPROFILE%\Desktop\Dang nhap Lasso.bat" >nul
if not exist package.json echo {"type":"module"}> package.json
if not exist node_modules\playwright (
  echo Cai Playwright lan dau, doi 1 chut...
  set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
  call npm i playwright@1.48.2 --no-audit --no-fund --silent
)

echo.
echo Trang nao? mom / knife / pet / toolcars
set /p SITE=Go ten trang roi Enter: 
echo Chi lay hang nao? (Enter = tat ca hang cua trang, hoac go vd: Momcozy,Frida)
set /p BRANDS=Hang: 
echo Moi hang lay toi da bao nhieu mon moi? (Enter = tat ca)
set /p MAX=So mon: 

set "ARGS=--site %SITE%"
if not "%BRANDS%"=="" set "ARGS=%ARGS% --brands "%BRANDS%""
if not "%MAX%"=="" set "ARGS=%ARGS% --max %MAX%"
node pull.mjs %ARGS%
echo.
echo Xong. File nam trong %DIR%\out
pause
