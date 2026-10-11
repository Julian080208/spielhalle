# =====================================================================
#  Neue Version der Spielhalle veröffentlichen (GitHub-Release)
#  Beispiel:  .\veroeffentlichen.ps1 -Notiz "Neu: Minigolf mit 18 Bahnen"
#             .\veroeffentlichen.ps1 -Notiz "Großes Update" -Art minor
#  Danach bekommt jede installierte Spielhalle das Update automatisch.
#  Braucht: git, GitHub CLI (gh) mit Anmeldung, installer\repo.txt
# =====================================================================
param(
  [string]$Notiz = 'Verbesserungen und Fehlerbehebungen',
  [ValidateSet('patch', 'minor', 'major')][string]$Art = 'patch'
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$root = Split-Path $here -Parent
$utf8 = New-Object Text.UTF8Encoding $false
$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = "$env:ProgramFiles\GitHub CLI\gh.exe" }
if (-not (Test-Path $gh)) { $gh = "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe" }
$repo = ([IO.File]::ReadAllText("$here\repo.txt")).Trim()

# Version hochzählen
$v = ([IO.File]::ReadAllText("$here\version.txt")).Trim().Split('.') | ForEach-Object { [int]$_ }
switch ($Art) { 'major' { $v = @($v[0] + 1, 0, 0) } 'minor' { $v = @($v[0], $v[1] + 1, 0) } default { $v = @($v[0], $v[1], $v[2] + 1) } }
$version = $v -join '.'
[IO.File]::WriteAllText("$here\version.txt", $version, $utf8)
[IO.File]::WriteAllText("$here\neu.txt", $Notiz, $utf8)

& powershell -NoProfile -ExecutionPolicy Bypass -File "$here\build.ps1"
if ($LASTEXITCODE) { throw 'Bauen fehlgeschlagen' }

# Quelltext sichern und Release mit Setup + version.json anlegen
Push-Location $root
try {
  git add -A
  git commit -q -m "Spielhalle $version" -m $Notiz -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  git push -q origin HEAD
  & $gh release create "v$version" "$here\dist\Spielhalle-Setup.exe" "$here\dist\version.json" --repo $repo --title "Spielhalle $version" --notes $Notiz
  if ($LASTEXITCODE) { throw 'GitHub-Release fehlgeschlagen' }
} finally { Pop-Location }
"Veröffentlicht: Spielhalle $version"
"Download-Link: https://github.com/$repo/releases/latest/download/Spielhalle-Setup.exe"
