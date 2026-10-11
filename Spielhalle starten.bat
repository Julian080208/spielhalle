@echo off
rem Startet die Spielhalle. Ist sie als App installiert (Spielhalle-Setup.exe),
rem wird die App genommen - sonst wie bisher als eigenes Edge-Fenster
rem plus kleiner Helfer im Hintergrund fuer das YouTube-Kino.
if exist "%LOCALAPPDATA%\Programs\Spielhalle\Spielhalle.exe" (
  start "" "%LOCALAPPDATA%\Programs\Spielhalle\Spielhalle.exe"
  goto :eof
)
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0spiele\shared\spielhalle-server.ps1"
set "L=%~dp0Launcher.html"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%L:\=/%" --start-maximized --autoplay-policy=no-user-gesture-required
) else (
  start "" "%L%"
)
