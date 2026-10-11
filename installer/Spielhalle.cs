// =====================================================================
//  Spielhalle.exe – die Spielhalle als eigene Windows-App
//  * startet einen kleinen Webserver nur für diesen PC (localhost:8777),
//    damit u. a. das YouTube-Kino funktioniert
//  * öffnet die Spielhalle in einem eigenen Fenster ohne Browserleiste
//    (Edge im App-Modus mit eigenem Profil) und beendet sich, sobald
//    das Fenster geschlossen wird
//  * Online-Updates: prüft beim Start und alle 20 Minuten die neueste
//    Version auf GitHub (Adresse in update-url.txt), lädt das neue
//    Setup herunter, prüft es (SHA-256) und installiert es still
// =====================================================================
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Management;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Spielhalle")]

static class App
{
    public const int Port = 8777;
    public static readonly string Url = "http://localhost:" + Port + "/";
    static string Dir, AppDir, DataDir;
    static DateTime lastHit = DateTime.Now;
    static readonly object updLock = new object();
    static UpdateInfo pending;          // gefundene neuere Version
    static int dlProgress = -1;         // Download-Fortschritt 0..100, -1 = keiner
    static string updateNote = "";

    public static string Version
    {
        get
        {
            var a = (AssemblyInformationalVersionAttribute)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(AssemblyInformationalVersionAttribute));
            return a != null ? a.InformationalVersion : "0.0.0";
        }
    }

    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    // kleines Protokoll im Installationsordner (protokoll.txt), hilft bei Problemen
    public static void Log(string m)
    {
        try
        {
            string f = Path.Combine(Dir, "protokoll.txt");
            if (File.Exists(f) && new FileInfo(f).Length > 200000) File.Delete(f);
            File.AppendAllText(f, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + m + Environment.NewLine);
        }
        catch { }
    }

    [STAThread]
    static void Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        Dir = Path.GetDirectoryName(Application.ExecutablePath);
        AppDir = Path.Combine(Dir, "app");
        DataDir = Path.Combine(Dir, "Daten");
        AppDomain.CurrentDomain.UnhandledException += (s, e) => Log("Absturz: " + e.ExceptionObject);
        Log("Start Version " + Version);
        try { File.Delete(Path.Combine(Dir, "Spielhalle.old.exe")); } catch { }
        Application.EnableVisualStyles();
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2

        // Läuft die Spielhalle schon? Dann nur ein weiteres Fenster öffnen.
        var listener = new HttpListener();
        listener.Prefixes.Add(Url);
        try { listener.Start(); }
        catch (Exception e) { Log("Läuft schon (Port belegt): " + e.Message); OpenWindow(); return; }

        var splash = new Splash();
        bool windowOpened = false;
        splash.Shown += delegate
        {
            new Thread(delegate ()
            {
                // 1) Update beim Start (wenn eingeschaltet und online)
                if (AutoUpdate())
                {
                    splash.SetStatus("Suche nach Updates …");
                    UpdateInfo u = null;
                    try { u = CheckUpdate(6000); Log("Update-Prüfung: " + (u == null ? "aktuell" : "neu " + u.version)); }
                    catch (Exception e) { updateNote = "Update-Prüfung fehlgeschlagen: " + e.Message; Log(updateNote); }
                    if (u != null)
                    {
                        try
                        {
                            splash.SetStatus("Neue Version " + u.version + " wird geladen …");
                            string setup = Download(u, delegate (int p) { splash.SetStatus("Neue Version " + u.version + " wird geladen … " + p + " %", p); });
                            splash.SetStatus("Version " + u.version + " wird installiert …");
                            if (RunSetup(setup)) return;
                        }
                        catch (Exception e) { updateNote = "Update fehlgeschlagen: " + e.Message; Log(updateNote); lock (updLock) pending = u; }
                    }
                }
                if (!File.Exists(Path.Combine(AppDir, "Launcher.html")))
                {
                    splash.Fail("Die Spieldateien fehlen. Bitte die Spielhalle neu installieren.");
                    return;
                }
                // 2) Server, Umzug der alten Spielstände, Fenster
                new Thread(delegate () { Serve(listener); }) { IsBackground = true }.Start();
                new Thread(UpdateLoop) { IsBackground = true }.Start();
                try { Migrate(splash); } catch { }
                splash.SetStatus("Spielhalle wird geöffnet …");
                windowOpened = OpenWindow();
                Thread.Sleep(1200);
                splash.CloseSafe();
            }) { IsBackground = true }.Start();
        };
        Application.Run(splash);
        if (!splash.Ok) { try { listener.Stop(); } catch { } return; }

        // Server laufen lassen, bis das Spielhallen-Fenster geschlossen ist
        Thread.Sleep(10000);
        if (windowOpened) { while (EdgeRunning()) Thread.Sleep(4000); }
        else { while ((DateTime.Now - lastHit).TotalHours < 3) Thread.Sleep(30000); }
        try { listener.Stop(); } catch { }
    }

    // ---------------------------------------------------------------- Fenster
    static string BrowserPath()
    {
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string la = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] c = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(la, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(la, @"Google\Chrome\Application\chrome.exe"),
        };
        foreach (string p in c) if (File.Exists(p)) return p;
        return null;
    }

    static bool OpenWindow()
    {
        string b = BrowserPath();
        if (b == null) { try { Process.Start(Url + "Launcher.html"); } catch { } return false; }
        string a = "--app=" + Url + "Launcher.html" +
                   " --user-data-dir=\"" + DataDir + "\"" +
                   " --no-first-run --no-default-browser-check --disable-sync --hide-crash-restore-bubble" +
                   " --start-maximized --autoplay-policy=no-user-gesture-required --disable-features=Translate";
        string extra = Environment.GetEnvironmentVariable("SPIELHALLE_BROWSER_ARGS");
        if (!string.IsNullOrEmpty(extra)) a += " " + extra;
        Log("Fenster: " + b);
        Process.Start(b, a);
        return true;
    }

    static List<int> AppBrowserPids()
    {
        var ids = new List<int>();
        try
        {
            using (var s = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='msedge.exe' OR Name='chrome.exe'"))
                foreach (ManagementObject o in s.Get())
                {
                    string cl = o["CommandLine"] as string;
                    if (cl != null && cl.IndexOf(DataDir, StringComparison.OrdinalIgnoreCase) >= 0) ids.Add(Convert.ToInt32(o["ProcessId"]));
                }
        }
        catch { ids.Add(-1); }
        return ids;
    }
    static bool EdgeRunning() { return AppBrowserPids().Count > 0; }

    // ---------------------------------------------------------------- Server
    static void Serve(HttpListener l)
    {
        while (l.IsListening)
        {
            HttpListenerContext ctx;
            try { ctx = l.GetContext(); } catch { return; }
            ThreadPool.QueueUserWorkItem(delegate { Handle(ctx); });
        }
    }

    static void Send(HttpListenerContext ctx, byte[] b, string type, int code = 200)
    {
        var r = ctx.Response;
        r.StatusCode = code;
        r.ContentType = type;
        r.Headers.Add("Access-Control-Allow-Origin", "*");
        r.Headers.Add("Access-Control-Allow-Private-Network", "true");
        r.Headers.Add("Cache-Control", "no-store");
        r.ContentLength64 = b.Length;
        r.OutputStream.Write(b, 0, b.Length);
        r.Close();
    }
    static void Text(HttpListenerContext ctx, string t, string type, int code = 200) { Send(ctx, Encoding.UTF8.GetBytes(t), type, code); }
    static void Json(HttpListenerContext ctx, object o, int code = 200) { Text(ctx, new JavaScriptSerializer().Serialize(o), "application/json; charset=utf-8", code); }

    static string Mime(string f)
    {
        switch (Path.GetExtension(f).ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".png": return "image/png";
            case ".jpg": case ".jpeg": return "image/jpeg";
            case ".gif": return "image/gif";
            case ".svg": return "image/svg+xml";
            case ".ico": return "image/x-icon";
            case ".webp": return "image/webp";
            case ".mp3": return "audio/mpeg";
            case ".ogg": return "audio/ogg";
            case ".wav": return "audio/wav";
            case ".woff2": return "font/woff2";
            default: return "application/octet-stream";
        }
    }

    static object Info()
    {
        UpdateInfo u; lock (updLock) u = pending;
        string notes = "";
        try { notes = File.ReadAllText(Path.Combine(Dir, "neu.txt"), Encoding.UTF8).Trim(); } catch { }
        return new Dictionary<string, object> {
            { "app", true }, { "version", Version }, { "notes", notes }, { "note", updateNote },
            { "auto", AutoUpdate() }, { "online", UpdatesConfigured() }, { "login", login }, { "loginText", LoginText() },
            { "update", u == null ? null : new Dictionary<string, object> { { "version", u.version }, { "notes", u.notes ?? "" } } },
            { "progress", dlProgress },
        };
    }

    static void Handle(HttpListenerContext ctx)
    {
        lastHit = DateTime.Now;
        try
        {
            if (ctx.Request.HttpMethod == "OPTIONS")
            {
                ctx.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST");
                ctx.Response.Headers.Add("Access-Control-Allow-Headers", "*");
                Text(ctx, "", "text/plain", 204);
                return;
            }
            string path = Uri.UnescapeDataString(ctx.Request.Url.AbsolutePath.TrimStart('/'));
            switch (path)
            {
                case "__ping": Text(ctx, "{\"ok\":true,\"app\":true}", "application/json"); return;
                case "__info": Json(ctx, Info()); return;
                case "__check":
                    try { Token(true); var u = CheckUpdate(10000); lock (updLock) pending = u; updateNote = u == null ? "Aktuell" : ""; }
                    catch (Exception e) { updateNote = LoginText() != "" ? LoginText() : "Keine Verbindung zum Update-Server (" + e.Message + ")"; Log("Prüfen: " + updateNote); }
                    Json(ctx, Info());
                    return;
                case "__login":
                    if (ctx.Request.HttpMethod != "POST") { Text(ctx, "POST", "text/plain", 405); return; }
                    OpenLogin();
                    Json(ctx, Info());
                    return;
                case "__update":
                    if (ctx.Request.HttpMethod != "POST") { Text(ctx, "POST", "text/plain", 405); return; }
                    StartUpdateNow();
                    Json(ctx, Info());
                    return;
                case "__auto":
                    SetAutoUpdate(ctx.Request.QueryString["an"] != "0");
                    Json(ctx, Info());
                    return;
                case "__yt": YouTube(ctx); return;
                case "__import": Import(ctx); return;
            }
            if (path == "") path = "Launcher.html";
            string full = Path.GetFullPath(Path.Combine(AppDir, path.Replace('/', '\\')));
            if (full.StartsWith(AppDir + "\\", StringComparison.OrdinalIgnoreCase) && File.Exists(full))
                Send(ctx, File.ReadAllBytes(full), Mime(full));
            else
                Text(ctx, "Nicht gefunden", "text/plain; charset=utf-8", 404);
        }
        catch (Exception e)
        {
            try { Text(ctx, "Fehler: " + e.Message, "text/plain; charset=utf-8", 500); } catch { }
        }
    }

    // YouTube-Suche: Ergebnisseite laden und die eingebetteten Daten zurückgeben
    static void YouTube(HttpListenerContext ctx)
    {
        string q = ctx.Request.QueryString["q"] ?? "";
        using (var wc = new WebClient())
        {
            wc.Encoding = Encoding.UTF8;
            wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36");
            wc.Headers.Add("Accept-Language", "de-DE,de;q=0.9");
            string html = wc.DownloadString("https://www.youtube.com/results?hl=de&gl=DE&search_query=" + Uri.EscapeDataString(q));
            int a = html.IndexOf("var ytInitialData = ");
            if (a < 0) { Text(ctx, "{}", "application/json", 502); return; }
            a += 20;
            int b = html.IndexOf(";</script>", a);
            Text(ctx, html.Substring(a, b - a), "application/json; charset=utf-8");
        }
    }

    // Spielstände der alten Datei-Version (siehe umzug.html)
    static void Import(HttpListenerContext ctx)
    {
        string f = Path.Combine(Dir, "umzug.json");
        if (ctx.Request.HttpMethod == "POST")
        {
            using (var sr = new StreamReader(ctx.Request.InputStream, Encoding.UTF8))
                File.WriteAllText(f, sr.ReadToEnd(), new UTF8Encoding(false));
            Text(ctx, "{\"ok\":true}", "application/json");
            return;
        }
        if (File.Exists(f)) { Text(ctx, File.ReadAllText(f, Encoding.UTF8), "application/json; charset=utf-8"); return; }
        if (File.Exists(Path.Combine(Dir, "umzug.erledigt"))) { Text(ctx, "{}", "application/json"); return; }
        Text(ctx, "{}", "application/json", 404);
    }

    // ---------------------------------------------------------------- Online-Updates
    // Die Updates liegen als Release im (privaten) GitHub-Projekt aus update-repo.txt.
    // Zugriff mit der GitHub-Anmeldung dieses PCs (GitHub CLI: „gh auth token“) –
    // der Schlüssel wird nur im Speicher gehalten und nie gespeichert oder protokolliert.
    public class UpdateInfo { public string version, notes, setup, sha256, date, setupUrl; }

    static string login = "";   // "", "ok", "public", "nogh", "nologin", "noaccess"
    static string token; static DateTime tokenAt = DateTime.MinValue;

    static string TestUrl()
    {
        string env = Environment.GetEnvironmentVariable("SPIELHALLE_UPDATE_URL");
        return string.IsNullOrEmpty(env) ? "" : env.TrimEnd('/') + "/";
    }
    static string Repo()
    {
        try { return File.ReadAllText(Path.Combine(Dir, "update-repo.txt")).Trim(); } catch { return ""; }
    }
    static bool UpdatesConfigured() { return TestUrl() != "" || Repo() != ""; }
    static string CurrentVersion()
    {
        string t = Environment.GetEnvironmentVariable("SPIELHALLE_TEST_VERSION");
        return string.IsNullOrEmpty(t) ? Version : t;
    }

    static string GhPath()
    {
        if (Environment.GetEnvironmentVariable("SPIELHALLE_TEST_NOGH") == "1") return null;
        string[] c = {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"GitHub CLI\gh.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\GitHub CLI\gh.exe"),
        };
        foreach (string p in c) if (File.Exists(p)) return p;
        foreach (string d in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(';'))
        {
            try { string p = Path.Combine(d.Trim(), "gh.exe"); if (d.Trim() != "" && File.Exists(p)) return p; } catch { }
        }
        return null;
    }

    static string Token(bool fresh)
    {
        if (!fresh && tokenAt > DateTime.Now.AddMinutes(-30)) return token;
        token = null; tokenAt = DateTime.Now;
        string gh = GhPath();
        if (gh == null) return null;
        try
        {
            var psi = new ProcessStartInfo(gh, "auth token --hostname github.com");
            psi.UseShellExecute = false; psi.RedirectStandardOutput = true; psi.RedirectStandardError = true; psi.CreateNoWindow = true;
            using (var p = Process.Start(psi))
            {
                string o = p.StandardOutput.ReadToEnd().Trim();
                p.WaitForExit(8000);
                if (p.ExitCode == 0 && o.Length > 10 && o.IndexOf(' ') < 0) token = o;
            }
        }
        catch (Exception e) { Log("GitHub-Anmeldung nicht lesbar: " + e.Message); }
        return token;
    }

    static string LoginText()
    {
        switch (login)
        {
            case "nogh": return "Für Updates einmal bei GitHub anmelden (GitHub CLI fehlt noch).";
            case "nologin": return "Für Updates einmal bei GitHub anmelden.";
            case "noaccess": return "Das angemeldete GitHub-Konto hat keinen Zugriff auf die Spielhalle.";
            default: return "";
        }
    }

    static bool AutoUpdate()
    {
        try { return File.ReadAllText(Path.Combine(Dir, "einstellungen.txt")).IndexOf("autoupdate=0") < 0; } catch { return true; }
    }
    static void SetAutoUpdate(bool on)
    {
        try { File.WriteAllText(Path.Combine(Dir, "einstellungen.txt"), "autoupdate=" + (on ? 1 : 0)); } catch { }
    }

    static HttpWebRequest Req(string url, int timeout, string tok, string accept)
    {
        var r = (HttpWebRequest)WebRequest.Create(url);
        r.Timeout = timeout; r.ReadWriteTimeout = Math.Max(timeout, 30000);
        r.UserAgent = "Spielhalle/" + Version;
        r.AllowAutoRedirect = true;
        r.CachePolicy = new System.Net.Cache.RequestCachePolicy(System.Net.Cache.RequestCacheLevel.NoCacheNoStore);
        if (tok != null) r.Headers["Authorization"] = "Bearer " + tok;
        if (accept != null) r.Accept = accept;
        return r;
    }

    // Anfrage mit Anmeldung; bei einer Weiterleitung (Dateien liegen bei GitHub auf einem
    // Speicherserver) geht es ohne Anmeldung weiter – der Schlüssel bleibt bei GitHub
    static HttpWebResponse Open(string url, int timeout, string tok, string accept)
    {
        var r = Req(url, timeout, tok, accept);
        r.AllowAutoRedirect = false;
        var resp = (HttpWebResponse)r.GetResponse();
        int code = (int)resp.StatusCode;
        if (code >= 300 && code < 400)
        {
            string loc = resp.Headers["Location"];
            resp.Close();
            return (HttpWebResponse)Req(loc, timeout, null, null).GetResponse();
        }
        return resp;
    }
    static string ReadAll(HttpWebResponse r)
    {
        using (r) using (var sr = new StreamReader(r.GetResponseStream(), Encoding.UTF8)) return sr.ReadToEnd();
    }

    // liefert die neuere Version oder null
    static UpdateInfo CheckUpdate(int timeout)
    {
        var ser = new JavaScriptSerializer();
        UpdateInfo u;
        string test = TestUrl();
        if (test != "")
        {
            u = ser.Deserialize<UpdateInfo>(ReadAll(Open(test + "version.json?t=" + DateTime.UtcNow.Ticks, timeout, null, null)));
            if (u != null) u.setupUrl = test + (string.IsNullOrEmpty(u.setup) ? "Spielhalle-Setup.exe" : u.setup);
        }
        else
        {
            string repo = Repo();
            if (repo == "") return null;
            string tok = Token(false);
            Dictionary<string, object> rel;
            try
            {
                rel = ser.Deserialize<Dictionary<string, object>>(ReadAll(Open("https://api.github.com/repos/" + repo + "/releases/latest", timeout, tok, "application/vnd.github+json")));
            }
            catch (WebException e)
            {
                var hr = e.Response as HttpWebResponse;
                int code = hr == null ? 0 : (int)hr.StatusCode;
                if (code == 401 || code == 403 || code == 404)
                {
                    if (tok == null) login = GhPath() == null ? "nogh" : "nologin";
                    else if (code == 401) { login = "nologin"; token = null; tokenAt = DateTime.MinValue; }
                    else login = "noaccess";
                    throw new Exception(LoginText());
                }
                throw;
            }
            login = tok != null ? "ok" : "public";
            string vUrl = null, sUrl = null;
            object assets;
            if (rel.TryGetValue("assets", out assets) && assets is System.Collections.IEnumerable)
                foreach (object a in (System.Collections.IEnumerable)assets)
                {
                    var d = a as Dictionary<string, object>;
                    if (d == null) continue;
                    string n = d["name"] as string, url = d["url"] as string;
                    if (n == "version.json") vUrl = url;
                    else if (n == "Spielhalle-Setup.exe") sUrl = url;
                }
            if (vUrl == null || sUrl == null) return null;
            u = ser.Deserialize<UpdateInfo>(ReadAll(Open(vUrl, timeout, tok, "application/octet-stream")));
            if (u != null) u.setupUrl = sUrl;
        }
        if (u == null || string.IsNullOrEmpty(u.version)) return null;
        Version have, got;
        if (!System.Version.TryParse(CurrentVersion(), out have) || !System.Version.TryParse(u.version, out got)) return null;
        return got > have ? u : null;
    }

    static string Download(UpdateInfo u, Action<int> progress)
    {
        string dir = Path.Combine(Path.GetTempPath(), "Spielhalle-Update");
        Directory.CreateDirectory(dir);
        string file = Path.Combine(dir, "Spielhalle-Setup-" + u.version + ".exe");
        bool gh = TestUrl() == "";
        using (var resp = Open(u.setupUrl, 15000, gh ? Token(false) : null, gh ? "application/octet-stream" : null))
        using (var src = resp.GetResponseStream())
        using (var dst = File.Create(file))
        {
            long total = resp.ContentLength, done = 0; int last = -1;
            var buf = new byte[65536]; int n;
            while ((n = src.Read(buf, 0, buf.Length)) > 0)
            {
                dst.Write(buf, 0, n); done += n;
                int p = total > 0 ? (int)(done * 100 / total) : 0;
                if (p != last) { last = p; dlProgress = p; if (progress != null) progress(p); }
            }
        }
        // Sicherheitsprüfung: muss eine Windows-Programmdatei mit der veröffentlichten Prüfsumme sein
        byte[] head = new byte[2];
        using (var f = File.OpenRead(file)) f.Read(head, 0, 2);
        if (head[0] != 'M' || head[1] != 'Z') { File.Delete(file); throw new Exception("Download ist keine gültige Setup-Datei"); }
        if (!string.IsNullOrEmpty(u.sha256))
        {
            string h;
            using (var sha = SHA256.Create()) using (var f = File.OpenRead(file))
                h = BitConverter.ToString(sha.ComputeHash(f)).Replace("-", "");
            if (!h.Equals(u.sha256, StringComparison.OrdinalIgnoreCase)) { File.Delete(file); throw new Exception("Prüfsumme stimmt nicht"); }
        }
        return file;
    }

    // Setup still ausführen: es beendet die Spielhalle, installiert und startet sie neu.
    // Liefert false nur im Testmodus (SPIELHALLE_TEST_NOSETUP), dann läuft die App normal weiter.
    static bool RunSetup(string setup)
    {
        if (Environment.GetEnvironmentVariable("SPIELHALLE_TEST_NOSETUP") == "1")
        {
            Log("Test: Setup geladen und geprüft (" + new FileInfo(setup).Length / 1024 + " KB), wird nicht gestartet");
            dlProgress = -1;
            return false;
        }
        Log("Starte Setup: " + setup);
        var psi = new ProcessStartInfo(setup, "--still --neustart --ziel \"" + Dir + "\"");
        psi.UseShellExecute = false;
        Process.Start(psi);
        Environment.Exit(0);
        return true;
    }

    // Anmeldung bei GitHub in einem eigenen Fenster (installiert vorher bei Bedarf die GitHub CLI)
    static void OpenLogin()
    {
        string cmd = Path.Combine(Path.GetTempPath(), "Spielhalle-GitHub-Anmeldung.cmd");
        string[] lines = {
            "@echo off",
            "title Spielhalle - Anmeldung bei GitHub",
            "set \"GH=%ProgramFiles%\\GitHub CLI\\gh.exe\"",
            "if exist \"%GH%\" goto login",
            "echo Fuer die Updates wird die GitHub CLI gebraucht. Sie wird jetzt installiert ...",
            "echo.",
            "winget install --id GitHub.cli -e --source winget",
            "if not exist \"%GH%\" goto fehler",
            ":login",
            "echo.",
            "echo  Anmeldung fuer die Spielhallen-Updates:",
            "echo   1. Frage \"Authenticate Git ... (Y/n)\": einfach Enter druecken.",
            "echo   2. Es erscheint ein Code (z.B. ABCD-1234). Enter druecken, der Browser geht auf.",
            "echo   3. Bei GitHub anmelden, Code eingeben, \"Authorize GitHub CLI\" klicken.",
            "echo.",
            "\"%GH%\" auth login --hostname github.com --git-protocol https --web",
            "echo.",
            "echo Fertig! Dieses Fenster kann zu. Die Spielhalle sucht gleich nach Updates.",
            "pause",
            "exit /b",
            ":fehler",
            "echo Die Installation hat nicht geklappt. Bitte \"winget install GitHub.cli\" von Hand ausfuehren.",
            "pause",
        };
        File.WriteAllText(cmd, string.Join("\r\n", lines) + "\r\n", Encoding.ASCII);
        Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + cmd + "\"") { UseShellExecute = true });
        token = null; tokenAt = DateTime.MinValue;
    }

    static void StartUpdateNow()
    {
        UpdateInfo u; lock (updLock) u = pending;
        if (u == null || dlProgress >= 0) return;
        dlProgress = 0;
        new Thread(delegate ()
        {
            try
            {
                string setup = Download(u, null);
                dlProgress = 100;
                Thread.Sleep(1500); // Fenster zeigt kurz „wird installiert“
                foreach (int id in AppBrowserPids()) { try { if (id > 0) Process.GetProcessById(id).Kill(); } catch { } }
                RunSetup(setup);
            }
            catch (Exception e) { dlProgress = -1; updateNote = "Update fehlgeschlagen: " + e.Message; Log(updateNote); }
        }) { IsBackground = true }.Start();
    }

    static void UpdateLoop()
    {
        Thread.Sleep(TimeSpan.FromMinutes(2));
        while (true)
        {
            try { var u = CheckUpdate(10000); if (u != null) lock (updLock) pending = u; } catch { }
            Thread.Sleep(TimeSpan.FromMinutes(20));
        }
    }

    // ---------------------------------------------------------------- Umzug
    // Einmalig: Spielstände der alten Datei-Version (Edge, file://) übernehmen
    static void Migrate(Splash ui)
    {
        string flag = Path.Combine(Dir, "umzug.erledigt");
        if (File.Exists(flag)) return;
        string page = Path.Combine(AppDir, @"spiele\shared\umzug.html");
        string b = BrowserPath();
        if (b != null && b.EndsWith("msedge.exe", StringComparison.OrdinalIgnoreCase) && File.Exists(page))
        {
            ui.SetStatus("Spielstände werden übernommen …");
            string json = Path.Combine(Dir, "umzug.json");
            Process.Start(b, "--app=\"" + new Uri(page).AbsoluteUri + "\" --window-size=460,300");
            for (int i = 0; i < 40 && !File.Exists(json); i++) Thread.Sleep(250);
        }
        File.WriteAllText(flag, DateTime.Now.ToString("s"));
    }
}

// ==================================================================== Startfenster
class Splash : Form
{
    string status = "Wird gestartet …";
    bool failed;
    float k = 1, phase;
    int pct = -1;
    public bool Ok = true;
    readonly System.Windows.Forms.Timer anim = new System.Windows.Forms.Timer();

    public Splash()
    {
        using (var g = CreateGraphics()) k = g.DpiX / 96f;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(S(470), S(200));
        BackColor = Logo.Dunkel;
        DoubleBuffered = true;
        Text = "Spielhalle";
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        TopMost = true;
        anim.Interval = 16;
        anim.Tick += delegate { phase += 0.012f; if (phase > 1.4f) phase = -0.4f; Invalidate(); };
        anim.Start();
        Click += delegate { if (failed) { Ok = false; Close(); } };
    }
    int S(float v) { return (int)Math.Round(v * k); }

    public void SetStatus(string s, int percent = -1) { if (IsHandleCreated) BeginInvoke((MethodInvoker)delegate { status = s; pct = percent; Invalidate(); }); }
    public void Fail(string s)
    {
        if (!IsHandleCreated) return;
        BeginInvoke((MethodInvoker)delegate { failed = true; status = s + "  (Klicken zum Schließen)"; anim.Stop(); Invalidate(); });
    }
    public void CloseSafe() { if (IsHandleCreated) BeginInvoke((MethodInvoker)delegate { anim.Stop(); Close(); }); }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        using (var pen = new Pen(Color.FromArgb(50, 255, 255, 255))) g.DrawRectangle(pen, 0, 0, ClientSize.Width - 1, ClientSize.Height - 1);
        Logo.Draw(g, new RectangleF(S(34), S(46), S(92), S(92)));
        using (var f = new Font("Segoe UI Semibold", 26f))
        using (var b = new SolidBrush(Color.White))
            g.DrawString("Spielhalle", f, b, S(146), S(48));
        using (var f = new Font("Segoe UI", 8.5f))
        using (var b = new SolidBrush(Color.FromArgb(110, 112, 136)))
            g.DrawString("Version " + App.Version, f, b, S(150), S(178));
        using (var f = new Font("Segoe UI", 10.5f))
        using (var b = new SolidBrush(failed ? Color.FromArgb(255, 130, 130) : Color.FromArgb(170, 172, 196)))
            g.DrawString(status, f, b, new RectangleF(S(150), S(104), S(300), S(50)));
        var bar = new RectangleF(S(150), S(160), S(280), S(5));
        using (var bg = new SolidBrush(Color.FromArgb(40, 255, 255, 255))) g.FillRectangle(bg, bar);
        if (failed) return;
        RectangleF seg;
        if (pct >= 0) seg = new RectangleF(bar.X, bar.Y, bar.Width * pct / 100f, bar.Height);
        else
        {
            float w = bar.Width * 0.35f, x = bar.X + (bar.Width + w) * phase - w;
            seg = RectangleF.Intersect(bar, new RectangleF(x, bar.Y, w, bar.Height));
        }
        if (seg.Width > 1)
            using (var br = new LinearGradientBrush(RectangleF.Inflate(seg, 1, 1), Logo.Lila1, Logo.Lila2, 0f)) g.FillRectangle(br, seg);
    }
}
