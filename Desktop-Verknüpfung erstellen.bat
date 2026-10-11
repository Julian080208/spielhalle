@echo off
rem Legt eine Verknuepfung "Spielhalle" auf dem Desktop an
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Spielhalle.lnk'); $s.TargetPath = '%~dp0Spielhalle starten.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%SystemRoot%\System32\imageres.dll,186'; $s.WindowStyle = 7; $s.Save()"
if errorlevel 1 (
  echo Das hat leider nicht geklappt.
) else (
  echo Verknuepfung "Spielhalle" wurde auf dem Desktop erstellt.
)
pause
