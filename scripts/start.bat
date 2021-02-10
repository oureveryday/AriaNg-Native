@echo off
cd /D %~dp0
for /f "tokens=2 delims==; " %%A in (
  'wmic process call create "%~dp0AriaNg_Native.exe"' ^| find "ProcessId"'
) do set PID=%%A
cd /D %~dp0resources\aria2\
start "" %~dp0resources\aria2\aria2c.exe -D true --conf-path="%~dp0resources\aria2\aria2.conf" --stop-with-process=%PID% 
wmic process where name='aria2c.exe' call SetPriority "high priority"
