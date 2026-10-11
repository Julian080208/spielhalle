# =====================================================================
#  Baut Spielhalle.exe (eine einzige Datei) mit Windows-Bordmitteln.
#  Aufruf:   .\app\build.ps1 -Version 2.0.0
#  Ergebnis: app\dist\Spielhalle.exe und Spielhalle.exe.sha256
#  Der WebView2-Baustein (Microsoft, NuGet) wird mit fester Version und
#  Prüfsumme geladen und in die exe eingebaut.
# =====================================================================
param([string]$Version = '0.0.0')
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$csc = Get-ChildItem "$env:WINDIR\Microsoft.NET\Framework64\v4*\csc.exe" | Select-Object -Last 1 -ExpandProperty FullName
$fw = Split-Path $csc
$utf8 = New-Object Text.UTF8Encoding $false
$tmp = Join-Path $env:TEMP 'spielhalle_build'
if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
$dist = Join-Path $here 'dist'
New-Item -ItemType Directory $dist -Force | Out-Null

# WebView2-Baustein
$wvVersion = '1.0.2903.40'
$wvSha = 'EF128016DD1E51C59178C827ED5B8AA3322C57AFA8675D930F8109505542AD74'
$wvZip = Join-Path $here "webview2-$wvVersion.zip"
if (-not (Test-Path $wvZip) -or (Get-FileHash $wvZip -Algorithm SHA256).Hash -ne $wvSha) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/$wvVersion" -OutFile $wvZip -UseBasicParsing
  if ((Get-FileHash $wvZip -Algorithm SHA256).Hash -ne $wvSha) { Remove-Item $wvZip; throw 'WebView2-Paket: Prüfsumme stimmt nicht' }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$wv = Join-Path $tmp 'wv2'
[IO.Compression.ZipFile]::ExtractToDirectory($wvZip, $wv)
$core = "$wv\lib\net462\Microsoft.Web.WebView2.Core.dll"
$winforms = "$wv\lib\net462\Microsoft.Web.WebView2.WinForms.dll"

# Versionsangaben
$v4 = ($Version.Split('.') + @('0', '0', '0'))[0..3] -join '.'
[IO.File]::WriteAllText("$tmp\Version.cs", @"
[assembly: System.Reflection.AssemblyVersion("$v4")]
[assembly: System.Reflection.AssemblyFileVersion("$v4")]
[assembly: System.Reflection.AssemblyInformationalVersion("$Version")]
"@, $utf8)

# Die DLLs landen als Ressourcen in der exe; die App legt sie beim Start neben sich ab
$res = @("/resource:$core,wv2/Microsoft.Web.WebView2.Core.dll", "/resource:$winforms,wv2/Microsoft.Web.WebView2.WinForms.dll")
foreach ($arch in 'x86', 'x64', 'arm64') { $res += "/resource:$wv\runtimes\win-$arch\native\WebView2Loader.dll,wv2/runtimes/win-$arch/native/WebView2Loader.dll" }

$refs = @('System.dll', 'System.Core.dll', 'System.Drawing.dll', 'System.Windows.Forms.dll', 'System.Web.Extensions.dll',
          "$fw\System.IO.Compression.dll", "$fw\System.IO.Compression.FileSystem.dll", $core, $winforms) | ForEach-Object { "/r:$_" }
$exe = Join-Path $dist 'Spielhalle.exe'
$a = @('/nologo', '/optimize+', '/codepage:65001', '/target:winexe', "/win32icon:$here\spielhalle.ico", "/out:$exe") + $refs + $res + @("$here\Spielhalle.cs", "$tmp\Version.cs")
& $csc @a
if ($LASTEXITCODE -ne 0) { throw 'Kompilieren fehlgeschlagen' }

$sha = (Get-FileHash $exe -Algorithm SHA256).Hash
[IO.File]::WriteAllText("$dist\Spielhalle.exe.sha256", "$sha  Spielhalle.exe", $utf8)
Remove-Item -LiteralPath $tmp -Recurse -Force
"Spielhalle $Version gebaut: {0:N0} KB" -f ((Get-Item $exe).Length / 1KB)
