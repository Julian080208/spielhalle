# Spielhalle

Spiele-App für einen Partyraum (Windows, Fernseher). Alles auf Deutsch: Texte, Kommentare, Commit-Nachrichten.

- Neues Spiel = eine HTML-Datei in `spiele/` (Vorlage: `vorlagen/neues-spiel.html`, mit den `<meta name="spielhalle-…">`-Angaben).
  Die App findet sie selbst (`/__spiele` in `installer/Spielhalle.cs`, Anzeige in `Launcher.html`). Ein Eintrag in
  `spiele/shared/catalog*.js` ist nur nötig, wenn das Spiel ein gezeichnetes Cover oder die Spielleiste aus `hub.js` bekommen soll.
- Jede Änderung an `Launcher.html`, `spiele/` oder `installer/` auf `main` wird automatisch eine neue Version
  (`.github/workflows/veroeffentlichen.yml`), die installierten Spielhallen aktualisieren sich selbst.
- Die App (`installer/*.cs`) wird mit dem csc aus .NET Framework 4 gebaut (C# 5): keine neueren Sprachfeatures
  wie `$"..."`, `?.` oder `=>`-Methoden verwenden.
