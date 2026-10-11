# Spielhalle

Spiele-App für einen Partyraum (Windows, Fernseher). Alles auf Deutsch: Texte, Kommentare, Commit-Nachrichten.

- Neues Spiel = eine HTML-Datei in `spiele/` (Vorlage: `vorlagen/neues-spiel.html`, mit den `<meta name="spielhalle-…">`-Angaben).
  Die App findet sie selbst (`/__spiele` in `app/Spielhalle.cs`, Anzeige in `Launcher.html`). Ein Eintrag in
  `spiele/shared/catalog*.js` ist nur nötig für ein gezeichnetes Cover; die Spielleiste kommt aus `spiele/shared/hub.js`.
- Die App (`app/Spielhalle.cs`) lädt `Launcher.html` und `spiele/` direkt aus `main` (GitHub-API, ohne Anmeldung –
  das Projekt muss öffentlich sein). Änderungen dort sind nach spätestens 10 Minuten in jeder Spielhalle.
- Änderungen an `app/` werden über `.github/workflows/app.yml` gebaut, auf Windows getestet und als Release veröffentlicht.
- Die App wird mit dem csc aus .NET Framework 4 gebaut (C# 5): keine neueren Sprachfeatures
  wie `$"..."`, `?.` oder `=>`-Methoden verwenden.
