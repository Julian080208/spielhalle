# 🎮 Spielhalle

Über 40 Spiele für einen allein oder die ganze Runde am Fernseher: Partyspiele, Immobilienkönig, Lebensweg, Poker, Blackjack, Minigolf, Flipper, YouTube-Kino und vieles mehr. Alles mit Spielgeld, ohne echtes Geld.

## Installieren (Windows)

1. **[Spielhalle.exe herunterladen](https://github.com/Julian080208/spielhalle/releases/latest/download/Spielhalle.exe)**
2. Doppelklicken. Fertig.

Die Spielhalle richtet sich selbst ein, mit Symbol auf dem Desktop und im Startmenü, und öffnet sich in einem eigenen Fenster.
Ab dann geht alles von selbst: Neue Spiele und Verbesserungen holt sie sich direkt von GitHub, beim Start und alle 10 Minuten. Die App selbst aktualisiert sich auch.

> Windows meldet vielleicht „Der Computer wurde durch Windows geschützt“, weil die Datei nicht signiert ist.
> Dann auf **Weitere Informationen → Trotzdem ausführen** klicken.

- **F11**: Vollbild an/aus
- Entfernen: *Einstellungen → Apps → Spielhalle → Deinstallieren*

## Neues Spiel hinzufügen

1. Eine HTML-Datei in den Ordner `spiele/` legen, z. B. `spiele/reaktion.html`.
   Als Vorlage dient [`vorlagen/neues-spiel.html`](vorlagen/neues-spiel.html), ein fertiges kleines Spiel zum Abschauen.
2. Auf `main` bringen. Mehr nicht.

Spätestens nach 10 Minuten (oder beim nächsten Start) steht das Spiel in jeder Spielhalle, mit Cover und „Neu“-Abzeichen.
Name, Beschreibung, Kategorie, Emoji und Farbe fürs Cover kommen aus ein paar `<meta name="spielhalle-…">`-Zeilen im Spiel.

Am einfachsten sagt man Claude einfach: *„Mach für die Spielhalle ein Spiel, bei dem …“*

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `Launcher.html` | die Startseite mit allen Spielen |
| `spiele/` | die Spiele (jede HTML-Datei ist ein Spiel) |
| `spiele/shared/` | gemeinsame Bibliothek (`hub.js`) und gezeichnete Cover (`catalog*.js`) |
| `app/` | die Windows-App `Spielhalle.exe` (C#) und ihr Build-Skript |
| `vorlagen/` | Vorlage für neue Spiele |

`Launcher.html` und `spiele/` holt die App direkt aus `main`, dafür braucht es keine neue Version.
Nur Änderungen an `app/` werden zu einer neuen `Spielhalle.exe`: GitHub Actions baut sie, testet sie auf Windows und veröffentlicht sie als Release. Die installierten Apps aktualisieren sich dann selbst.
