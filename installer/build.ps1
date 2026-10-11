# =====================================================================
#  Baut Spielhalle.exe und den Installer Spielhalle-Setup.exe
#  (nur Windows-Bordmittel, kein Visual Studio nötig)
#  Version:      installer\version.txt
#  Neuigkeiten:  installer\neu.txt
#  GitHub-Repo:  installer\repo.txt  (z. B. "julian/spielhalle")
#  Ergebnis:     installer\dist\Spielhalle-Setup.exe + version.json
#                (und eine Kopie des Setups im Spiele-Ordner)
# =====================================================================
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$root = Split-Path $here -Parent
$csc = Get-ChildItem "$env:WINDIR\Microsoft.NET\Framework64\v4*\csc.exe" | Select-Object -Last 1 -ExpandProperty FullName
$fw = Split-Path $csc
$utf8 = New-Object Text.UTF8Encoding $false

$version = ([IO.File]::ReadAllText("$here\version.txt")).Trim()
$notes = if (Test-Path "$here\neu.txt") { ([IO.File]::ReadAllText("$here\neu.txt", [Text.Encoding]::UTF8)).Trim() } else { '' }
$repo = if (Test-Path "$here\repo.txt") { ([IO.File]::ReadAllText("$here\repo.txt")).Trim() } else { '' }
$updateUrl = if ($repo) { "https://github.com/$repo/releases/latest/download/" } else { '' }
$homeUrl = if ($repo) { "https://github.com/$repo" } else { '' }

$tmp = Join-Path $env:TEMP 'spielhalle_build'
if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
$dist = Join-Path $here 'dist'
if (-not (Test-Path $dist)) { New-Item -ItemType Directory $dist | Out-Null }

# Versionsangaben für beide Programme
$v4 = ($version.Split('.') + @('0', '0', '0'))[0..3] -join '.'
[IO.File]::WriteAllText("$tmp\Version.cs", @"
[assembly: System.Reflection.AssemblyVersion("$v4")]
[assembly: System.Reflection.AssemblyFileVersion("$v4")]
[assembly: System.Reflection.AssemblyInformationalVersion("$version")]
[assembly: System.Reflection.AssemblyProduct("Spielhalle")]
[assembly: System.Reflection.AssemblyCompany("Spielhalle")]
[assembly: System.Reflection.AssemblyCopyright("Spielhalle")]
"@, $utf8)

function Compile($out, $sources, $extra) {
  $refs = @('System.dll', 'System.Core.dll', 'System.Drawing.dll', 'System.Windows.Forms.dll', 'System.Management.dll', 'System.Web.Extensions.dll',
            "$fw\System.IO.Compression.dll", "$fw\System.IO.Compression.FileSystem.dll") | ForEach-Object { "/r:$_" }
  $a = @('/nologo', '/optimize+', '/codepage:65001', '/nowarn:0168,0649') + $refs + $extra + @("/out:$out") + $sources
  & $csc @a
  if ($LASTEXITCODE -ne 0) { throw "Kompilieren fehlgeschlagen: $out" }
}

# 1) Icon
Compile "$tmp\mkicon.exe" @("$here\mkicon.cs", "$here\Logo.cs") @('/target:exe')
& "$tmp\mkicon.exe" "$here\spielhalle.ico" | Out-Null

# 2) App
Compile "$tmp\Spielhalle.exe" @("$here\Spielhalle.cs", "$here\Logo.cs", "$tmp\Version.cs") @('/target:winexe', "/win32icon:$here\spielhalle.ico")

# 3) Paket = genau so, wie es im Installationsordner liegen soll
$stage = Join-Path $tmp 'paket'
New-Item -ItemType Directory "$stage\app" | Out-Null
Copy-Item "$tmp\Spielhalle.exe" $stage
Copy-Item "$root\Launcher.html" "$stage\app\"
Copy-Item "$root\spiele" "$stage\app\" -Recurse
Get-ChildItem "$stage\app\spiele" -Recurse -Include '*.ps1' | Remove-Item -Force
[IO.File]::WriteAllText("$stage\update-repo.txt", $repo, $utf8)
[IO.File]::WriteAllText("$stage\neu.txt", $notes, $utf8)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = Join-Path $tmp 'payload.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip, [IO.Compression.CompressionLevel]::Optimal, $false)
[IO.File]::WriteAllText("$tmp\homepage.txt", $homeUrl, $utf8)

# 4) Setup mit eingebautem Paket
$setup = Join-Path $dist 'Spielhalle-Setup.exe'
Compile $setup @("$here\Setup.cs", "$here\Logo.cs", "$tmp\Version.cs") @('/target:winexe', "/win32icon:$here\spielhalle.ico", "/resource:$zip,payload.zip", "/resource:$tmp\homepage.txt,homepage.txt")
Copy-Item $setup "$root\Spielhalle-Setup.exe" -Force

# 5) version.json für die Online-Updates
$sha = (Get-FileHash $setup -Algorithm SHA256).Hash
$json = [ordered]@{ version = $version; notes = $notes; setup = 'Spielhalle-Setup.exe'; sha256 = $sha; date = (Get-Date -Format 'yyyy-MM-dd') } | ConvertTo-Json
[IO.File]::WriteAllText("$dist\version.json", $json, $utf8)

Remove-Item -LiteralPath $tmp -Recurse -Force
"Spielhalle $version gebaut: {0:N0} KB  (Updates: {1})" -f ((Get-Item $setup).Length / 1KB), $(if ($repo) { 'GitHub-Projekt ' + $repo } else { 'noch kein GitHub-Repo eingetragen' })
