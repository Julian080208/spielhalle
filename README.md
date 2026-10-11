# 🎮 Spielhalle

Über 40 Spiele für einen allein oder die ganze Runde am Fernseher: Partyraum für 3–6 Leute, Immobilienkönig, Lebensweg, Poker, Blackjack, Slots, Minigolf, Flipper, YouTube-Kino und vieles mehr. Alles läuft mit Spielgeld, ohne echtes Geld.

## Installieren

Das Projekt ist privat. Den Installer gibt es deshalb nur für angemeldete Konten mit Zugriff:

1. Im Browser bei GitHub anmelden und unter **Releases** die neueste `Spielhalle-Setup.exe` laden.
2. Setup starten und dem Assistenten folgen. Admin-Rechte braucht man nicht.
3. Einmal bei GitHub anmelden, damit Updates kommen. In der Spielhalle steht dafür links unten **🔑 Bei GitHub anmelden**. Ein Fenster installiert die GitHub CLI (falls nötig) und startet die Anmeldung im Browser.
4. Ab dann kommen Updates automatisch: beim Start und während des Spielens.

> Windows meldet vielleicht „Der Computer wurde durch Windows geschützt“, weil das Setup nicht signiert ist.
> Dann auf **Weitere Informationen → Trotzdem ausführen** klicken.

Deinstallieren geht über *Einstellungen → Apps → Spielhalle*.

## Für Entwickler

| Ordner / Datei | Inhalt |
|---|---|
| `Launcher.html`, `spiele/` | die Spielhalle selbst (HTML/JS) |
| `installer/Spielhalle.cs` | App: eigenes Fenster, lokaler Server (Port 8777), Online-Updates |
| `installer/Setup.cs` | Installations-Assistent und Deinstaller |
| `installer/build.ps1` | baut App und Setup mit Windows-Bordmitteln |
| `installer/veroeffentlichen.ps1` | neue Version als GitHub-Release veröffentlichen |

Neue Version veröffentlichen:

```powershell
.\installer\veroeffentlichen.ps1 -Notiz "Neu: ..."
```
