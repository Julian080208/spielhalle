# 🎮 Spielhalle

Über 40 Spiele für einen allein oder die ganze Runde am Fernseher: Partyraum für 3–6 Leute, Immobilienkönig, Lebensweg, Poker, Blackjack, Slots, Minigolf, Flipper, YouTube-Kino und vieles mehr. Alles läuft mit Spielgeld, ohne echtes Geld.

## Installieren

Am einfachsten mit **`Spielhalle einrichten.cmd`** (hier im Projekt): herunterladen und doppelklicken. Die Datei

1. installiert die GitHub CLI, falls sie fehlt (Windows fragt nach Erlaubnis → **Ja**),
2. meldet einmal bei GitHub an (das Projekt ist privat; Code im Browser eingeben),
3. lädt die neueste Spielhalle und prüft sie,
4. installiert bzw. aktualisiert sie und startet sie.

Danach aktualisiert sich die Spielhalle von selbst, beim Start und während des Spielens. Die Datei kann man jederzeit nochmal starten, z. B. auf einem neuen PC.

> Windows meldet vielleicht „Der Computer wurde durch Windows geschützt“, weil das Setup nicht signiert ist.
> Dann auf **Weitere Informationen → Trotzdem ausführen** klicken.

Deinstallieren geht über *Einstellungen → Apps → Spielhalle*.

## Neues Spiel hinzufügen

1. Eine HTML-Datei in den Ordner `spiele/` legen, z. B. `spiele/reaktion.html`.
   Als Vorlage: [`vorlagen/neues-spiel.html`](vorlagen/neues-spiel.html), ein fertiges kleines Spiel zum Abschauen.
2. Auf `main` bringen. Mehr nicht.

GitHub baut dann automatisch eine neue Version, alle installierten Spielhallen holen sie sich selbst, und das Spiel steht in der Liste: mit Cover, „Neu“-Abzeichen und einem Knopf „← Spielhalle“ zum Zurückgehen.
Name, Beschreibung, Kategorie, Emoji und Farbe fürs Cover kommen aus ein paar `<meta name="spielhalle-…">`-Zeilen im Spiel (siehe Vorlage), ohne sie aus dem `<title>`.

Am einfachsten sagt man Claude einfach: *„Mach für die Spielhalle ein Spiel, bei dem …“*

## Für Entwickler

| Ordner / Datei | Inhalt |
|---|---|
| `Launcher.html`, `spiele/` | die Spielhalle selbst (HTML/JS) |
| `spiele/shared/catalog*.js` | Spiele mit selbst gezeichnetem Cover (freiwillig, sonst erzeugt die App eins) |
| `vorlagen/neues-spiel.html` | Vorlage für neue Spiele |
| `installer/Spielhalle.cs` | App: eigenes Fenster, lokaler Server (Port 8777), Online-Updates |
| `installer/Setup.cs` | Installations-Assistent und Deinstaller |
| `installer/build.ps1` | baut App und Setup mit Windows-Bordmitteln |
| `installer/veroeffentlichen.ps1` | neue Version als GitHub-Release veröffentlichen |

Neue Version veröffentlichen: passiert automatisch. Jede Änderung an `Launcher.html`, `spiele/` oder `installer/`, die in `main` landet, baut GitHub Actions auf Windows und veröffentlicht sie als neue Version (letzte Version + 1). Die installierten Spielhallen holen sich das Update dann selbst.

- Neuigkeiten fürs Update: in `installer/neu.txt` schreiben, sonst werden die Commit-Titel genommen.
- Größerer Versionssprung (z. B. 1.1.0): Nummer in `installer/version.txt` eintragen.
- Von Hand vom eigenen PC geht weiterhin: `.\installer\veroeffentlichen.ps1 -Notiz "Neu: ..."`
