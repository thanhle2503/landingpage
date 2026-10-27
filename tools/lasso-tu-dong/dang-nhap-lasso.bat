@echo off
chcp 65001 >nul
title Dang nhap Lasso cho script
set "PROFILE=D:\TrangQuanLy-App\lasso-tu-dong\chrome-profile"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (echo Khong tim thay Chrome. & pause & exit /b)
echo Mo Chrome rieng cua script (Chrome binh thuong, khong bi dieu khien).
echo 1. Dang nhap Lasso trong cua so vua mo.
echo 2. Dang nhap xong thi DONG cua so Chrome do.
echo 3. Bam dup "Lay du lieu Lasso.bat" de chay script.
start "" "%CHROME%" --user-data-dir="%PROFILE%" --no-first-run https://app.getlasso.co/plus
pause
