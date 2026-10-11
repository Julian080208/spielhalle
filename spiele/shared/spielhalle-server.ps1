# =====================================================================
#  Spielhalle – kleiner lokaler Webserver (nur für diesen PC)
#  Wird von "Spielhalle starten.bat" unsichtbar gestartet. Er wird für
#  das YouTube-Kino gebraucht: YouTube-Videos laufen nur eingebettet,
#  wenn die Seite von einem Server kommt (nicht direkt als Datei).
#  Lauscht ausschließlich auf localhost und beendet sich nach 6 Stunden
#  ohne Anfragen von selbst.
# =====================================================================
$ErrorActionPreference = 'SilentlyContinue'
$port = 8777
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { exit }   # läuft schon -> nichts tun

$mime = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.webp' = 'image/webp' }
$last = Get-Date
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Send($ctx, [byte[]]$bytes, $type, $code = 200) {
  $r = $ctx.Response
  $r.StatusCode = $code
  $r.ContentType = $type
  $r.Headers.Add('Access-Control-Allow-Origin', '*')
  $r.Headers.Add('Cache-Control', 'no-store')
  $r.ContentLength64 = $bytes.Length
  $r.OutputStream.Write($bytes, 0, $bytes.Length)
  $r.Close()
}
function SendText($ctx, $text, $type, $code = 200) { Send $ctx ([Text.Encoding]::UTF8.GetBytes($text)) $type $code }

while ($listener.IsListening) {
  $task = $listener.GetContextAsync()
  while (-not $task.AsyncWaitHandle.WaitOne(60000)) {
    if (((Get-Date) - $last).TotalHours -gt 6) { $listener.Stop(); exit }
  }
  $ctx = $task.Result
  $last = Get-Date
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($path -eq '__ping') { SendText $ctx '{"ok":true}' 'application/json'; continue }
    if ($path -eq '__yt') {
      # YouTube-Suche: Ergebnisseite laden und die eingebetteten Daten zurückgeben
      $q = $ctx.Request.QueryString['q']
      $url = 'https://www.youtube.com/results?hl=de&gl=DE&search_query=' + [Uri]::EscapeDataString($q)
      $wc = New-Object System.Net.WebClient
      $wc.Encoding = [Text.Encoding]::UTF8
      $wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36')
      $wc.Headers.Add('Accept-Language', 'de-DE,de;q=0.9')
      $html = $wc.DownloadString($url)
      $a = $html.IndexOf('var ytInitialData = ')
      if ($a -lt 0) { SendText $ctx '{}' 'application/json' 502; continue }
      $a += 20
      $b = $html.IndexOf(';</script>', $a)
      SendText $ctx $html.Substring($a, $b - $a) 'application/json; charset=utf-8'
      continue
    }
    if ($path -eq '') { $path = 'Launcher.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $root $path))
    if ($full.StartsWith($root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
      Send $ctx ([IO.File]::ReadAllBytes($full)) $type
    } else { SendText $ctx 'Nicht gefunden' 'text/plain; charset=utf-8' 404 }
  } catch {
    try { SendText $ctx ('Fehler: ' + $_.Exception.Message) 'text/plain; charset=utf-8' 500 } catch {}
  }
}
