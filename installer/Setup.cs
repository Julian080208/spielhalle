// =====================================================================
//  Spielhalle-Setup.exe – Installations-Assistent und Deinstaller
//  Installiert für den aktuellen Windows-Benutzer (keine Admin-Rechte):
//    %LOCALAPPDATA%\Programs\Spielhalle
//  mit Startmenü, Desktop-Verknüpfung und Eintrag unter „Apps“.
//  Die Spieldateien stecken als payload.zip in der exe.
//
//  Schalter:  --still            ohne Fenster (für Online-Updates)
//             --neustart         danach die Spielhalle starten
//             --ziel <ordner>    Installationsordner
//             --deinstallieren   Deinstallations-Assistent
//             --test             keine Verknüpfungen/Registry (für Tests)
// =====================================================================
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Management;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("Spielhalle Setup")]

class Options
{
    public bool Desktop = true, StartMenu = true, AutoUpdate = true, Migrate = true, Register = true;
}

static class Setup
{
    public const string RegKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Spielhalle";
    public static string Version
    {
        get
        {
            var a = (AssemblyInformationalVersionAttribute)Attribute.GetCustomAttribute(Assembly.GetExecutingAssembly(), typeof(AssemblyInformationalVersionAttribute));
            return a != null ? a.InformationalVersion : "0.0.0";
        }
    }
    public static string HomePage = "";
    public static bool Test;   // --test: Verknüpfungen und Registry nicht anfassen

    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    public static string DefaultDir() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Spielhalle"); }
    static string RegValue(string name)
    {
        try { using (var k = Registry.CurrentUser.OpenSubKey(RegKey)) return k == null ? null : k.GetValue(name) as string; } catch { return null; }
    }
    public static string InstalledDir()
    {
        string d = RegValue("InstallLocation");
        return d != null && File.Exists(Path.Combine(d, "Spielhalle.exe")) ? d : null;
    }
    public static string InstalledVersion() { return InstalledDir() != null ? RegValue("DisplayVersion") : null; }
    static string DesktopLink() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Spielhalle.lnk"); }
    static string MenuLink() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Spielhalle.lnk"); }

    [STAThread]
    static int Main(string[] args)
    {
        try { SetProcessDPIAware(); } catch { }
        Application.EnableVisualStyles();
        try { using (var s = Assembly.GetExecutingAssembly().GetManifestResourceStream("homepage.txt")) if (s != null) HomePage = new StreamReader(s).ReadToEnd().Trim(); } catch { }
        string dir = null; bool still = false, restart = false, uninstall = false, test = false;
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--ziel" && i + 1 < args.Length) dir = args[++i];
            else if (args[i] == "--still") still = true;
            else if (args[i] == "--neustart") restart = true;
            else if (args[i] == "--deinstallieren") uninstall = true;
            else if (args[i] == "--test") test = Test = true;
        }
        string me = Application.ExecutablePath;

        if (uninstall)
        {
            if (dir == null) dir = InstalledDir() ?? Path.GetDirectoryName(me);
            // aus dem Installationsordner heraus kann man sich nicht selbst löschen -> Kopie im Temp-Ordner starten
            if (Path.GetDirectoryName(me).TrimEnd('\\').Equals(dir.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase))
            {
                string tmp = Path.Combine(Path.GetTempPath(), "Spielhalle-Deinstallieren.exe");
                File.Copy(me, tmp, true);
                Process.Start(tmp, "--deinstallieren --ziel \"" + dir + "\"" + (still ? " --still" : "") + (test ? " --test" : ""));
                return 0;
            }
            if (still) { Uninstall(dir, true, null); return 0; }
            Application.Run(new Wizard(dir, true));
            CleanupSelfLater(me);
            return 0;
        }

        if (dir == null) dir = InstalledDir() ?? DefaultDir();
        if (still)
        {
            // Update: Einstellungen und vorhandene Verknüpfungen übernehmen
            var o = new Options { Desktop = File.Exists(DesktopLink()), StartMenu = File.Exists(MenuLink()), AutoUpdate = true, Migrate = false, Register = !test };
            if (test) o.Desktop = o.StartMenu = false;
            try { Install(dir, o, null, true); }
            catch (Exception e) { File.WriteAllText(Path.Combine(Path.GetTempPath(), "Spielhalle-Setup-Fehler.txt"), e.ToString()); return 1; }
            if (restart) StartApp(dir);
            return 0;
        }
        Application.Run(new Wizard(dir, false) { TestMode = test });
        return 0;
    }

    public static void StartApp(string dir)
    {
        try { Process.Start(new ProcessStartInfo(Path.Combine(dir, "Spielhalle.exe")) { WorkingDirectory = dir }); } catch { }
    }

    static void CleanupSelfLater(string exe)
    {
        if (!exe.StartsWith(Path.GetTempPath(), StringComparison.OrdinalIgnoreCase)) return;
        var psi = new ProcessStartInfo("cmd.exe", "/c timeout /t 3 /nobreak >nul & del /f /q \"" + exe + "\"");
        psi.WindowStyle = ProcessWindowStyle.Hidden; psi.CreateNoWindow = true;
        try { Process.Start(psi); } catch { }
    }

    // laufende Spielhalle (App + ihr Edge-Fenster) beenden
    public static void StopRunning(string dir)
    {
        string data = Path.Combine(dir, "Daten"), exe = Path.Combine(dir, "Spielhalle.exe");
        int self = Process.GetCurrentProcess().Id;
        try
        {
            using (var s = new ManagementObjectSearcher("SELECT ProcessId, CommandLine, ExecutablePath FROM Win32_Process WHERE Name='msedge.exe' OR Name='chrome.exe' OR Name='brave.exe' OR Name='vivaldi.exe' OR Name='Spielhalle.exe'"))
                foreach (ManagementObject o in s.Get())
                {
                    int id = Convert.ToInt32(o["ProcessId"]);
                    if (id == self) continue;
                    string cl = (o["CommandLine"] as string) ?? "", ep = (o["ExecutablePath"] as string) ?? "";
                    if (cl.IndexOf(data, StringComparison.OrdinalIgnoreCase) >= 0 || ep.Equals(exe, StringComparison.OrdinalIgnoreCase))
                        try { Process.GetProcessById(id).Kill(); } catch { }
                }
        }
        catch { }
        Thread.Sleep(800);
    }

    static void Retry(Action a)
    {
        for (int i = 0; ; i++)
        {
            try { a(); return; }
            catch { if (i >= 12) throw; Thread.Sleep(400); }
        }
    }

    public static void Install(string dir, Options o, Action<int, string> progress, bool update)
    {
        if (progress == null) progress = delegate { };
        progress(2, "Laufende Spielhalle wird beendet …");
        StopRunning(dir);
        Directory.CreateDirectory(dir);
        string app = Path.Combine(dir, "app");
        progress(6, "Alte Dateien werden entfernt …");
        if (Directory.Exists(app)) Retry(delegate { Directory.Delete(app, true); });
        string exe = Path.Combine(dir, "Spielhalle.exe");

        using (Stream st = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip"))
        using (var z = new ZipArchive(st))
        {
            var entries = new List<ZipArchiveEntry>();
            foreach (var e in z.Entries) if (e.Name != "") entries.Add(e);
            for (int i = 0; i < entries.Count; i++)
            {
                var e = entries[i];
                string rel = e.FullName.Replace('/', '\\');
                string dst = Path.Combine(dir, rel);
                progress(10 + 75 * i / entries.Count, rel);
                Directory.CreateDirectory(Path.GetDirectoryName(dst));
                if (rel.Equals("Spielhalle.exe", StringComparison.OrdinalIgnoreCase) && File.Exists(dst))
                {
                    string old = Path.Combine(dir, "Spielhalle.old.exe");
                    try { if (File.Exists(old)) File.Delete(old); } catch { }
                    try { Retry(delegate { File.Delete(dst); }); }
                    catch { File.Move(dst, old); }
                }
                var entry = e;
                Retry(delegate { entry.ExtractToFile(dst, true); });
            }
        }
        progress(88, "Deinstaller wird eingerichtet …");
        string unins = Path.Combine(dir, "Deinstallieren.exe");
        if (!Application.ExecutablePath.Equals(unins, StringComparison.OrdinalIgnoreCase))
            Retry(delegate { File.Copy(Application.ExecutablePath, unins, true); });
        if (!update || !File.Exists(Path.Combine(dir, "einstellungen.txt")))
            File.WriteAllText(Path.Combine(dir, "einstellungen.txt"), "autoupdate=" + (o.AutoUpdate ? 1 : 0));
        if (!o.Migrate && !File.Exists(Path.Combine(dir, "umzug.erledigt")))
            File.WriteAllText(Path.Combine(dir, "umzug.erledigt"), "übersprungen");

        progress(92, "Verknüpfungen werden angelegt …");
        if (o.Desktop) Shortcut(DesktopLink(), exe, dir);
        if (o.StartMenu) Shortcut(MenuLink(), exe, dir);
        if (o.Register)
        {
            progress(96, "Spielhalle wird bei Windows angemeldet …");
            long size = 0;
            foreach (string f in Directory.GetFiles(dir, "*", SearchOption.TopDirectoryOnly)) size += new FileInfo(f).Length;
            foreach (string f in Directory.GetFiles(app, "*", SearchOption.AllDirectories)) size += new FileInfo(f).Length;
            using (var k = Registry.CurrentUser.CreateSubKey(RegKey))
            {
                k.SetValue("DisplayName", "Spielhalle");
                k.SetValue("DisplayIcon", exe);
                k.SetValue("DisplayVersion", Version);
                k.SetValue("Publisher", "Spielhalle");
                k.SetValue("InstallLocation", dir);
                k.SetValue("InstallDate", DateTime.Now.ToString("yyyyMMdd"));
                k.SetValue("UninstallString", "\"" + unins + "\" --deinstallieren");
                k.SetValue("QuietUninstallString", "\"" + unins + "\" --deinstallieren --still");
                if (HomePage != "") k.SetValue("URLInfoAbout", HomePage);
                k.SetValue("NoModify", 1, RegistryValueKind.DWord);
                k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                k.SetValue("EstimatedSize", (int)(size / 1024) + 10240, RegistryValueKind.DWord);
            }
        }
        progress(100, "Fertig");
    }

    public static void Uninstall(string dir, bool deleteData, Action<int, string> progress)
    {
        if (progress == null) progress = delegate { };
        // Sicherheitsnetz: nur einen echten Spielhallen-Ordner anfassen
        if (!File.Exists(Path.Combine(dir, "Spielhalle.exe")) && !Directory.Exists(Path.Combine(dir, "app")))
            throw new Exception("In „" + dir + "“ ist keine Spielhalle installiert.");
        progress(5, "Spielhalle wird beendet …");
        StopRunning(dir);
        progress(25, "Verknüpfungen werden entfernt …");
        if (!Test)
        {
            foreach (string l in new[] { DesktopLink(), MenuLink() }) { try { if (File.Exists(l)) File.Delete(l); } catch { } }
            try { Registry.CurrentUser.DeleteSubKeyTree(RegKey, false); } catch { }
        }
        progress(45, "Programmdateien werden entfernt …");
        string app = Path.Combine(dir, "app");
        if (Directory.Exists(app)) Retry(delegate { Directory.Delete(app, true); });
        foreach (string f in new[] { "Spielhalle.exe", "Spielhalle.old.exe", "Deinstallieren.exe", "update-url.txt", "update-repo.txt", "neu.txt", "einstellungen.txt", "umzug.json", "umzug.erledigt", "protokoll.txt" })
        {
            string p = Path.Combine(dir, f);
            try { if (File.Exists(p)) Retry(delegate { File.Delete(p); }); } catch { }
        }
        if (deleteData)
        {
            progress(75, "Spielstände werden gelöscht …");
            string data = Path.Combine(dir, "Daten");
            if (Directory.Exists(data)) try { Retry(delegate { Directory.Delete(data, true); }); } catch { }
        }
        try { if (Directory.GetFileSystemEntries(dir).Length == 0) Directory.Delete(dir); } catch { }
        progress(100, "Fertig");
    }

    static void Shortcut(string lnk, string target, string workDir)
    {
        Type t = Type.GetTypeFromProgID("WScript.Shell");
        object sh = Activator.CreateInstance(t);
        object sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { lnk });
        Type st = sc.GetType();
        st.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { target });
        st.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { workDir });
        st.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { target + ",0" });
        st.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { "Spielhalle – Spiele für den ganzen Keller" });
        st.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
        Marshal.FinalReleaseComObject(sc); Marshal.FinalReleaseComObject(sh);
    }
}

// ==================================================================== Assistent
class Wizard : Form
{
    enum Page { Welcome, Folder, Options, Progress, Done, UnWelcome, UnProgress, UnDone }

    public bool TestMode;
    readonly bool uninstall;
    string dir;
    Page page;
    float k = 1;
    readonly Panel body;
    readonly Button back, next, cancel;
    readonly Options opt = new Options();
    bool deleteData, startNow = true, busy, failed;
    int pct; string pctText = "";
    string errorText;
    readonly string oldVersion;

    static readonly Color Card = Color.FromArgb(0x1c, 0x1f, 0x2a), Txt2 = Color.FromArgb(170, 172, 196), Line = Color.FromArgb(44, 47, 60);
    const int W = 640, H = 470, Side = 200, Head = 84, Foot = 64;

    int S(float v) { return (int)Math.Round(v * k); }

    public Wizard(string dir, bool uninstall)
    {
        this.dir = dir; this.uninstall = uninstall;
        oldVersion = uninstall ? null : Setup.InstalledVersion();
        using (var g = CreateGraphics()) k = g.DpiX / 96f;
        Text = uninstall ? "Spielhalle deinstallieren" : "Spielhalle " + Setup.Version + " – Setup";
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(S(W), S(H));
        BackColor = Logo.Dunkel; ForeColor = Color.White;
        Font = new Font("Segoe UI", 10f);
        DoubleBuffered = true;

        body = new Panel { BackColor = Logo.Dunkel };
        back = Btn("< Zurück", false); next = Btn("Weiter >", true); cancel = Btn("Abbrechen", false);
        back.Click += delegate { Go(page == Page.Options ? Page.Folder : Page.Welcome); };
        next.Click += delegate { Next(); };
        cancel.Click += delegate { Close(); };
        Controls.AddRange(new Control[] { body, back, next, cancel });
        Go(uninstall ? Page.UnWelcome : Page.Welcome);
    }

    Button Btn(string t, bool primary)
    {
        var b = new Button { Text = t, FlatStyle = FlatStyle.Flat, Cursor = Cursors.Hand, ForeColor = Color.White };
        b.FlatAppearance.BorderSize = primary ? 0 : 1;
        b.FlatAppearance.BorderColor = Color.FromArgb(70, 74, 92);
        b.BackColor = primary ? Logo.Lila2 : Card;
        if (primary) b.Font = new Font("Segoe UI Semibold", 10f);
        return b;
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (busy) { e.Cancel = true; return; }
        bool finished = page == Page.Done || page == Page.UnDone || failed;
        if (!finished && e.CloseReason == CloseReason.UserClosing)
        {
            string q = uninstall ? "Deinstallation abbrechen?" : "Setup wirklich abbrechen? Die Spielhalle wird dann nicht installiert.";
            if (MessageBox.Show(this, q, Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) e.Cancel = true;
        }
        base.OnFormClosing(e);
    }

    bool SidePage { get { return page == Page.Welcome || page == Page.Done || page == Page.UnWelcome || page == Page.UnDone; } }

    void Next()
    {
        switch (page)
        {
            case Page.Welcome: Go(Page.Folder); break;
            case Page.Folder:
                try { dir = Path.GetFullPath(dirBox.Text.Trim()); } catch { MessageBox.Show(this, "Dieser Ordner ist ungültig.", Text); return; }
                Go(Page.Options); break;
            case Page.Options: Go(Page.Progress); RunInstall(); break;
            case Page.Done:
                if (startNow && !failed) Setup.StartApp(dir);
                Close(); break;
            case Page.UnWelcome: Go(Page.UnProgress); RunUninstall(); break;
            case Page.UnDone: Close(); break;
        }
    }

    // ------------------------------------------------------------ Seitenaufbau
    TextBox dirBox;
    Label progLabel; Panel progBar;

    Label L(string t, int x, int y, int w, int h, float size = 10f, bool bold = false, Color? col = null)
    {
        var l = new Label { Text = t, Location = new Point(S(x), S(y)), Size = new Size(S(w), S(h)), ForeColor = col ?? Color.White, BackColor = Color.Transparent };
        l.Font = new Font(bold ? "Segoe UI Semibold" : "Segoe UI", size);
        body.Controls.Add(l);
        return l;
    }
    CheckBox C(string t, int y, bool val, Action<bool> set)
    {
        var c = new CheckBox { Text = t, Checked = val, Location = new Point(S(0), S(y)), AutoSize = true, ForeColor = Color.White, BackColor = Color.Transparent, Cursor = Cursors.Hand };
        c.CheckedChanged += delegate { set(c.Checked); };
        body.Controls.Add(c);
        return c;
    }

    void Go(Page p)
    {
        page = p;
        body.Controls.Clear();
        int bw;
        if (SidePage) { body.Location = new Point(S(Side + 32), S(34)); bw = W - Side - 64; }
        else { body.Location = new Point(S(40), S(Head + 24)); bw = W - 80; }
        body.Size = new Size(S(bw), S(H - Foot - (SidePage ? 34 : Head + 24) - 10));

        // Knöpfe
        int by = H - Foot + 14;
        cancel.SetBounds(S(W - 24 - 110), S(by), S(110), S(36));
        next.SetBounds(S(W - 24 - 110 - 10 - 150), S(by), S(150), S(36));
        back.SetBounds(S(W - 24 - 110 - 10 - 150 - 8 - 110), S(by), S(110), S(36));
        back.Visible = p == Page.Folder || p == Page.Options;
        next.Visible = true; next.Enabled = true; cancel.Visible = true; cancel.Enabled = true;
        next.Text = "Weiter >"; cancel.Text = "Abbrechen";

        switch (p)
        {
            case Page.Welcome:
                L("Willkommen bei der Spielhalle", 0, 0, bw, 70, 18f, true);
                string t = oldVersion != null
                    ? "Auf diesem PC ist die Spielhalle " + oldVersion + " installiert. Dieser Assistent bringt sie auf Version " + Setup.Version + ".\n\nDeine Spielstände, Chips und eure Partyrunde bleiben erhalten."
                    : "Dieser Assistent installiert die Spielhalle " + Setup.Version + " auf diesem PC.\n\n" +
                      "Über 40 Spiele für einen allein oder die ganze Runde am Fernseher, mit Partyraum, YouTube-Kino und Casino.\n\n" +
                      "Die Spielhalle hält sich über das Internet automatisch auf dem neuesten Stand.";
                L(t, 0, 80, bw, 200, 10f, false, Txt2);
                L("Klicke auf „Weiter“, um fortzufahren.", 0, H - Foot - 34 - 40, bw, 24, 10f, false, Txt2);
                break;

            case Page.Folder:
                L("Die Spielhalle wird in diesem Ordner installiert:", 0, 0, bw, 24);
                dirBox = new TextBox { Text = dir, Location = new Point(0, S(32)), Size = new Size(S(bw - 120), S(28)), BackColor = Card, ForeColor = Color.White, BorderStyle = BorderStyle.FixedSingle };
                body.Controls.Add(dirBox);
                var pick = Btn("Durchsuchen …", false);
                pick.SetBounds(S(bw - 110), S(30), S(110), S(30));
                pick.Click += delegate
                {
                    using (var d = new FolderBrowserDialog { Description = "Ordner für die Spielhalle wählen", SelectedPath = Directory.Exists(dirBox.Text) ? dirBox.Text : Path.GetDirectoryName(dirBox.Text) })
                        if (d.ShowDialog(this) == DialogResult.OK) dirBox.Text = Path.GetFileName(d.SelectedPath).Equals("Spielhalle", StringComparison.OrdinalIgnoreCase) ? d.SelectedPath : Path.Combine(d.SelectedPath, "Spielhalle");
                };
                body.Controls.Add(pick);
                string free = "";
                try { free = (new DriveInfo(Path.GetPathRoot(dir)).AvailableFreeSpace / 1073741824.0).ToString("0.0") + " GB"; } catch { }
                L("Benötigter Speicherplatz: etwa 5 MB (plus Spielstände)" + (free != "" ? "\nFreier Speicherplatz: " + free : ""), 0, 84, bw, 50, 9.5f, false, Txt2);
                L("Es werden keine Administratorrechte gebraucht – die Spielhalle wird nur für dein Windows-Konto installiert.", 0, 150, bw, 50, 9.5f, false, Txt2);
                break;

            case Page.Options:
                L("Was soll das Setup zusätzlich einrichten?", 0, 0, bw, 24);
                C("Verknüpfung auf dem Desktop", 40, opt.Desktop, v => opt.Desktop = v);
                C("Eintrag im Startmenü", 72, opt.StartMenu, v => opt.StartMenu = v);
                C("Updates automatisch installieren (empfohlen)", 104, opt.AutoUpdate, v => opt.AutoUpdate = v);
                if (oldVersion == null)
                    C("Spielstände der bisherigen Spielhalle übernehmen", 136, opt.Migrate, v => opt.Migrate = v);
                L("Bereit: Klicke auf „Installieren“, um die Spielhalle nach\n" + dir + "\nzu installieren.", 0, 190, bw, 80, 9.5f, false, Txt2);
                next.Text = "Installieren";
                break;

            case Page.Progress:
            case Page.UnProgress:
                L(p == Page.Progress ? "Die Spielhalle wird installiert …" : "Die Spielhalle wird entfernt …", 0, 0, bw, 28, 11f, true);
                progBar = new DoubleBufferedPanel { Location = new Point(0, S(48)), Size = new Size(S(bw), S(14)), BackColor = Card };
                progBar.Paint += (s, e) =>
                {
                    int w = (int)(progBar.Width * pct / 100.0);
                    if (w > 1) using (var br = new LinearGradientBrush(new Rectangle(0, 0, Math.Max(w, 2), progBar.Height), Logo.Lila1, Logo.Lila2, 0f)) e.Graphics.FillRectangle(br, 0, 0, w, progBar.Height);
                };
                body.Controls.Add(progBar);
                progLabel = L("", 0, 74, bw, 60, 9f, false, Txt2);
                back.Visible = false; next.Enabled = false; cancel.Enabled = false;
                break;

            case Page.Done:
                if (failed)
                {
                    L("Das hat nicht geklappt", 0, 0, bw, 40, 18f, true);
                    L(errorText + "\n\nSchließe die Spielhalle und versuche es noch einmal.", 0, 60, bw, 200, 10f, false, Color.FromArgb(255, 150, 150));
                    next.Text = "Schließen"; cancel.Visible = false;
                    break;
                }
                L("Fertig!", 0, 0, bw, 44, 20f, true);
                L("Die Spielhalle " + Setup.Version + " ist installiert." + (opt.Desktop ? "\n\nDu findest sie ab jetzt auf dem Desktop" + (opt.StartMenu ? " und im Startmenü." : ".") : opt.StartMenu ? "\n\nDu findest sie ab jetzt im Startmenü." : ""), 0, 60, bw, 120, 10f, false, Txt2);
                C("Spielhalle jetzt starten", 200, startNow, v => startNow = v);
                next.Text = "Fertigstellen"; cancel.Visible = false;
                break;

            case Page.UnWelcome:
                L("Spielhalle deinstallieren", 0, 0, bw, 44, 18f, true);
                L("Die Spielhalle wird von diesem PC entfernt (Programm, Verknüpfungen und Eintrag unter „Apps“).\n\nOrdner: " + dir, 0, 60, bw, 110, 10f, false, Txt2);
                C("Auch alle Spielstände löschen (Punkte, Chips, Partyrunde)", 190, deleteData, v => deleteData = v);
                L("Ohne Haken bleiben die Spielstände erhalten und sind bei einer neuen Installation wieder da.", 0, 222, bw, 50, 9f, false, Txt2);
                next.Text = "Deinstallieren";
                break;

            case Page.UnDone:
                if (failed)
                {
                    L("Das hat nicht geklappt", 0, 0, bw, 40, 18f, true);
                    L(errorText, 0, 60, bw, 200, 10f, false, Color.FromArgb(255, 150, 150));
                }
                else
                {
                    L("Erledigt", 0, 0, bw, 44, 20f, true);
                    L("Die Spielhalle wurde entfernt." + (deleteData ? "" : "\n\nDeine Spielstände sind noch da und kommen bei einer neuen Installation zurück."), 0, 60, bw, 120, 10f, false, Txt2);
                }
                next.Text = "Schließen"; cancel.Visible = false;
                break;
        }
        if (!cancel.Visible) next.Left = cancel.Right - next.Width;
        AcceptButton = next;
        Invalidate();
    }

    void Report(int p, string text)
    {
        BeginInvoke((MethodInvoker)delegate { pct = p; pctText = text; if (progLabel != null) progLabel.Text = text; if (progBar != null) progBar.Invalidate(); });
    }

    void RunInstall()
    {
        busy = true;
        var o = new Options { Desktop = opt.Desktop && !TestMode, StartMenu = opt.StartMenu && !TestMode, AutoUpdate = opt.AutoUpdate, Migrate = opt.Migrate || oldVersion != null, Register = !TestMode };
        new Thread(delegate ()
        {
            try { Setup.Install(dir, o, Report, oldVersion != null); }
            catch (Exception e) { failed = true; errorText = e.Message; }
            Thread.Sleep(400);
            BeginInvoke((MethodInvoker)delegate { busy = false; Go(Page.Done); });
        }) { IsBackground = true }.Start();
    }

    void RunUninstall()
    {
        busy = true;
        new Thread(delegate ()
        {
            try { Setup.Uninstall(dir, deleteData, Report); }
            catch (Exception e) { failed = true; errorText = e.Message; }
            Thread.Sleep(400);
            BeginInvoke((MethodInvoker)delegate { busy = false; Go(Page.UnDone); });
        }) { IsBackground = true }.Start();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        if (SidePage)
        {
            var side = new Rectangle(0, 0, S(Side), S(H - Foot));
            using (var br = new LinearGradientBrush(side, Color.FromArgb(0x3a, 0x2a, 0x9a), Color.FromArgb(0x16, 0x12, 0x3a), 90f)) g.FillRectangle(br, side);
            // dezente Kreise im Hintergrund
            using (var c = new SolidBrush(Color.FromArgb(22, 255, 255, 255)))
            {
                g.FillEllipse(c, S(-60), S(250), S(220), S(220));
                g.FillEllipse(c, S(110), S(-50), S(150), S(150));
            }
            Logo.Draw(g, new RectangleF(S(44), S(110), S(112), S(112)));
            using (var f = new Font("Segoe UI Semibold", 15f)) using (var b = new SolidBrush(Color.White))
            {
                var sf = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString("Spielhalle", f, b, new RectangleF(0, S(236), S(Side), S(30)), sf);
            }
            using (var f = new Font("Segoe UI", 9f)) using (var b = new SolidBrush(Color.FromArgb(190, 200, 190, 255)))
            {
                var sf = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString("Version " + Setup.Version, f, b, new RectangleF(0, S(268), S(Side), S(20)), sf);
            }
        }
        else
        {
            var head = new Rectangle(0, 0, S(W), S(Head));
            using (var br = new LinearGradientBrush(head, Color.FromArgb(0x2a, 0x22, 0x5e), Logo.Dunkel, 90f)) g.FillRectangle(br, head);
            string title = "", sub = "";
            switch (page)
            {
                case Page.Folder: title = "Zielordner wählen"; sub = "Wo soll die Spielhalle installiert werden?"; break;
                case Page.Options: title = "Zusätzliche Aufgaben"; sub = "Verknüpfungen, Updates und alte Spielstände"; break;
                case Page.Progress: title = "Installation"; sub = "Bitte kurz warten, das geht schnell."; break;
                case Page.UnProgress: title = "Deinstallation"; sub = "Bitte kurz warten."; break;
            }
            using (var f = new Font("Segoe UI Semibold", 14f)) using (var b = new SolidBrush(Color.White)) g.DrawString(title, f, b, S(38), S(16));
            using (var f = new Font("Segoe UI", 9.5f)) using (var b = new SolidBrush(Txt2)) g.DrawString(sub, f, b, S(40), S(48));
            Logo.Draw(g, new RectangleF(S(W - 76), S(16), S(52), S(52)));
            using (var p = new Pen(Line)) g.DrawLine(p, 0, S(Head), S(W), S(Head));
        }
        using (var p = new Pen(Line)) g.DrawLine(p, 0, S(H - Foot), S(W), S(H - Foot));
        using (var f = new Font("Segoe UI", 8.5f)) using (var b = new SolidBrush(Color.FromArgb(100, 102, 126)))
            g.DrawString("Spielhalle-Setup " + Setup.Version, f, b, S(20), S(H - Foot + 24));
    }
}

class DoubleBufferedPanel : Panel { public DoubleBufferedPanel() { DoubleBuffered = true; } }
