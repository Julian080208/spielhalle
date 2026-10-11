<# : Spielhalle einrichten - einfach doppelklicken
@echo off
title Spielhalle einrichten
set "SPIELHALLE_CMD=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -LiteralPath $env:SPIELHALLE_CMD -Raw) -replace '^[\s\S]*?#>', '')"
echo.
pause
exit /b
#>
# =====================================================================
#  Spielhalle einrichten: holt die neueste Version und richtet die
#  automatischen Updates ein. Kann jederzeit nochmal gestartet werden.
#   1. GitHub CLI installieren (falls noetig)
#   2. einmal bei GitHub anmelden (falls noetig) - das Projekt ist privat
#   3. neueste Spielhalle laden und pruefen
#   4. installieren bzw. aktualisieren und starten
# =====================================================================
$ErrorActionPreference = 'Continue'
$repo = 'Julian080208/spielhalle'

function Schritt($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Fehler($t) { Write-Host ''; Write-Host "FEHLER: $t" -ForegroundColor Red; exit 1 }
function GhPfad {
  foreach ($p in @("$env:ProgramFiles\GitHub CLI\gh.exe", "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe")) { if (Test-Path $p) { return $p } }
  $c = Get-Command gh -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  return $null
}

Write-Host 'Spielhalle einrichten' -ForegroundColor Magenta

Schritt '1/4  GitHub CLI'
$gh = GhPfad
if (-not $gh) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Fehler 'winget fehlt. Bitte im Microsoft Store "App-Installer" installieren und diese Datei nochmal starten.' }
  Write-Host 'Wird installiert ... (fragt Windows nach Erlaubnis: mit Ja bestaetigen)'
  winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements
  $gh = GhPfad
  if (-not $gh) { Fehler 'Die GitHub CLI konnte nicht installiert werden.' }
}
Write-Host 'OK'

Schritt '2/4  Bei GitHub anmelden'
& $gh auth status --hostname github.com 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Einmalig noetig, damit Updates kommen:'
  Write-Host '  1. Frage "Authenticate Git ... (Y/n)": einfach Enter druecken'
  Write-Host '  2. Ein Code erscheint (z.B. ABCD-1234): Enter druecken, der Browser geht auf'
  Write-Host '  3. Bei GitHub anmelden, Code eingeben, "Authorize GitHub CLI" klicken'
  Write-Host ''
  & $gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Fehler 'Die Anmeldung hat nicht geklappt. Bitte diese Datei nochmal starten.' }
}
$tag = & $gh release view --repo $repo --json tagName --jq .tagName 2>$null
if ($LASTEXITCODE -ne 0 -or -not $tag) { Fehler "Das angemeldete GitHub-Konto hat keinen Zugriff auf $repo." }
$neu = $tag.Trim().TrimStart('v')
Write-Host "OK - neueste Version: $neu"

$reg = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Spielhalle'
$alt = (Get-ItemProperty $reg -ErrorAction SilentlyContinue).DisplayVersion
$ordner = (Get-ItemProperty $reg -ErrorAction SilentlyContinue).InstallLocation
$installiert = $ordner -and (Test-Path (Join-Path $ordner 'Spielhalle.exe'))

if ($installiert -and $alt -eq $neu) {
  Schritt '3/4  Laden'
  Write-Host "Version $neu ist schon installiert, nichts zu laden."
  Schritt '4/4  Starten'
  Start-Process (Join-Path $ordner 'Spielhalle.exe') -WorkingDirectory $ordner
} else {
  Schritt "3/4  Spielhalle $neu laden"
  $dir = Join-Path $env:TEMP 'Spielhalle-Einrichten'
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory $dir | Out-Null
  & $gh release download $tag --repo $repo --pattern 'Spielhalle-Setup.exe' --pattern 'version.json' --dir $dir
  $setup = Join-Path $dir 'Spielhalle-Setup.exe'
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $setup)) { Fehler 'Der Download hat nicht geklappt.' }
  $soll = (Get-Content (Join-Path $dir 'version.json') -Raw | ConvertFrom-Json).sha256
  $ist = (Get-FileHash $setup -Algorithm SHA256).Hash
  if ($soll -and $ist -ne $soll) { Fehler 'Die geladene Datei ist beschaedigt (Pruefsumme stimmt nicht).' }
  Write-Host 'OK - Datei geprueft'

  if ($installiert) {
    Schritt "4/4  Aktualisieren von $alt auf $neu"
    # nur auf das Setup warten (-Wait wuerde auch auf die neu gestartete Spielhalle warten)
    $p = Start-Process $setup -ArgumentList '--still', '--neustart' -PassThru
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) { Fehler "Das Aktualisieren hat nicht geklappt (Details: $env:TEMP\Spielhalle-Setup-Fehler.txt)." }
  } else {
    Schritt '4/4  Installieren'
    Write-Host 'Der Installations-Assistent geht auf - einfach durchklicken.'
    (Start-Process $setup -PassThru).WaitForExit()
  }
}

Write-Host ''
Write-Host 'Fertig! Die Spielhalle aktualisiert sich ab jetzt automatisch.' -ForegroundColor Green
