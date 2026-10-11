export const meta = {
  name: 'partyspiele-party-kopie',
  description: 'Restliche Partyspiele bauen, durchtesten, Inhalte prüfen und Cover liefern (Fortsetzung nach Nutzungslimit)',
  phases: [
    { title: 'Bauen', detail: 'ein Agent pro Spiel schreibt spiele/<datei>.html' },
    { title: 'Durchspielen', detail: 'Headless-Chromium: ganze Partie spielen, Fehler beheben' },
    { title: 'Prüfen', detail: 'Inhalte, Regeln, Randfälle, Fernseher-Tauglichkeit – mit frischem Blick' },
    { title: 'Cover', detail: 'Katalog-Angaben und gezeichnetes Cover' },
  ],
}

const ROOT = '/home/user/spielhalle-party'   // eigene Arbeitskopie (Branch claude/partyspiele), damit parallel an anderen Spielen gearbeitet werden kann
const SCRATCH = '/tmp/claude-0/-home-user-spielhalle/7f8f18bd-815b-5dd0-91fa-e90ebfc9d13f/scratchpad/party'

const COMMON = `
PROJEKT: "Spielhalle" – eine Spiele-App für einen Partyraum. Ein Windows-PC hängt am Fernseher, 2–8 Leute sitzen auf dem Sofa,
es gibt EINE Tastatur und EINE Maus (keine Handys). Die App zeigt jedes Spiel in einem eigenen Fenster (WebView2/Chromium) unter
http://localhost:8777/spiele/<datei>.html. Jedes Spiel ist EINE eigenständige HTML-Datei in ${ROOT}/spiele/.
Projektregeln stehen in ${ROOT}/CLAUDE.md (alles auf Deutsch, du-Form).

STRENGE REGELN
- Du schreibst/änderst AUSSCHLIESSLICH deine eigene Spieldatei (unten genannt). Keine anderen Dateien im Repo anfassen, keine git-Befehle.
  Hilfsdateien (Testskripte, Screenshots) nur unter ${SCRATCH}/<spiel-id>/.
- Keine externen Ressourcen (kein CDN, keine Webfonts, keine Bilder aus dem Netz). Emoji, CSS, SVG und Canvas sind erlaubt. Alles inline.
- Familien- und freundestauglich: keine sexuellen Inhalte, kein Alkohol/Drogen, keine Beleidigungen, nichts Peinlich-Verletzendes.
- Fehlerfrei: keine Fehler in der Browser-Konsole (außer einem 404 für shared/catalog5.js – die Datei wird später angelegt).

GERÜST (genau so einbinden, Pfade relativ):
  <head>: <meta charset="utf-8">, viewport, <title>TITEL</title>,
          <meta name="spielhalle-beschreibung" content="…"> und <meta name="spielhalle-genre" content="Party, …">,
          <link rel="stylesheet" href="shared/hub.css">
  <body>: <script src="shared/hub.js"></script> dann shared/catalog.js, catalog2.js, catalog3.js, catalog4.js, catalog5.js, dann dein Code.
  Start: Hub.init('<id>'); const bar = Hub.bar({id:'<id>', title:'TITEL', stats:[['k','Label'],…], actions:['help','sound','full']});
         bar.on('help', () => Hub.dialog({title, html:'<p>Regeln…</p>'})); bar.set('k', wert) aktualisiert eine Anzeige.
  Die Spielleiste enthält schon „← Spielhalle“ (zurück zum Launcher) – keinen eigenen Zurück-Knopf nötig, aber am Spielende einen
  Knopf „Zur Spielhalle“ (location.href = '../Launcher.html').

HUB-API (spiele/shared/hub.js – lies sie bei Bedarf selbst):
- Hub.party.active() → Liste der Mitspieler aus dem Launcher („Wer spielt mit?“): [{name, color, avatar, idx}] (avatar = Emoji, color = Hex).
- Hub.dialog({title, html, buttons:[{label, primary, value}], center, dismiss}) → Promise mit value des gedrückten Knopfs.
- Hub.toast(titel, text, icon, kind) – icon z. B. 'sparkles','trophy','user','clock','zap','star','crown','coins'; kind 'ach' für golden.
- Hub.sfx('click'|'hover'|'ok'|'ach'|'bad'|'launch'); Hub.tone(freq, dauer, typ, lautstärke, verzögerung, endFreq) für eigene Töne.
  Lautstärke-Einstellungen werden automatisch beachtet.
- Hub.achieve(id, key, titel, beschreibung) – 2–4 sinnvolle Erfolge; Hub.score(id, wert, {label, silent:true}) optional.
- Hub.read(key, default) / Hub.write(key, wert) für Einstellungen – Schlüssel '<id>_v1'.
- Hub.icon(name) liefert SVG-Icons (home, play, user, clock, trophy, crown, star, zap, refresh, check, x, …).
- CSS (spiele/shared/hub.css): Variablen --font, --font-display, --surface, --surface-2, --border, --text, --text-2, --muted, --accent,
  --good, --bad, --gold; Knöpfe class="h-btn" (+ primary, ghost, sm, lg). html.tv ist gesetzt, wenn der Fernseher-Modus an ist.
- Gute Vorbilder zum Lesen: spiele/roulette.html (Partyrunde mit Spielerfarben), spiele/memory.html (Partymodus), vorlagen/neues-spiel.html.

GEMEINSAMES SPIELGEFÜHL (alle neuen Partyspiele sollen sich ähnlich anfühlen)
- Lobby beim Start: großer Titel, kurze Erklärung in 1–2 Sätzen, Mitspieler als farbige Chips (Avatar + Name) aus Hub.party.active().
  Chips antippen schließt jemanden für DIESES Spiel aus/ein. Feld „+ Gast“ zum schnellen Hinzufügen eines Namens nur für dieses Spiel.
  Sind zu wenige dabei, freundlicher Hinweis (Mindestzahl nennen). Einstellungen (Runden, Zeit, Schwierigkeit, Kategorien) als
  große Umschalter. Großer Start-Knopf.
- Fernseher-tauglich: vom Sofa lesbar – Fließtext ≥ 20px, wichtige Anzeigen 40–120px, kräftige Kontraste, große Klickflächen.
  Alles mit Maus UND Tastatur bedienbar (Enter/Leertaste/Zahlen; Tasten im Bild anzeigen).
- Wer ist dran: immer groß mit Avatar, Name und Spielerfarbe anzeigen. Punkte-Tafel sichtbar.
- Geheime Infos (nur eine Person darf etwas sehen): Vollbild-Sichtschutz „Gib die Tastatur an NAME – nur NAME schaut hin!“ mit Knopf
  „Ich bin NAME – zeigen“, danach Knopf „Verstanden – verdecken“.
- Timer gut sichtbar (Balken/Kreis), letzte Sekunden mit Ton.
- Spielende: Siegerehrung (Podium oder Rangliste mit Avatar/Farbe), Konfetti-Effekt, Knöpfe „Nochmal“ und „Zur Spielhalle“.
- Eigener, stimmiger Hintergrund/Farbschema pro Spiel (dunkel, mit einer kräftigen Akzentfarbe), sanfte Animationen.
- Robust: 2 Spieler und 8 Spieler, Gleichstand, Neustart, mehrfaches Klicken, Fenstergröße 1280×720 bis 1920×1080 und schmal.

TESTEN IM BROWSER (so geht es hier):
- Server: python3 -m http.server <PORT> --directory ${ROOT}   (im Hintergrund starten; PORT siehe Aufgabe; danach beenden)
- Playwright: const { chromium } = require('/opt/node22/lib/node_modules/playwright'); chromium.launch() funktioniert direkt
  (KEIN "playwright install"). Seite: http://localhost:<PORT>/spiele/<datei>.html, Viewport z. B. 1600×900.
- Mitspieler für Tests vorher setzen: localStorage 'hub_party_v1' = JSON {players:[{name:'Julian',col:0,av:0,on:true},…], tv:false, tvScale:1.3}
  (oder einfach die Standardspieler nehmen – ohne Eintrag sind 6 Leute aktiv).
- Fehler sammeln mit page.on('pageerror') und page.on('console') (type error). Screenshots speichern und mit dem Read-Werkzeug ANSEHEN.
`

const GAMES = [
  { id:'quiz', file:'quiz.html', title:'Quiz-Show', port:8801, players:'2–8', spec:`
Buzzer-Quiz wie im Fernsehen. Jeder Spieler bekommt eine eigene Buzzer-Taste auf der gemeinsamen Tastatur (Vorschlag automatisch,
gut verteilt: z. B. Q, P, Z, M, A, L, X, 0 – in der Lobby änderbar durch „Taste drücken“). Ablauf pro Frage: Frage + Kategorie
erscheinen groß, die 4 Antworten (A–D) blenden nach kurzer Lesezeit ein, wer zuerst buzzert, ist dran und wählt per Taste 1–4 oder Klick
(Zeitlimit ~8 s). Richtig: Punkte (schneller = mehr, z. B. 100–200). Falsch: Minuspunkte, die Frage geht an die anderen (Falschbuzzerer
gesperrt). Niemand weiß es: Auflösung. Spannende Musik/Töne mit Hub.tone, Buzzer-Sound pro Spieler (andere Tonhöhe).
Einstellungen: Anzahl Fragen (10/15/20/30), Kategorien wählbar. Am Ende „Finale“-Frage mit doppelten Punkten ist ein Plus.
FRAGENKATALOG: mindestens 240 Fragen auf Deutsch, Kategorien z. B. Allgemeinwissen, Geografie, Geschichte, Natur & Tiere, Sport,
Film & Musik, Essen & Trinken (ohne Alkohol), Wissenschaft & Technik, Deutschland, Kinder-leicht. Jede Frage mit genau einer
eindeutig richtigen Antwort und 3 plausiblen falschen; Schwierigkeit gemischt (leicht/mittel/schwer). NUR Fakten, die sicher stimmen
und nicht veralten (keine „aktuell“-Fragen). Antworten im Spiel mischen. Keine Frage zweimal pro Partie.` },
  { id:'wortbombe', file:'wortbombe.html', title:'Wortbombe', port:8802, players:'3–8', spec:`
„Tick-Tack-Bumm“: In der Mitte tickt eine Bombe, darüber eine Silbe/Buchstabenfolge (z. B. „SCH“, „ung“, „ball“, „ei“).
Wer dran ist, ruft laut ein Wort, das die Silbe enthält, und gibt weiter (Leertaste/Enter/großer Knopf „Weiter →“). Der nächste Spieler
in der Runde ist dran (Reihenfolge im Kreis, Pfeil/Highlight zeigt, wer dran ist). Die Zündschnur hat eine VERSTECKTE zufällige Länge
(einstellbar z. B. 10–30 s / 20–60 s), das Ticken wird gegen Ende schneller (nicht exakt verraten). Explodiert sie, verliert der Spieler
in der Hand ein Leben (3 Leben, Herzen anzeigen) – fette Explosion (Bildschirm-Wackeln, Blitz, Knall per Hub.tone/Rauschen).
Wer alle Leben verliert, scheidet aus; der Letzte gewinnt. Varianten: „Silbe am Anfang/irgendwo/am Ende“, Themen-Modus
(„Nenne ein Tier“, „etwas in der Küche“ …). Silbenliste ≥150 deutscher Silben/Buchstabenfolgen in 3 Schwierigkeiten, Themenliste ≥60.
Kein Schummeln: „Zurück“-Knopf, falls versehentlich weitergegeben.` },
  { id:'spion', file:'spion.html', title:'Wer ist der Spion?', port:8803, players:'3–8', spec:`
Wie „Spyfall“: Alle bis auf einen kennen den geheimen ORT; der Spion kennt ihn nicht. Verteilen per Sichtschutz nacheinander
(jeder sieht „Ort: Freizeitpark – deine Rolle: Kassierer“ bzw. „DU BIST DER SPION 🕵️“). Dann Fragerunde mit großem Timer
(einstellbar 5/8/10 min): Spieler stellen sich reihum Fragen (Anzeige, wer anfängt; Liste aller möglichen Orte groß sichtbar, damit
der Spion raten kann). Jederzeit „Abstimmen“: alle zeigen auf einen Verdächtigen – im Spiel wird der Verdächtige per Klick gewählt und
bestätigt. Erwischt → die anderen bekommen Punkte; falsch → Spion gewinnt. Der Spion kann jederzeit „Ich weiß den Ort!“ drücken und
aus der Ortsliste wählen (Sichtschutz nicht nötig). Bei Zeitablauf Pflichtabstimmung. Punkte über mehrere Runden.
Optional 2 Spione ab 7 Spielern. Ortspakete: mindestens 40 Orte (Alltag, Urlaub, Abenteuer, Schule/Arbeit…), je Ort 6–8 passende Rollen.` },
  { id:'begriffe', file:'begriffe.html', title:'Verbotene Wörter', port:8804, players:'4–8', spec:`
Wie „Tabu“: Zwei Teams (automatisch fair aus den Mitspielern aufgeteilt, in der Lobby per Klick umsortierbar, Teamfarben/-namen).
Ein Erklärer pro Runde (wechselt innerhalb des Teams), Sichtschutz: nur Erklärer + gegnerischer „Wächter“ sollen die Karte sehen –
da alle auf denselben Fernseher schauen, gibt es den Modus: Karte wird auf dem Bildschirm GROSS gezeigt, aber das ratende Team
dreht sich weg (klar anzeigen: „Team Blau: wegschauen!“). Karte: Begriff + 5 verbotene Wörter. Timer 60/90 s. Tasten:
→/Enter = Erraten (+1), X = Verboten gesagt (−1), Leertaste = Überspringen (0 oder −1 einstellbar). Rundenende: Liste der Karten mit
Ergebnis, Korrektur per Klick möglich. Spielende nach Punktziel oder Rundenzahl. Kartenstapel: mindestens 220 Karten auf Deutsch,
3 Schwierigkeiten, sinnvolle verbotene Wörter (die naheliegendsten Erklärwörter, nie der Begriff selbst/Wortteile davon als Lücke).` },
  { id:'montagsmaler', file:'montagsmaler.html', title:'Montagsmaler', port:8805, players:'3–8', spec:`
Malen & Raten: Der Maler sieht per Sichtschutz seinen Begriff (Auswahl aus 3 Begriffen, leicht/mittel/schwer mit 1/2/3 Punkten),
dann malt er mit der Maus auf einer großen Leinwand (Canvas, glatte Linien, Farben-Palette ~10 Farben, 3 Pinselgrößen, Radierer,
Rückgängig, Alles löschen, Füllen optional). Die anderen rufen laut. Wer es errät: Maler klickt auf den Spieler-Chip → Ratender und
Maler bekommen Punkte (früher geraten = mehr). Timer 60/90/120 s mit Tick am Ende; Begriff wird nach Ablauf aufgelöst.
Während des Malens darf der Begriff NICHT auf dem Bildschirm stehen (nur Anzahl Buchstaben als Striche, optional nach der Hälfte der
Zeit ein Buchstabe als Hinweis). Reihum malt jeder, Rundenzahl einstellbar. Begriffsliste: mindestens 300 deutsche, gut malbare
Begriffe (Tiere, Gegenstände, Berufe, Tätigkeiten, Orte, Fahrzeuge, Essen, Sport, Natur, Märchen/Filmfiguren-allgemein).
Galerie am Ende: alle Bilder der Partie als Mini-Vorschau mit Begriff.` },
  { id:'maexchen', file:'maexchen.html', title:'Mäxchen', port:8806, players:'2–8', spec:`
Das Würfel-Bluffspiel „Mäxchen/Mäxle“ mit 2 Würfeln unter dem Becher, Hot-Seat. Wertung: höhere Zahl zuerst (3+1 = 31);
Reihenfolge 31 < 32 < 41 < 42 < 43 < 51 < … < 65 < Pasch 11 < 22 < … < 66 < Mäxchen (21). Ablauf: Spieler am Zug würfelt geheim
(Sichtschutz, animierter Becher), sieht das Ergebnis und SAGT einen Wert an (im Spiel aus einer großen Wertetabelle wählen; muss
höher sein als der vorige angesagte Wert) – darf lügen. Der Nächste sieht nur die Ansage und entscheidet: „Glaube ich“
(dann übernimmt er den Becher, würfelt neu und muss höher ansagen) oder „Aufdecken!“ (Becher hoch, große Animation:
gelogen → Ansager verliert ein Leben; ehrlich → Aufdecker verliert ein Leben). Mäxchen angesagt und stimmt → Aufdecker verliert
2 Leben (einstellbar). Optional „blind weitergeben“ (ohne Nachschauen ansagen). Leben-Anzeige (Bierdeckel-Striche ersetzt durch
Herzen/Würfel), Ausscheiden, Sieger. Wertetabelle als Hilfe immer sichtbar. Schöne 3D-artige Würfel (CSS/SVG).` },
  { id:'schaetzen', file:'schaetzen.html', title:'Schätz mal!', port:8807, players:'2–8', spec:`
Schätzfragen-Show: Eine Frage mit Zahlenantwort (z. B. „Wie viele Knochen hat ein erwachsener Mensch?“ → 206).
Jeder gibt seinen Tipp GEHEIM ein: nacheinander mit Sichtschutz-Übergabe („Gib die Tastatur an Silas“), große Zahleneingabe mit
Ziffernblock-Knöpfen auf dem Bildschirm und Tastatur, Einheit sichtbar. Danach dramatische Auflösung: Zahlenstrahl, Tipps fliegen als
Avatare ein, richtige Antwort erscheint, Abstände werden gezeigt, Punkte: nächster Tipp 3 Punkte, zweiter 2, dritter 1, exakt
Treffer +2 Bonus (bei Gleichstand gleiche Punkte). Kurzer Wissens-Satz zur Antwort. Rundenzahl einstellbar (5/10/15).
FRAGENKATALOG: mindestens 150 Schätzfragen auf Deutsch mit SICHER korrekten, zeitlosen Zahlen (keine Bevölkerungszahlen, Preise,
Rekorde, die sich ändern), aus Natur, Körper, Geografie (Höhen/Längen), Geschichte (Jahreszahlen), Technik, Alltag, Tiere, Weltall.
Jede Frage: text, antwort (Zahl), einheit, info-Satz. Zahlen mit Tausenderpunkt anzeigen.` },
  { id:'wahrheit', file:'wahrheit.html', title:'Wahrheit oder Pflicht', port:8808, players:'3–8', spec:`
Der Klassiker – familien- und freundestauglich. Eine Flasche dreht sich animiert in der Mitte (Spieler-Avatare im Kreis drumherum)
und zeigt auf jemanden; der wählt „Wahrheit“ oder „Pflicht“ (große Knöpfe/Tasten W/P). Karte wird groß gezeigt, Platzhalter wie
{links}, {rechts}, {zufall} werden durch Namen anderer Mitspieler ersetzt. Knöpfe „Geschafft“ (+1 Punkt) / „Joker“ (jeder hat 2 Joker
pro Spiel, neue Karte) / „Nicht gemacht“ (0). Stufen: „Locker“ (für alle Altersgruppen) und „Frech“ (lustiger/peinlicher, aber
weiterhin harmlos – keine Liebe/Flirt/Alkohol/Körper-Themen). Mindestens 140 Wahrheiten und 140 Pflichten insgesamt, sinnvoll auf
die Stufen verteilt; Pflichten müssen im Partyraum machbar sein (singen, Pantomime, Akzent sprechen, Kompliment, Balance-Aufgabe,
Grimasse, kurze Tanzeinlage, Tierlaute…), keine gefährlichen Aufgaben, nichts mit Essen/Trinken-Zwang. Optional Timer für Pflichten
(30 s). Keine Karte doppelt pro Partie. Punktestand + „Mutigster Spieler“ am Ende.` },
  { id:'blitzduell', file:'blitzduell.html', title:'Blitzduell', port:8809, players:'2–6', spec:`
Reaktions-Partyspiel: Jeder Spieler hat eine eigene Taste auf der gemeinsamen Tastatur (automatisch weit auseinander:
z. B. Q, P, Z, M, Leertaste-ist-tabu; in der Lobby per „Taste drücken“ änderbar; Tasten-Kärtchen mit Spielerfarbe im Bild).
Abwechselnde Mini-Runden (je 3–6 s Vorlauf, zufällige Reihenfolge), z. B.:
1) „Drück bei GRÜN“ – Ampel springt nach zufälliger Zeit um, Frühstarter −1.
2) „Farbwort“ – Wort ROT in blauer Schrift: drücken nur, wenn Wort und Farbe zusammenpassen.
3) „Zähl mit“ – Tiere laufen durch, drücken wenn genau 5 Hasen vorbei sind … (oder: drücken, sobald ein 🦄 erscheint, nicht bei 🐴).
4) „Gleiche Zahl“ – zwei Würfel, drücken bei Pasch.
5) „Ton-Reflex“ – drücken beim hohen Ton, nicht beim tiefen.
6) „Gesichter“ – drücken, wenn das Emoji lacht 😀, nicht bei 😐.
Pro Mini-Runde: schnellster richtiger Drücker +2, zweiter +1, falscher Drücker −1. Große Animation, wer gedrückt hat (Kärtchen leuchtet),
Ranglisten-Balken. Spiel bis 15 Punkte oder 12 Runden (einstellbar). Gleichzeitig gedrückte Tasten müssen alle erkannt werden
(keydown-Events mit e.code, Auto-Repeat ignorieren). Fair: Reihenfolge per performance.now().` },
]

const META_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    file: { type: 'string', description: 'z. B. spiele/quiz.html' },
    title: { type: 'string' },
    tagline: { type: 'string', description: 'kurzer knackiger Satz, max ~45 Zeichen' },
    genres: { type: 'array', items: { type: 'string' }, description: 'erstes Genre "Party", dazu 1–2 aus: Denken, Wörter, Familie, Geschick, Casino, Karten, Brettspiel, Action' },
    accent: { type: 'string', description: 'Hex-Farbe wie #ff4f7a' },
    desc: { type: 'string', description: '2–3 Sätze Beschreibung für den Launcher, inkl. Spielerzahl' },
    controls: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Paare [Taste/Aktion, Bedeutung], 2–4 Stück' },
    coverSvg: { type: 'string', description: 'INNERER SVG-Inhalt für viewBox 0 0 640 360 (ohne äußeres <svg>), eigene <defs> erlaubt; alle ids mit Präfix UID (z. B. id="UIDg1", fill="url(#UIDg1)"); Titel des Spiels groß im Bild; Schriften: Bahnschrift/Segoe UI, Emoji via font-family Segoe UI Emoji' },
    logoSvg: { type: 'string', description: 'INNERER SVG-Inhalt für viewBox 0 0 64 64 inkl. Hintergrund (rect 64×64), ids ebenfalls mit Präfix UID' },
    report: { type: 'string', description: 'Was gebaut/getestet wurde, Inhaltsmengen (Anzahl Fragen/Karten), bekannte Grenzen' },
  },
  required: ['id', 'file', 'title', 'tagline', 'genres', 'accent', 'desc', 'controls', 'coverSvg', 'logoSvg', 'report'],
}

const LIST = (args && args.ids) ? GAMES.filter(g => args.ids.includes(g.id)) : GAMES
log(`Spiele in diesem Durchlauf: ${LIST.map(g => g.id).join(', ')}`)
const results = await pipeline(
  LIST,
  // 1) Bauen (schon fertig geschriebene Spiele aus args.fertig werden nicht neu gebaut)
  (g) => (args && args.fertig && args.fertig.includes(g.id)) ? `Das Spiel wurde bereits vollständig geschrieben (${ROOT}/spiele/${g.file}), aber noch nicht getestet. Lies es zuerst ganz.` : agent(`${COMMON}

DEINE AUFGABE: Baue das Partyspiel „${g.title}“ als ${ROOT}/spiele/${g.file} (Spiel-ID '${g.id}', ${g.players} Spieler).
SPEZIFIKATION:
${g.spec}

Schreibe ein vollständiges, liebevoll gestaltetes, sofort spielbares Spiel – kein Prototyp. Inhalte (Fragen/Karten/Begriffe) vollständig
und in der verlangten Menge direkt im Code. Teste es danach selbst kurz im Browser (Port ${g.port}): Lobby → eine Runde → Ende,
keine Konsolenfehler, Screenshot ansehen. Antworte am Ende mit einer knappen Zusammenfassung (was gebaut, Inhaltsmengen, Tasten).`,
    { label: `bauen:${g.id}`, phase: 'Bauen' }),
  // 2) Durchspielen und reparieren
  (built, g) => { if (!built) throw new Error('Bauen abgebrochen'); return agent(`${COMMON}

AUFGABE: Du bist Spieletester. Das Partyspiel „${g.title}“ liegt in ${ROOT}/spiele/${g.file} (Spiel-ID '${g.id}').
Der Entwickler meldet: ${String(built || '').slice(0, 2500)}

Spiele es in Headless-Chromium (Port ${g.port}) KOMPLETT durch – per Playwright-Skript, das echte Klicks/Tasten auslöst:
- Lobby: Spieler ab-/anwählen, Gast hinzufügen, Einstellungen ändern, zu wenige Spieler → Hinweis.
- Mindestens eine ganze Partie mit 3 Spielern bis zur Siegerehrung, dann „Nochmal“; zusätzlich ein Lauf mit 2 bzw. Mindestzahl und
  einer mit 8 Spielern (localStorage 'hub_party_v1' setzen bzw. Gäste hinzufügen).
- Randfälle: schnelles Mehrfachklicken, Tasten während Animationen, Gleichstand, Timer läuft ab, Fenster 1280×720 und 1920×1080.
- Screenshots an Schlüsselstellen machen und ANSEHEN: Ist alles vom Sofa lesbar? Überlappt etwas? Wird etwas abgeschnitten?
Behebe jeden gefundenen Fehler direkt in der Datei (nur in dieser Datei) und teste erneut, bis alles sauber läuft.
Antworte mit einer Liste: gefundene Probleme → was du geändert hast → Ergebnis des letzten Testlaufs (Konsolenfehler: ja/nein).`,
    { label: `testen:${g.id}`, phase: 'Durchspielen' }) },
  // 3) Inhalte, Regeln, Randfälle mit frischem Blick
  (tested, g) => { if (!tested) throw new Error('Testen abgebrochen'); return agent(`${COMMON}

AUFGABE: Kritische Endabnahme mit frischem Blick für „${g.title}“ in ${ROOT}/spiele/${g.file} (Spiel-ID '${g.id}').
Bisheriger Testbericht: ${String(tested || '').slice(0, 2500)}

Prüfe gründlich und BEHEBE alles direkt in der Datei:
1) INHALTE: Gehe JEDEN Eintrag der Inhaltslisten (Fragen, Antworten, Karten, Begriffe, Orte, Aufgaben) einzeln durch.
   - Fakten müssen sicher stimmen (bei Zweifel: Eintrag korrigieren oder entfernen und durch einen sicheren ersetzen).
   - Deutsch: Rechtschreibung, Umlaute, Groß-/Kleinschreibung, natürliche Formulierung.
   - Familien-/Freundestauglich, keine Doppelungen, Mindestmengen aus der Spezifikation erfüllt (zähle nach und nenne die Zahl).
   ${g.spec.split('\n').filter(l => /mindestens|≥/.test(l)).join(' ')}
2) REGELN & LOGIK: Stimmt die Spielmechanik mit der Spezifikation überein? Punkte, Reihenfolge, Ausscheiden, Gleichstand, Spielende,
   Neustart setzt alles zurück, keine hängenden Timer nach „Nochmal“, keine doppelten Event-Handler.
3) PARTYRAUM: Vom Sofa lesbar? Sichtschutz verhindert wirklich, dass Geheimes zu früh sichtbar ist? Tasten im Bild erklärt?
   Hilfe-Dialog vollständig? Erfolge (Hub.achieve) sinnvoll?
SPEZIFIKATION zur Kontrolle:
${g.spec}
Teste nach deinen Änderungen erneut im Browser (Port ${g.port}, ganze Partie, keine Konsolenfehler, Screenshots ansehen).
Antworte mit: Inhaltsmengen (gezählt), korrigierte/entfernte Einträge, Logik-Fixes, Ergebnis des letzten Testlaufs.`,
    { label: `pruefen:${g.id}`, phase: 'Prüfen' }) },
  // 4) Katalog-Angaben und Cover
  (reviewed, g) => { if (!reviewed) throw new Error('Prüfen abgebrochen'); return agent(`${COMMON}

AUFGABE: Das Spiel „${g.title}“ (${ROOT}/spiele/${g.file}, ID '${g.id}') ist fertig. Lies die Datei, damit Beschreibung und Steuerung
EXAKT stimmen. Liefere die Katalog-Angaben und ein hochwertiges, gezeichnetes Cover als SVG-Code (strukturierte Ausgabe).
Stil wie die vorhandenen Cover in ${ROOT}/spiele/shared/catalog4.js (ansehen!): 640×360, kräftiger Hintergrund mit Verlauf,
ein großes, klares Motiv zum Spiel, großer Spieltitel (font-family Bahnschrift, font-weight 800, mit Kontur/Schatten), kein Kleinkram.
Das Logo (64×64) ist eine Mini-Version: Hintergrund-Verlauf + ein klares Symbol.
Alle ids im SVG mit Präfix UID (wird später pro Bild ersetzt).
PRÜFE dein Cover: schreibe es in eine Test-HTML-Datei unter ${SCRATCH}/${g.id}/cover.html (UID durch 'c1' ersetzt, in
<svg viewBox="0 0 640 360" width="640" height="360">…</svg>) und das Logo daneben, mache mit Playwright (file://-URL reicht) einen
Screenshot und sieh ihn an. Verbessere, bis es gut aussieht.
In "report" fasse zusammen: ${String(reviewed || '').slice(0, 1500)}`,
    { label: `cover:${g.id}`, phase: 'Cover', schema: META_SCHEMA }) },
)

return { games: results.map((r, i) => r ? r : { id: LIST[i].id, failed: true }) }