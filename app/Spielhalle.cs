// =====================================================================
//  Spielhalle.exe – die ganze App in einer Datei
//
//  * Erster Start (z. B. aus „Downloads“): kopiert sich nach
//    %LOCALAPPDATA%\Spielhalle, legt Symbole auf Desktop und im Startmenü
//    an und startet von dort. Kein Installations-Assistent.
//  * Spiele und Launcher kommen direkt aus dem GitHub-Projekt (Zweig main):
//    beim Start und alle 10 Minuten wird nachgesehen, ob es etwas Neues gibt.
//  * Die App selbst aktualisiert sich über das neueste GitHub-Release.
//  * Eigenes Fenster mit WebView2 (in Windows eingebaut, fehlt es, wird es
//    von Microsoft nachinstalliert). Notlösung: Standardbrowser.
//  * Kleiner Webserver nur für diesen PC (localhost:8777) für die Spiele.
//
//  Gebaut mit dem csc aus .NET Framework 4 (C# 5) – siehe build.ps1.
// =====================================================================
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("Spielhalle")]
[assembly: AssemblyProduct("Spielhalle")]

static class App
{
    public const string Repo = "Julian080208/spielhalle";
    public const int Port = 8777;
    public static readonly string Url = "http://localhost:" + Port + "/";
    const string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\SpielhalleApp";

    public static string Home, Content, DataDir, Exe;
    static bool Test;                       // SPIELHALLE_TEST=1: keine Verknüpfungen, keine Registry, kein Selbst-Update
    static string branch = "main";
    static string contentSha = "", contentDate = "", note = "", appUpdate = "";
    static volatile bool contentChanged, checking;
    static readonly object updLock = new object();
    static DateTime lastHit = DateTime.Now;
    static HttpListener listener;
    public static Form Window;              // das offene Spielhallen-Fenster (für __zeigen)

    public static string Version
    {
        get
        {
            var a = (AssemblyInformationalVersionAttribute)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(AssemblyInformationalVersionAttribute));
            return a != null ? a.InformationalVersion : "0.0.0";
        }
    }

    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    // Protokoll im App-Ordner (protokoll.txt), hilft bei Problemen
    public static void Log(string m)
    {
        try
        {
            string f = Path.Combine(Home, "protokoll.txt");
            if (File.Exists(f) && new FileInfo(f).Length > 300000) File.Delete(f);
            File.AppendAllText(f, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + m + Environment.NewLine);
        }
        catch { }
    }

    [STAThread]
    static int Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        Application.EnableVisualStyles();
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2
        string env = Environment.GetEnvironmentVariable("SPIELHALLE_ORDNER");
        Home = Path.GetFullPath(string.IsNullOrEmpty(env) ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Spielhalle") : env).TrimEnd('\\');
        Content = Path.Combine(Home, "inhalt");
        DataDir = Path.Combine(Home, "Daten");
        Exe = Path.Combine(Home, "Spielhalle.exe");
        Test = Environment.GetEnvironmentVariable("SPIELHALLE_TEST") == "1";
        string b = Environment.GetEnvironmentVariable("SPIELHALLE_ZWEIG");
        if (!string.IsNullOrEmpty(b)) branch = b;
        Directory.CreateDirectory(Home);
        AppDomain.CurrentDomain.UnhandledException += (s, e) => Log("Absturz: " + e.ExceptionObject);

        if (Array.IndexOf(args, "--entfernen") >= 0) { Remove(); return 0; }

        // Erster Start von woanders (z. B. Downloads): einrichten und von dort starten
        if (!string.Equals(Path.GetFullPath(Application.ExecutablePath), Path.GetFullPath(Exe), StringComparison.OrdinalIgnoreCase))
        {
            try { Install(); }
            catch (Exception e)
            {
                Log("Einrichten fehlgeschlagen: " + e);
                MessageBox.Show("Die Spielhalle konnte nicht eingerichtet werden:\n\n" + e.Message, "Spielhalle", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }
            Process.Start(new ProcessStartInfo(Exe) { WorkingDirectory = Home });
            return 0;
        }

        Log("Start Version " + Version);
        try { File.Delete(Path.Combine(Home, "Spielhalle.alt.exe")); } catch { }

        // Läuft die Spielhalle schon? Dann ihr Fenster nach vorne holen.
        listener = new HttpListener();
        listener.Prefixes.Add(Url);
        bool afterUpdate = Array.IndexOf(args, "--neustart") >= 0;
        for (int i = 0; ; i++)
        {
            try { listener.Start(); break; }
            catch (Exception e)
            {
                if (afterUpdate && i < 20) { Thread.Sleep(500); listener = new HttpListener(); listener.Prefixes.Add(Url); continue; }
                Log("Läuft schon: " + e.Message);
                try { using (var wc = new WebClient()) if (wc.DownloadString(Url + "__zeigen") == "ok") return 0; } catch { }
                try { Process.Start(Url); } catch { }
                return 0;
            }
        }
        new Thread(Serve) { IsBackground = true }.Start();
        ReadContentState();
        try { ExtractWebView2(); } catch (Exception e) { Log("WebView2-Dateien: " + e.Message); }

        var splash = new Splash();
        bool ownWindow = false;
        splash.Shown += delegate
        {
            new Thread(delegate ()
            {
                // 1) neue App-Version? (dann wird sie installiert und neu gestartet)
                try { if (SelfUpdate(splash)) return; } catch (Exception e) { Log("App-Update: " + e.Message); }
                // 2) Spiele und Launcher von GitHub holen
                UpdateContent(splash);
                if (!File.Exists(Path.Combine(Content, "Launcher.html")))
                {
                    splash.Fail("Die Spiele konnten nicht geladen werden. Ist der PC mit dem Internet verbunden? " + note);
                    return;
                }
                // 3) eigenes Fenster vorbereiten
                ownWindow = Environment.GetEnvironmentVariable("SPIELHALLE_FENSTER") != "browser" && WebView2Ready(splash);
                splash.SetStatus("Spielhalle wird geöffnet …");
                splash.CloseSafe();
            }) { IsBackground = true }.Start();
        };
        Application.Run(splash);
        if (!splash.Ok) { try { listener.Stop(); } catch { } return 0; }

        new Thread(UpdateLoop) { IsBackground = true }.Start();
        if (ownWindow)
        {
            string err;
            try { err = RunOwnWindow(); } catch (Exception e) { err = e.ToString(); }
            if (err == null) { try { listener.Stop(); } catch { } return 0; }
            Log("Eigenes Fenster ging nicht, nehme Browser: " + err);
        }
        // Notlösung: Standardbrowser. Server laufen lassen, bis 3 Stunden lang nichts mehr kommt.
        try { Process.Start(Url + "Launcher.html"); } catch { }
        while ((DateTime.Now - lastHit).TotalHours < 3) Thread.Sleep(30000);
        try { listener.Stop(); } catch { }
        return 0;
    }

    // ================================================================ Einrichten / Entfernen
    static void Install()
    {
        Log("Einrichten nach " + Home + " (von " + Application.ExecutablePath + ")");
        if (!Test) RemoveOldVersion();
        // läuft die Spielhalle gerade? Die laufende Datei darf umbenannt, aber nicht überschrieben werden.
        if (File.Exists(Exe))
        {
            string old = Path.Combine(Home, "Spielhalle.alt.exe");
            try { File.Delete(old); } catch { }
            try { File.Delete(Exe); } catch { File.Move(Exe, old); }
        }
        File.Copy(Application.ExecutablePath, Exe, true);
        if (Test) return;
        Shortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Spielhalle.lnk"));
        Shortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Spielhalle.lnk"));
        using (var k = Registry.CurrentUser.CreateSubKey(UninstallKey))
        {
            k.SetValue("DisplayName", "Spielhalle");
            k.SetValue("DisplayIcon", Exe);
            k.SetValue("DisplayVersion", Version);
            k.SetValue("Publisher", "Spielhalle");
            k.SetValue("InstallLocation", Home);
            k.SetValue("UninstallString", "\"" + Exe + "\" --entfernen");
            k.SetValue("NoModify", 1, RegistryValueKind.DWord);
            k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
    }

    // Die frühere Version (mit Setup, in %LOCALAPPDATA%\Programs\Spielhalle) still entfernen
    static void RemoveOldVersion()
    {
        try
        {
            string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Spielhalle");
            string unins = Path.Combine(dir, "Deinstallieren.exe");
            if (!File.Exists(unins)) return;
            string tmp = Path.Combine(Path.GetTempPath(), "Spielhalle-alt-entfernen.exe");
            File.Copy(unins, tmp, true);
            using (var p = Process.Start(tmp, "--deinstallieren --ziel \"" + dir + "\" --still")) p.WaitForExit(60000);
            Log("Alte Version entfernt");
        }
        catch (Exception e) { Log("Alte Version entfernen: " + e.Message); }
    }

    static void Shortcut(string lnk)
    {
        try
        {
            Type t = Type.GetTypeFromProgID("WScript.Shell");
            object sh = Activator.CreateInstance(t);
            object sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { lnk });
            Type st = sc.GetType();
            st.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { Exe });
            st.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { Home });
            st.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { Exe + ",0" });
            st.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { "Spielhalle" });
            st.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
        }
        catch (Exception e) { Log("Verknüpfung " + lnk + ": " + e.Message); }
    }

    static void Remove()
    {
        if (MessageBox.Show("Spielhalle wirklich entfernen?\n\nDabei werden auch alle Spielstände gelöscht.", "Spielhalle entfernen",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        try { using (var wc = new WebClient()) wc.DownloadString(Url + "__beenden"); Thread.Sleep(2000); } catch { }
        foreach (string l in new[] {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Spielhalle.lnk"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Spielhalle.lnk") })
            try { File.Delete(l); } catch { }
        try { Registry.CurrentUser.DeleteSubKeyTree(UninstallKey, false); } catch { }
        // der Ordner mit dieser Datei wird kurz nach dem Beenden gelöscht
        var psi = new ProcessStartInfo("cmd.exe", "/c timeout /t 3 /nobreak >nul & rd /s /q \"" + Home + "\"");
        psi.WindowStyle = ProcessWindowStyle.Hidden; psi.CreateNoWindow = true;
        Process.Start(psi);
        MessageBox.Show("Die Spielhalle wurde entfernt.", "Spielhalle", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    // ================================================================ GitHub
    static HttpWebRequest Req(string url, int timeout, bool auth, string accept)
    {
        var r = (HttpWebRequest)WebRequest.Create(url);
        r.Timeout = timeout; r.ReadWriteTimeout = Math.Max(timeout, 60000);
        r.UserAgent = "Spielhalle/" + Version;
        r.AllowAutoRedirect = false;
        r.CachePolicy = new System.Net.Cache.RequestCachePolicy(System.Net.Cache.RequestCacheLevel.NoCacheNoStore);
        string tok = Environment.GetEnvironmentVariable("SPIELHALLE_GITHUB_TOKEN");
        if (auth && !string.IsNullOrEmpty(tok)) r.Headers["Authorization"] = "Bearer " + tok;
        if (accept != null) r.Accept = accept;
        return r;
    }
    // Weiterleitungen (GitHub legt Dateien auf einem Speicherserver ab) ohne Anmeldung folgen
    static HttpWebResponse Open(string url, int timeout, string accept)
    {
        var resp = (HttpWebResponse)Req(url, timeout, true, accept).GetResponse();
        for (int i = 0; i < 5; i++)
        {
            int code = (int)resp.StatusCode;
            if (code < 300 || code >= 400) return resp;
            string loc = resp.Headers["Location"];
            resp.Close();
            resp = (HttpWebResponse)Req(loc, timeout, false, null).GetResponse();
        }
        return resp;
    }
    static string Api(string path, string accept)
    {
        using (var r = Open("https://api.github.com/repos/" + Repo + "/" + path, 15000, accept))
        using (var sr = new StreamReader(r.GetResponseStream(), Encoding.UTF8)) return sr.ReadToEnd();
    }
    static void DownloadTo(string url, string accept, string file, Action<int> progress)
    {
        using (var resp = Open(url, 20000, accept))
        using (var src = resp.GetResponseStream())
        using (var dst = File.Create(file))
        {
            long total = resp.ContentLength, done = 0; int last = -1;
            var buf = new byte[65536]; int n;
            while ((n = src.Read(buf, 0, buf.Length)) > 0)
            {
                dst.Write(buf, 0, n); done += n;
                int p = total > 0 ? (int)(done * 100 / total) : -1;
                if (p != last && progress != null) { last = p; progress(p); }
            }
        }
    }
    static string Friendly(Exception e)
    {
        var we = e as WebException;
        var hr = we == null ? null : we.Response as HttpWebResponse;
        if (hr != null && (int)hr.StatusCode == 404) return "(Das GitHub-Projekt ist nicht öffentlich oder nicht erreichbar.)";
        if (hr != null && (int)hr.StatusCode == 403) return "(GitHub hat zu viele Anfragen gezählt, bitte später nochmal.)";
        return "(" + e.Message + ")";
    }

    // ---------------------------------------------------------------- Spiele & Launcher
    static void ReadContentState()
    {
        try
        {
            string[] l = File.ReadAllLines(Path.Combine(Content, "stand.txt"));
            contentSha = l[0].Trim(); contentDate = l.Length > 1 ? l[1].Trim() : "";
        }
        catch { }
    }

    // Holt den neuesten Stand von GitHub, wenn es einen neuen gibt. Liefert true, wenn etwas Neues kam.
    static bool UpdateContent(Splash ui)
    {
        lock (updLock)
        {
            checking = true;
            try
            {
                if (ui != null) ui.SetStatus("Suche nach neuen Spielen …");
                string sha;
                try { sha = Api("commits/" + branch, "application/vnd.github.sha").Trim(); }
                catch (Exception e) { note = "Keine Verbindung zu GitHub " + Friendly(e); Log(note); return false; }
                if (sha.Length < 7 || sha.IndexOf('{') >= 0) { note = "Unerwartete Antwort von GitHub"; return false; }
                if (sha == contentSha && File.Exists(Path.Combine(Content, "Launcher.html"))) { note = ""; return false; }

                if (ui != null) ui.SetStatus("Neue Spiele werden geladen …");
                string zip = Path.Combine(Home, "inhalt.zip"), neu = Path.Combine(Home, "inhalt.neu"), alt = Path.Combine(Home, "inhalt.alt");
                Action<int> progress = null;
                if (ui != null) progress = delegate (int p) { ui.SetStatus("Neue Spiele werden geladen …" + (p >= 0 ? " " + p + " %" : ""), p); };
                DownloadTo("https://api.github.com/repos/" + Repo + "/zipball/" + sha, null, zip, progress);
                if (Directory.Exists(neu)) Directory.Delete(neu, true);
                int files = 0;
                using (var z = ZipFile.OpenRead(zip))
                    foreach (var e in z.Entries)
                    {
                        int cut = e.FullName.IndexOf('/');           // erster Ordner = "besitzer-projekt-sha/"
                        if (cut < 0 || e.Name == "") continue;
                        string rel = e.FullName.Substring(cut + 1);
                        if (rel != "Launcher.html" && !rel.StartsWith("spiele/")) continue;
                        string dst = Path.GetFullPath(Path.Combine(neu, rel.Replace('/', '\\')));
                        if (!dst.StartsWith(neu + "\\", StringComparison.OrdinalIgnoreCase)) continue;
                        Directory.CreateDirectory(Path.GetDirectoryName(dst));
                        e.ExtractToFile(dst, true);
                        files++;
                    }
                try { File.Delete(zip); } catch { }
                if (!File.Exists(Path.Combine(neu, "Launcher.html"))) throw new Exception("Launcher.html fehlt im Download");
                string date = DateTime.Now.ToString("dd.MM.yyyy HH:mm");
                File.WriteAllText(Path.Combine(neu, "stand.txt"), sha + "\r\n" + date);
                // austauschen
                if (Directory.Exists(alt)) Directory.Delete(alt, true);
                if (Directory.Exists(Content)) Directory.Move(Content, alt);
                try { Directory.Move(neu, Content); }
                catch { if (Directory.Exists(alt) && !Directory.Exists(Content)) Directory.Move(alt, Content); throw; }
                try { Directory.Delete(alt, true); } catch { }
                bool first = contentSha == "";
                contentSha = sha; contentDate = date; note = "";
                if (!first) contentChanged = true;
                Log("Spiele aktualisiert auf " + sha.Substring(0, 7) + " (" + files + " Dateien)");
                return true;
            }
            catch (Exception e) { note = "Laden fehlgeschlagen " + Friendly(e); Log(note + " " + e); return false; }
            finally { checking = false; }
        }
    }

    // ---------------------------------------------------------------- App-Update
    class Release { public string version, exeUrl, shaUrl; }
    static Release LatestRelease()
    {
        var rel = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(Api("releases/latest", "application/vnd.github+json"));
        var r = new Release { version = ((rel["tag_name"] as string) ?? "").TrimStart('v') };
        foreach (object a in (System.Collections.IEnumerable)rel["assets"])
        {
            var d = (Dictionary<string, object>)a;
            if ((string)d["name"] == "Spielhalle.exe") r.exeUrl = (string)d["url"];
            if ((string)d["name"] == "Spielhalle.exe.sha256") r.shaUrl = (string)d["url"];
        }
        return r;
    }
    static bool Newer(string v)
    {
        System.Version a, b;
        return System.Version.TryParse(v, out a) && System.Version.TryParse(Version, out b) && a > b;
    }

    // Beim Start: gibt es eine neuere App, wird sie geladen, geprüft, eingesetzt und neu gestartet
    static bool SelfUpdate(Splash ui)
    {
        if (Test) return false;
        ui.SetStatus("Suche nach Updates …");
        Release r;
        try { r = LatestRelease(); } catch (Exception e) { Log("App-Update-Prüfung: " + e.Message); return false; }
        if (!Newer(r.version) || r.exeUrl == null || r.shaUrl == null) return false;
        ui.SetStatus("Neue Version " + r.version + " wird geladen …");
        string neu = Path.Combine(Home, "Spielhalle.neu.exe"), sumFile = Path.Combine(Home, "Spielhalle.neu.sha256");
        DownloadTo(r.shaUrl, "application/octet-stream", sumFile, null);
        DownloadTo(r.exeUrl, "application/octet-stream", neu, delegate (int p) { ui.SetStatus("Neue Version " + r.version + " wird geladen … " + Math.Max(0, p) + " %", p); });
        string want = File.ReadAllText(sumFile).Trim().Split(' ')[0];
        string have;
        using (var sha = SHA256.Create()) using (var f = File.OpenRead(neu)) have = BitConverter.ToString(sha.ComputeHash(f)).Replace("-", "");
        File.Delete(sumFile);
        if (!have.Equals(want, StringComparison.OrdinalIgnoreCase)) { File.Delete(neu); Log("App-Update: Prüfsumme stimmt nicht"); return false; }
        ui.SetStatus("Version " + r.version + " wird eingesetzt …");
        string old = Path.Combine(Home, "Spielhalle.alt.exe");
        try { File.Delete(old); } catch { }
        File.Move(Exe, old);
        File.Move(neu, Exe);
        Log("App aktualisiert auf " + r.version);
        Restart();
        return true;
    }
    static void Restart()
    {
        try { listener.Stop(); } catch { }
        Process.Start(new ProcessStartInfo(Exe, "--neustart") { WorkingDirectory = Home });
        Environment.Exit(0);
    }

    static void UpdateLoop()
    {
        while (true)
        {
            Thread.Sleep(TimeSpan.FromMinutes(10));
            try { UpdateContent(null); } catch { }
            try { if (!Test) { var r = LatestRelease(); if (Newer(r.version)) appUpdate = r.version; } } catch { }
        }
    }

    // ================================================================ Fenster (WebView2)
    // Alles mit WebView2-Typen steht in eigenen Methoden: fehlt etwas, schlägt nur dieser Aufruf fehl.
    static void ExtractWebView2()
    {
        var asm = Assembly.GetExecutingAssembly();
        foreach (string name in asm.GetManifestResourceNames())
        {
            if (!name.StartsWith("wv2/")) continue;
            string dst = Path.Combine(Home, name.Substring(4).Replace('/', '\\'));
            using (var s = asm.GetManifestResourceStream(name))
            {
                if (File.Exists(dst) && new FileInfo(dst).Length == s.Length) continue;
                Directory.CreateDirectory(Path.GetDirectoryName(dst));
                using (var f = File.Create(dst)) s.CopyTo(f);
            }
        }
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    static string WebView2VersionRaw() { return CoreWebView2Environment.GetAvailableBrowserVersionString(); }
    static string WebView2Version()
    {
        try { return WebView2VersionRaw(); }
        catch (Exception e) { Log("WebView2 nicht da: " + e.GetType().Name + " " + e.Message); return null; }
    }

    // Auf Windows 11 und fast jedem Windows 10 schon drauf. Sonst den offiziellen
    // Installer von Microsoft laden (Signatur wird geprüft) und still installieren.
    static bool WebView2Ready(Splash ui)
    {
        string v = WebView2Version();
        if (v != null) { Log("WebView2 " + v); return true; }
        try
        {
            ui.SetStatus("Fenster-Baustein von Microsoft wird installiert …");
            string f = Path.Combine(Path.GetTempPath(), "MicrosoftEdgeWebview2Setup.exe");
            using (var wc = new WebClient()) wc.DownloadFile("https://go.microsoft.com/fwlink/p/?LinkId=2124703", f);
            string signer = new X509Certificate2(X509Certificate.CreateFromSignedFile(f)).Subject;
            if (signer.IndexOf("O=Microsoft Corporation", StringComparison.OrdinalIgnoreCase) < 0) throw new Exception("falsche Signatur: " + signer);
            using (var p = Process.Start(new ProcessStartInfo(f, "/silent /install") { UseShellExecute = false, CreateNoWindow = true }))
                p.WaitForExit(5 * 60 * 1000);
            v = WebView2Version();
            Log("WebView2 nachinstalliert: " + (v ?? "hat nicht geklappt"));
        }
        catch (Exception e) { Log("WebView2-Installation: " + e.Message); }
        return v != null;
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    static string RunOwnWindow()
    {
        var f = new AppWindow(Url + "Launcher.html", DataDir);
        Window = f;
        Application.Run(f);
        Window = null;
        return f.Error == null ? null : f.Error.ToString();
    }

    static void ShowWindow()
    {
        Form f = Window;
        if (f == null || !f.IsHandleCreated) return;
        f.BeginInvoke((MethodInvoker)delegate
        {
            if (f.WindowState == FormWindowState.Minimized) f.WindowState = FormWindowState.Maximized;
            f.TopMost = true; f.TopMost = false; f.Activate();
        });
    }

    // ================================================================ Webserver
    static void Serve()
    {
        while (listener.IsListening)
        {
            HttpListenerContext ctx;
            try { ctx = listener.GetContext(); } catch { return; }
            ThreadPool.QueueUserWorkItem(delegate { Handle(ctx); });
        }
    }

    static void Send(HttpListenerContext ctx, byte[] b, string type, int code = 200)
    {
        var r = ctx.Response;
        r.StatusCode = code;
        r.ContentType = type;
        r.Headers.Add("Cache-Control", "no-store");
        r.ContentLength64 = b.Length;
        r.OutputStream.Write(b, 0, b.Length);
        r.Close();
    }
    static void Text(HttpListenerContext ctx, string t, string type, int code = 200) { Send(ctx, Encoding.UTF8.GetBytes(t), type, code); }
    static void Json(HttpListenerContext ctx, object o) { Text(ctx, new JavaScriptSerializer().Serialize(o), "application/json; charset=utf-8"); }

    static string Mime(string f)
    {
        switch (Path.GetExtension(f).ToLowerInvariant())
        {
            case ".html": case ".htm": return "text/html; charset=utf-8";
            case ".js": case ".mjs": return "application/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".txt": return "text/plain; charset=utf-8";
            case ".png": return "image/png";
            case ".jpg": case ".jpeg": return "image/jpeg";
            case ".gif": return "image/gif";
            case ".svg": return "image/svg+xml";
            case ".ico": return "image/x-icon";
            case ".webp": return "image/webp";
            case ".mp3": return "audio/mpeg";
            case ".ogg": return "audio/ogg";
            case ".wav": return "audio/wav";
            case ".mp4": return "video/mp4";
            case ".woff2": return "font/woff2";
            case ".wasm": return "application/wasm";
            default: return "application/octet-stream";
        }
    }

    static object Status()
    {
        return new Dictionary<string, object> {
            { "version", Version }, { "stand", contentSha.Length >= 7 ? contentSha.Substring(0, 7) : "" }, { "datum", contentDate },
            { "neu", contentChanged }, { "suche", checking }, { "hinweis", note }, { "appUpdate", appUpdate },
            { "fenster", Window != null },
        };
    }

    static void Handle(HttpListenerContext ctx)
    {
        lastHit = DateTime.Now;
        try
        {
            string path = Uri.UnescapeDataString(ctx.Request.Url.AbsolutePath.TrimStart('/'));
            bool post = ctx.Request.HttpMethod == "POST";
            switch (path)
            {
                case "__ping": Text(ctx, "ok", "text/plain"); return;
                case "__status": Json(ctx, Status()); return;
                case "__spiele": Json(ctx, Games()); return;
                case "__zeigen": ShowWindow(); Text(ctx, Window != null ? "ok" : "kein Fenster", "text/plain"); return;
                case "__gesehen": contentChanged = false; Json(ctx, Status()); return;
                case "__suchen":
                    if (!post) { Text(ctx, "POST", "text/plain", 405); return; }
                    if (!checking) new Thread(delegate () { UpdateContent(null); }) { IsBackground = true }.Start();
                    Thread.Sleep(300);
                    Json(ctx, Status());
                    return;
                case "__neustart":
                    if (!post) { Text(ctx, "POST", "text/plain", 405); return; }
                    Text(ctx, "ok", "text/plain");
                    new Thread(delegate () { Thread.Sleep(500); Restart(); }).Start();
                    return;
                case "__beenden":
                    Text(ctx, "ok", "text/plain");
                    new Thread(delegate () { Thread.Sleep(300); Environment.Exit(0); }).Start();
                    return;
                case "__yt": YouTube(ctx); return;
            }
            if (path == "") path = "Launcher.html";
            string full = Path.GetFullPath(Path.Combine(Content, path.Replace('/', '\\')));
            if (full.StartsWith(Content + "\\", StringComparison.OrdinalIgnoreCase) && File.Exists(full))
                Send(ctx, WithBackButton(path, File.ReadAllBytes(full)), Mime(full));
            else
                Text(ctx, "Nicht gefunden", "text/plain; charset=utf-8", 404);
        }
        catch (Exception e)
        {
            try { Text(ctx, "Fehler: " + e.Message, "text/plain; charset=utf-8", 500); } catch { }
        }
    }

    // Jede HTML-Datei direkt in spiele/ ist ein Spiel – mit Titel und den Angaben
    // aus <meta name="spielhalle-…" content="…"> (siehe vorlagen/neues-spiel.html)
    static List<object> Games()
    {
        var list = new List<object>();
        string d = Path.Combine(Content, "spiele");
        if (!Directory.Exists(d)) return list;
        foreach (string f in Directory.GetFiles(d, "*.html"))
        {
            try
            {
                string html = Regex.Replace(File.ReadAllText(f, Encoding.UTF8), @"<!--.*?-->", "", RegexOptions.Singleline);
                var t = Regex.Match(html, @"<title[^>]*>(.*?)</title>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                var meta = new Dictionary<string, object>();
                foreach (Match m in Regex.Matches(html, @"<meta\b[^>]*>", RegexOptions.IgnoreCase))
                {
                    var n = Regex.Match(m.Value, @"\bname\s*=\s*[""']spielhalle-([a-z]+)[""']", RegexOptions.IgnoreCase);
                    var c = Regex.Match(m.Value, @"\bcontent\s*=\s*(""[^""]*""|'[^']*')", RegexOptions.IgnoreCase);
                    if (n.Success && c.Success)
                        meta[n.Groups[1].Value.ToLowerInvariant()] = WebUtility.HtmlDecode(c.Groups[1].Value.Substring(1, c.Groups[1].Value.Length - 2)).Trim();
                }
                list.Add(new Dictionary<string, object> {
                    { "file", "spiele/" + Path.GetFileName(f) },
                    { "title", t.Success ? WebUtility.HtmlDecode(t.Groups[1].Value).Trim() : Path.GetFileNameWithoutExtension(f) },
                    { "meta", meta },
                });
            }
            catch (Exception e) { Log("Spiel nicht lesbar: " + f + " – " + e.Message); }
        }
        return list;
    }

    // Spiele ohne die gemeinsame Spielleiste (hub.js) bekommen einen Knopf zurück zur Spielhalle.
    // Abschalten: <meta name="spielhalle-zurueck" content="nein">
    const string BackButton = "<a id=\"spielhalle-zurueck\" href=\"/Launcher.html\" title=\"Zur Spielhalle\" style=\"position:fixed;left:12px;bottom:12px;z-index:2147483647;" +
        "padding:8px 14px;border-radius:999px;background:rgba(14,15,22,.8);color:#fff;font:600 14px 'Segoe UI',system-ui,sans-serif;text-decoration:none;" +
        "box-shadow:0 4px 14px rgba(0,0,0,.45);opacity:.6\" onmouseover=\"this.style.opacity=1\" onmouseout=\"this.style.opacity=.6\">&#8592; Spielhalle</a>" +
        "<script>if(window.top!==window){var z=document.getElementById('spielhalle-zurueck');if(z)z.remove();}</script>";
    static byte[] WithBackButton(string path, byte[] data)
    {
        if (!path.StartsWith("spiele/", StringComparison.OrdinalIgnoreCase) || path.IndexOf('/', 7) >= 0 ||
            !path.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) return data;
        string html = Encoding.UTF8.GetString(data);
        if (html.IndexOf("shared/hub.js", StringComparison.OrdinalIgnoreCase) >= 0 ||
            Regex.IsMatch(html, @"name\s*=\s*[""']spielhalle-zurueck[""']\s+content\s*=\s*[""']nein", RegexOptions.IgnoreCase)) return data;
        int i = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        html = i >= 0 ? html.Insert(i, BackButton) : html + BackButton;
        return new UTF8Encoding(false).GetBytes(html);
    }

    // YouTube-Suche für das Kino: Ergebnisseite laden und die eingebetteten Daten zurückgeben
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
}

// ==================================================================== Programmfenster
// Die Spielhalle in einem eigenen Fenster. F11 = Vollbild (bleibt auch beim Wechsel ins Spiel),
// Links zu fremden Seiten gehen im Standardbrowser auf.
class AppWindow : Form
{
    readonly WebView2 web = new WebView2();
    readonly string start, dataDir;
    public Exception Error;
    bool fullWindow, fullElement;
    FormWindowState before = FormWindowState.Maximized;

    public AppWindow(string url, string data)
    {
        start = url; dataDir = data;
        Text = "Spielhalle";
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        BackColor = Color.FromArgb(12, 13, 20);
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(1280, 800);
        WindowState = FormWindowState.Maximized;
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = BackColor;
        Controls.Add(web);
        Load += async delegate
        {
            try
            {
                var opt = new CoreWebView2EnvironmentOptions();
                opt.AdditionalBrowserArguments = "--autoplay-policy=no-user-gesture-required --disable-features=Translate";
                var env = await CoreWebView2Environment.CreateAsync(null, dataDir, opt);
                await web.EnsureCoreWebView2Async(env);
                var c = web.CoreWebView2;
                c.Settings.IsStatusBarEnabled = false;
                c.Settings.IsPasswordAutosaveEnabled = false;
                c.Settings.IsGeneralAutofillEnabled = false;
                c.ContainsFullScreenElementChanged += delegate { fullElement = c.ContainsFullScreenElement; ApplyFull(); };
                c.WebMessageReceived += (s, e) => { if (e.TryGetWebMessageAsString() == "vollbild") { fullWindow = !fullWindow; ApplyFull(); } };
                c.NewWindowRequested += (s, e) =>
                {
                    if (e.Uri.StartsWith(App.Url, StringComparison.OrdinalIgnoreCase)) return;
                    e.Handled = true;
                    try { Process.Start(e.Uri); } catch { }
                };
                await c.AddScriptToExecuteOnDocumentCreatedAsync(
                    "addEventListener('keydown',function(e){if(e.key==='F11'){e.preventDefault();window.chrome.webview.postMessage('vollbild');}},true);" +
                    "window.spielhalleVollbild=function(){window.chrome.webview.postMessage('vollbild');};");
                c.Navigate(start);
                App.Log("Fenster offen (WebView2 " + env.BrowserVersionString + ")");
            }
            catch (Exception ex) { Error = ex; Close(); }
        };
    }

    void ApplyFull()
    {
        bool on = fullWindow || fullElement;
        if (on == (FormBorderStyle == FormBorderStyle.None)) return;
        if (on)
        {
            before = WindowState == FormWindowState.Minimized ? FormWindowState.Maximized : WindowState;
            FormBorderStyle = FormBorderStyle.None;
            WindowState = FormWindowState.Normal;   // erst Normal, sonst bleibt die Taskleiste sichtbar
            WindowState = FormWindowState.Maximized;
        }
        else
        {
            FormBorderStyle = FormBorderStyle.Sizable;
            WindowState = before;
        }
    }
}

// ==================================================================== Startfenster
class Splash : Form
{
    string status = "Wird gestartet …";
    int pct = -1;
    bool failed;
    float k = 1, phase;
    public bool Ok = true;
    readonly System.Windows.Forms.Timer anim = new System.Windows.Forms.Timer();
    static readonly Color Bg = Color.FromArgb(18, 19, 30), Accent = Color.FromArgb(124, 108, 255);

    public Splash()
    {
        using (var g = CreateGraphics()) k = g.DpiX / 96f;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(S(480), S(190));
        BackColor = Bg;
        DoubleBuffered = true;
        Text = "Spielhalle";
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        ShowInTaskbar = true;
        anim.Interval = 16;
        anim.Tick += delegate { phase += 0.012f; if (phase > 1.4f) phase = -0.4f; Invalidate(); };
        anim.Start();
        Click += delegate { if (failed) { Ok = false; Close(); } };
    }
    int S(float v) { return (int)Math.Round(v * k); }

    public void SetStatus(string s, int percent = -1) { if (IsHandleCreated) BeginInvoke((MethodInvoker)delegate { status = s; pct = percent; Invalidate(); }); }
    public void Fail(string s)
    {
        App.Log("Startfehler: " + s);
        if (IsHandleCreated) BeginInvoke((MethodInvoker)delegate { failed = true; status = s + "  (Klicken zum Schließen)"; anim.Stop(); Invalidate(); });
    }
    public void CloseSafe() { if (IsHandleCreated) BeginInvoke((MethodInvoker)delegate { anim.Stop(); Close(); }); }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        using (var pen = new Pen(Color.FromArgb(50, 255, 255, 255))) g.DrawRectangle(pen, 0, 0, ClientSize.Width - 1, ClientSize.Height - 1);
        // Logo: abgerundetes Quadrat mit Play-Dreieck
        var r = new RectangleF(S(32), S(40), S(80), S(80));
        using (var path = Rounded(r, S(20)))
        using (var br = new LinearGradientBrush(r, Accent, Color.FromArgb(196, 92, 255), 45f)) g.FillPath(br, path);
        using (var w = new SolidBrush(Color.White))
            g.FillPolygon(w, new[] { new PointF(r.X + S(31), r.Y + S(22)), new PointF(r.X + S(31), r.Y + S(58)), new PointF(r.X + S(60), r.Y + S(40)) });
        using (var f = new Font("Segoe UI Semibold", 26f))
        using (var b = new SolidBrush(Color.White))
            g.DrawString("Spielhalle", f, b, S(130), S(42));
        using (var f = new Font("Segoe UI", 10f))
        using (var b = new SolidBrush(failed ? Color.FromArgb(255, 130, 140) : Color.FromArgb(185, 188, 210)))
            g.DrawString(status, f, b, new RectangleF(S(134), S(96), ClientSize.Width - S(150), S(56)));
        // Ladebalken
        var bar = new Rectangle(S(134), S(156), ClientSize.Width - S(166), S(5));
        using (var b = new SolidBrush(Color.FromArgb(40, 255, 255, 255))) g.FillRectangle(b, bar);
        if (!failed)
            using (var b = new SolidBrush(Accent))
            {
                if (pct >= 0) g.FillRectangle(b, bar.X, bar.Y, bar.Width * Math.Min(100, pct) / 100, bar.Height);
                else { float x = bar.X + bar.Width * phase; g.FillRectangle(b, Math.Max(bar.X, x), bar.Y, Math.Max(0, Math.Min(bar.Right, x + bar.Width * .3f) - Math.Max(bar.X, x)), bar.Height); }
            }
        using (var f = new Font("Segoe UI", 8f))
        using (var b = new SolidBrush(Color.FromArgb(100, 104, 130)))
            g.DrawString("Version " + App.Version, f, b, S(134), S(166));
    }
    static GraphicsPath Rounded(RectangleF r, float rad)
    {
        var p = new GraphicsPath(); float d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90); p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90); p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure(); return p;
    }
}
