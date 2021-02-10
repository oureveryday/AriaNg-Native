@echo off
cd /D %~dp0
>nul 2>&1 REG.exe query "HKU\S-1-5-19" || (
    ECHO SET UAC = CreateObject^("Shell.Application"^) > "%TEMP%\Getadmin.vbs"
    ECHO UAC.ShellExecute "%~f0", "%1", "", "runas", 1 >> "%TEMP%\Getadmin.vbs"
    "%TEMP%\Getadmin.vbs"
    DEL /f /q "%TEMP%\Getadmin.vbs" 2>nul
    Exit /b
)
for /f "tokens=2 delims==; " %%A in (
  'wmic process call create "%~dp0AriaNg_Native.exe"' ^| find "ProcessId"'
) do set PID=%%A
cd /D %~dp0resources\aria2\
start "" %~dp0resources\aria2\aria2c.exe -D true --conf-path="%~dp0resources\aria2\aria2.conf" --stop-with-process=%PID% 
wmic process where name='aria2c.exe' call SetPriority "Realtime"
