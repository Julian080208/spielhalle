# 🎮 Spielhalle

Über 40 Spiele für einen allein oder die ganze Runde am Fernseher: Partyraum für 3–6 Leute, Immobilienkönig, Lebensweg, Poker, Blackjack, Slots, Minigolf, Flipper, YouTube-Kino und vieles mehr. Alles läuft mit Spielgeld, ohne echtes Geld.

## Installieren

**[⬇️ Spielhalle-Setup.exe herunterladen](https://github.com/Julian080208/spielhalle/releases/latest/download/Spielhalle-Setup.exe)**

1. Setup starten und dem Assistenten folgen. Admin-Rechte braucht man nicht.
2. Die Spielhalle öffnet sich in einem eigenen Fenster.
3. Updates kommen automatisch: Beim Start und während des Spielens schaut die App nach einer neuen Version.

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
