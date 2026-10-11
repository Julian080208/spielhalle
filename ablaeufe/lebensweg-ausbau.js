export const meta = {
  name: 'lebensweg-ausbau',
  description: 'Lebensweg (Spiel des Lebens) deutlich verbessern und stark mit Inhalten erweitern – planen, Inhalte schreiben, einbauen, durchtesten',
  phases: [
    { title: 'Planen', detail: '3 unabhängige Entwürfe + Zusammenführung zu einem Bauplan' },
    { title: 'Inhalte', detail: 'Inhaltspakete als eigene Datendateien schreiben und prüfen' },
    { title: 'Einbauen', detail: 'Spielmechanik, Spielbrett, Optik nacheinander umsetzen' },
    { title: 'Testen', detail: 'automatische Partien, Bedienung, Fernseher-Optik – Fehler sammeln und beheben' },
  ],
}

const ROOT = '/home/user/spielhalle'
const SCRATCH = '/tmp/claude-0/-home-user-spielhalle/7f8f18bd-815b-5dd0-91fa-e90ebfc9d13f/scratchpad/lebensweg'

const CTX = `
PROJEKT: "Spielhalle" – Spiele-App für einen Partyraum. Windows-PC am Fernseher, 2–6 Leute auf dem Sofa, eine Maus/Tastatur.
Die App zeigt Spiele in einem eigenen Fenster (WebView2/Chromium) unter http://localhost:8777/spiele/…. Alles auf Deutsch (du-Form),
Regeln in ${ROOT}/CLAUDE.md.
DAS SPIEL: "Lebensweg" – ein Spiel des Lebens: ${ROOT}/spiele/lebensweg.html (Markup + CSS) und ${ROOT}/spiele/lebensweg.js (~880 Zeilen:
Daten JOBS/UJOBS/HOUSES/UNI_EVENTS/EVENTS/TRIPS, Welt mit Segmenten SEGS + Abzweigungen FORKS auf einer 3600×2400-Karte, Canvas-Rendering,
Glücksrad 1–10, Feld-Aktionen, Stoppfelder, KI-Spieler, Lobby, Speichern unter 'leben2_save'). Gemeinsame Bibliothek: ${ROOT}/spiele/shared/hub.js
(Hub.party.active(), Hub.dialog, Hub.toast, Hub.sfx, Hub.tone, Hub.achieve, Hub.read/write, Hub.bar) und hub.css.
Der Besitzer wünscht: "Mach das Spiel des Lebens besser und VIEL mehr" – mehr Inhalt, mehr Abwechslung, mehr echte Entscheidungen,
schöner und partytauglicher (vom Sofa lesbar), ohne dass eine Partie endlos wird (Ziel: 45–75 Minuten mit 4 Leuten).
Familien- und freundestauglich (kein Alkohol/Drogen/Sex, nichts Verletzendes). Keine externen Ressourcen (alles inline, Emoji ok).

TESTEN IM BROWSER: python3 -m http.server <PORT> --directory ${ROOT} (im Hintergrund, danach beenden);
Playwright: const { chromium } = require('/opt/node22/lib/node_modules/playwright'); chromium.launch() geht direkt (KEIN playwright install).
Seite: http://localhost:<PORT>/spiele/lebensweg.html. Screenshots speichern und mit dem Read-Werkzeug ANSEHEN. Fehler über page.on('pageerror')
und console-Fehler sammeln. Hilfsdateien nur unter ${SCRATCH}/. Keine git-Befehle.
`

// ------------------------------------------------------------------ 1) Planen
phase('Planen')
const ANGLES = [
  ['inhalt', 'INHALT & ABWECHSLUNG: Was fehlt an Ereignissen, Berufen, Häusern, Reisen, Hobbys, Karten? Welche neuen Inhaltsarten machen jede Partie anders (Entscheidungs-Ereignisse mit 2–3 Optionen, Aktionskarten zum Aufheben, Lebensziele/geheime Aufträge, Gruppen-Ereignisse)?'],
  ['mechanik', 'MECHANIK & SPIELBRETT: Welche neuen Wege/Abzweigungen, Feldtypen, Stoppfelder und Regeln (Jobwechsel, Selbstständigkeit, Haustiere, Hobbys, Midlife-Krise, Lotterie, Erbschaft, Rente) machen das Spiel strategischer, ohne es zu verlängern? Wie bleibt die KI sinnvoll?'],
  ['party', 'PARTY-SPASS & OPTIK: Was macht es am Fernseher mit 4 Leuten lustig? Gruppen-Momente, bei denen alle mitmachen, dramatische Animationen, große lesbare Ereigniskarten, Siegerehrung mit Auszeichnungen, Sound. Welche Darstellungsfehler gibt es (z. B. Stoppfeld-Schilder werden von Feldern verdeckt)?'],
]
const proposals = await parallel(ANGLES.map(([k, focus]) => () => agent(`${CTX}
AUFGABE: Lies lebensweg.js und lebensweg.html VOLLSTÄNDIG und spiele das Spiel kurz im Browser an (Port ${8820 + ANGLES.findIndex(a => a[0] === k)},
z. B. nur KI-Spieler: localStorage 'leben2_lobby' setzen oder Lobby bedienen). Erstelle einen konkreten, umsetzbaren Verbesserungsplan mit Fokus:
${focus}
Sei konkret (Mengen, Datenfelder, Beispiele, Koordinaten-Ideen für neue Segmente, betroffene Funktionen). Nenne auch Risiken.
Antworte als gut gegliederter Text (max. ~1500 Wörter).`, { label: `plan:${k}`, phase: 'Planen' })))

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string', description: 'Zusammenfassung des Gesamtplans (was wird anders/neu)' },
    contentPackages: {
      type: 'array',
      description: '4–7 unabhängige Inhaltspakete; jedes wird als EIGENE Datei spiele/lebensweg-<key>.js geschrieben, die genau eine globale Variable setzt',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'kurz, Kleinbuchstaben, z. B. ereignisse, entscheidungen, berufe, haeuser, karten, reisen' },
          globalName: { type: 'string', description: 'z. B. LW_EREIGNISSE' },
          what: { type: 'string', description: 'Was das Paket enthält und wofür es im Spiel benutzt wird' },
          minCount: { type: 'string', description: 'Mindestmengen je Unterart' },
          schema: { type: 'string', description: 'GENAUES Datenformat mit allen Feldern, erlaubten Werten und 2 vollständigen Beispielen' },
          balance: { type: 'string', description: 'Balance-Regeln (Beträge in Euro als ganze Zahlen, Verteilung positiv/negativ, Seltenheit)' },
        },
        required: ['key', 'globalName', 'what', 'minCount', 'schema', 'balance'],
      },
    },
    enginePlan: { type: 'string', description: 'Schritt-für-Schritt-Plan für Spielmechanik und Spielbrett: neue Segmente/Abzweigungen (mit Koordinaten innerhalb 3600×2400), Feldtypen, Stoppfelder, wie jedes Inhaltspaket benutzt wird, KI-Verhalten, neuer Speicherschlüssel leben3_save, Test-Schnellmodus (localStorage lebensweg_test={fast:true} überspringt Wartezeiten/Animationen)' },
    visualPlan: { type: 'string', description: 'Plan für Optik/Partygefühl: Schilder-Überlappung beheben, Ereigniskarten, TV-Lesbarkeit, Animationen, Siegerehrung mit Auszeichnungen, Lobby' },
    testPlan: { type: 'string', description: 'Was die Tester prüfen sollen (Abbruch-/Hängefälle, Spieldauer, Balance, Bedienung)' },
  },
  required: ['overview', 'contentPackages', 'enginePlan', 'visualPlan', 'testPlan'],
}
if (proposals.filter(Boolean).length < ANGLES.length) throw new Error('Planer abgebrochen (vermutlich Nutzungslimit) – später fortsetzen')
const spec = await agent(`${CTX}
AUFGABE: Drei Planer haben unabhängig Verbesserungen für Lebensweg vorgeschlagen. Lies die Vorschläge, lies das Spiel selbst (lebensweg.js/html),
und erstelle EINEN verbindlichen Bauplan. Übernimm die besten Ideen, streiche Überladenes, halte die Partie bei 45–75 Minuten.
Wichtig für die Arbeitsteilung: Inhalte werden in 4–7 Paketen PARALLEL von verschiedenen Leuten als eigene Dateien geschrieben
(spiele/lebensweg-<key>.js, je genau eine globale Variable, z. B. window.LW_EREIGNISSE = [...]) – daher braucht jedes Paket ein
exaktes, vollständiges Datenformat. Bestehende Inhalte (JOBS, UJOBS, HOUSES, UNI_EVENTS, EVENTS, TRIPS) sollen in die Pakete übernommen
und stark erweitert werden (z. B. Ereignisse ≥150, Entscheidungs-Ereignisse ≥50, Berufe ≥30 mit Fähigkeiten, Häuser ≥12, Reisen ≥20,
Uni-Ereignisse ≥30, Aktionskarten ≥40 – passe an, wenn sinnvoll). Das Spielwerk wird danach von EINER Person umgebaut.

VORSCHLAG INHALT:
${proposals[0] || '(fehlt)'}

VORSCHLAG MECHANIK:
${proposals[1] || '(fehlt)'}

VORSCHLAG PARTY & OPTIK:
${proposals[2] || '(fehlt)'}`, { label: 'plan:zusammenfuehren', phase: 'Planen', schema: SPEC_SCHEMA })
if (!spec) throw new Error('Kein Bauplan')
log(`Bauplan: ${spec.contentPackages.length} Inhaltspakete: ${spec.contentPackages.map(p => p.key).join(', ')}`)

// ------------------------------------------------------------------ 2) Inhalte (je Paket: schreiben → prüfen)
const content = await pipeline(
  spec.contentPackages,
  (pk) => agent(`${CTX}
GESAMTPLAN (zur Einordnung): ${spec.overview}

DEINE AUFGABE: Schreibe das Inhaltspaket "${pk.key}" als NEUE Datei ${ROOT}/spiele/lebensweg-${pk.key}.js – und NUR diese Datei.
Die Datei setzt genau eine globale Variable: window.${pk.globalName} = …; (reines Daten-JavaScript, keine Logik, keine Abhängigkeiten,
UTF-8, gut lesbar formatiert, ein Eintrag pro Zeile wo möglich).
INHALT: ${pk.what}
MINDESTMENGEN: ${pk.minCount}
DATENFORMAT (exakt einhalten): ${pk.schema}
BALANCE: ${pk.balance}
Übernimm passende bestehende Einträge aus ${ROOT}/spiele/lebensweg.js und erweitere stark. Abwechslungsreich, witzig, lebensnah, deutsch,
familientauglich, keine Doppelungen. Prüfe am Ende mit node, dass die Datei fehlerfrei lädt (z. B. node -e "global.window={};require('${ROOT}/spiele/lebensweg-${pk.key}.js');console.log(Object.keys(window), …Anzahlen…)").
Antworte mit den gezählten Mengen je Unterart.`, { label: `inhalt:${pk.key}`, phase: 'Inhalte' }),
  (written, pk) => agent(`${CTX}
AUFGABE: Strenge Prüfung des Inhaltspakets ${ROOT}/spiele/lebensweg-${pk.key}.js (globale Variable ${pk.globalName}).
Der Autor meldet: ${String(written || '').slice(0, 1200)}
Soll-Format: ${pk.schema}
Mindestmengen: ${pk.minCount}
Balance: ${pk.balance}
Gehe JEDEN Eintrag einzeln durch und BEHEBE direkt in der Datei (nur diese Datei):
- Format exakt (alle Pflichtfelder, richtige Typen/Werte) – schreibe dafür ein kleines node-Prüfskript unter ${SCRATCH}/ und lass es laufen.
- Deutsch: Rechtschreibung, Umlaute, natürliche Sätze, du-Form wo Spieler angesprochen werden.
- Familientauglich, nichts Verletzendes, keine Doppelungen oder Fast-Doppelungen.
- Balance: Beträge plausibel und im Rahmen, gute Mischung positiv/negativ, keine spielentscheidenden Ausreißer.
- Mindestmengen erfüllt (sonst ergänzen).
Antworte mit: gezählte Mengen, Anzahl korrigierter/ersetzter Einträge, Ergebnis des Prüfskripts.`, { label: `pruefen:${pk.key}`, phase: 'Inhalte' }),
)

if (content.some(c => !c)) throw new Error('Inhaltspaket abgebrochen (vermutlich Nutzungslimit) – später fortsetzen')
// ------------------------------------------------------------------ 3) Einbauen (nacheinander, gleiche Dateien)
phase('Einbauen')
const PKG_LIST = spec.contentPackages.map(p => `- spiele/lebensweg-${p.key}.js → window.${p.globalName}: ${p.what}\n  Format: ${p.schema}`).join('\n')
const engine = await agent(`${CTX}
AUFGABE (Teil 1 von 3 – Spielwerk): Baue Lebensweg nach diesem Plan um. Du bearbeitest lebensweg.js und lebensweg.html.
Die neuen Inhaltsdateien liegen fertig vor und müssen in lebensweg.html VOR lebensweg.js eingebunden werden:
${PKG_LIST}
Die alten Datenlisten in lebensweg.js werden durch die Pakete ersetzt (Fallback auf eine kleine Notliste, falls eine Datei fehlt).
SPIELWERK-PLAN:
${spec.enginePlan}
Vorgaben: neuer Speicherschlüssel 'leben3_save' (alte Spielstände ignorieren), Lobby-Schlüssel darf bleiben. Test-Schnellmodus über
localStorage 'lebensweg_test' = {"fast":true}: keine Wartezeiten/Animationen, KI-Entscheidungen sofort – damit Tester ganze Partien in
Sekunden laufen lassen können; zusätzlich window.LW_DEBUG = {state:()=>S} für Tests. Die KI muss ALLE neuen Entscheidungen treffen können.
Nichts darf hängen bleiben. Teste selbst (Port 8830): mindestens 3 komplette Partien nur mit KI im Schnellmodus bis zur Siegerehrung,
keine Konsolenfehler; eine Partie mit einem menschlichen Spieler bis zu den ersten Entscheidungen. Antworte mit einer Zusammenfassung der
Änderungen (Mechaniken, Segmente, Feldtypen) und den Testergebnissen (Partien, Dauer in Zügen).`, { label: 'einbau:spielwerk', phase: 'Einbauen' })

if (!engine) throw new Error('Spielwerk-Umbau abgebrochen – später fortsetzen')
const visual = await agent(`${CTX}
AUFGABE (Teil 2 von 3 – Optik & Partygefühl): Das Spielwerk wurde gerade umgebaut. Bericht: ${String(engine || '').slice(0, 3000)}
Setze diesen Optik-Plan um (lebensweg.html/.js):
${spec.visualPlan}
Zusätzlich Pflicht: Die Schilder an Stoppfeldern/Abzweigungen dürfen NICHT von Feldern verdeckt werden (über den Feldern zeichnen bzw.
versetzt, gut lesbar); Ereignis-/Entscheidungskarten groß und vom Sofa lesbar (Titel ≥ 28px, Text ≥ 20px); das Protokoll links unten
und die Spielerliste gut lesbar; Siegerehrung mit Podium und Auszeichnungen. Nichts an der Spiellogik kaputt machen.
Teste im Browser (Port 8831) mit Screenshots bei 1280×720 und 1920×1080 und SIEH SIE DIR AN; mindestens 1 komplette KI-Partie im
Schnellmodus (localStorage 'lebensweg_test' = {"fast":true}) ohne Konsolenfehler. Antworte mit den Änderungen und Testergebnissen.`, { label: 'einbau:optik', phase: 'Einbauen' })

if (!visual) throw new Error('Optik-Umbau abgebrochen – später fortsetzen')
// ------------------------------------------------------------------ 4) Testen (Runden: finden parallel → sammeln → einer behebt)
const FIND_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          title: { type: 'string' },
          repro: { type: 'string', description: 'genaue Schritte/Bedingungen, Fehlermeldung, betroffene Funktion/Zeile' },
          fix: { type: 'string', description: 'Vorschlag zur Behebung' },
        },
        required: ['severity', 'title', 'repro', 'fix'],
      },
    },
    stats: { type: 'string', description: 'gemessene Werte (Partien, Züge, Dauer, Vermögen …)' },
  },
  required: ['findings', 'stats'],
}
const TESTERS = [
  ['partien', 8840, `Lass mindestens 15 komplette Partien nur mit KI (2, 3, 4 und 6 Spieler, verschiedene Regel-Einstellungen) im Schnellmodus laufen
(localStorage 'lebensweg_test' = {"fast":true}; Zustand über window.LW_DEBUG.state()). Erkenne Hänger (Partie endet nicht in vernünftiger Zeit),
Konsolenfehler, NaN/undefined in Geld/Anzeigen, negative Kinderzahlen, Spieler die nie in Rente gehen, unfaire Ausreißer. Miss Züge pro Partie,
Endvermögen-Spannen, Häufigkeit der Inhaltsarten (wird jedes Paket wirklich benutzt?).`],
  ['bedienung', 8841, `Spiele als MENSCH (2 menschliche Spieler + 1 KI, normales Tempo, NICHT Schnellmodus) mindestens bis zur Hälfte, besser bis zum Ende:
jede neue Entscheidungsart, Abzweigung, Aktionskarte, Stoppfeld bedienen (Maus UND Tastatur), Fortsetzen nach Neuladen (leben3_save),
Lobby inkl. „Partyrunde übernehmen“. Finde alles, was hängt, verwirrt, nicht klickbar ist oder falsch erklärt wird; Hilfe-Dialog aktuell?`],
  ['optik', 8842, `Prüfe die Darstellung am Fernseher: Screenshots bei 1280×720, 1600×900, 1920×1080 und im Fernseher-Modus (localStorage hub_party_v1 mit tv:true,
tvScale:1.3) in Lobby, Spiel (verschiedene Kartenbereiche, Abzweigungen, Stoppfelder), Ereigniskarten, Entscheidungen und Siegerehrung.
SIEH JEDEN SCREENSHOT AN. Finde Überlappungen, abgeschnittene Texte, zu kleine Schrift, schlechte Kontraste, verdeckte Schilder, ruckelnde Animationen.`],
]
let round = 0, last = []
while (round < 3) {
  round++
  const found = await parallel(TESTERS.map(([k, port, task]) => () => agent(`${CTX}
AUFGABE: Tester „${k}“ (Runde ${round}) für das umgebaute Lebensweg. Port ${port}.
Bauplan-Testhinweise: ${spec.testPlan}
${task}
Ändere KEINE Spieldateien – du meldest nur Befunde (strukturiert), die danach gesammelt behoben werden. Melde nur echte, nachvollziehbare
Probleme mit genauer Reproduktion; Schweregrad ehrlich (blocker = Spiel hängt/stürzt/kaputt, major = deutlich störend, minor = Kleinigkeit).
${round > 1 ? `In der Vorrunde behoben wurden: ${last.map(f => f.title).join('; ').slice(0, 1500)} – prüfe gezielt, ob das wirklich behoben ist.` : ''}`,
    { label: `test${round}:${k}`, phase: 'Testen', schema: FIND_SCHEMA })))
  if (found.some(r => !r)) throw new Error('Tester abgebrochen – später fortsetzen')
  const all = found.filter(Boolean).flatMap(r => r.findings || [])
  const important = all.filter(f => f.severity !== 'minor')
  log(`Testrunde ${round}: ${all.length} Befunde (${important.length} wichtig)`)
  if (!all.length) break
  if (!important.length && round > 1) { log('Nur noch Kleinigkeiten – letzte Behebungsrunde'); }
  const fixed = await agent(`${CTX}
AUFGABE: Behebe die folgenden Testbefunde in lebensweg.html/lebensweg.js (und falls nötig in den Inhaltsdateien spiele/lebensweg-*.js).
Zuerst alle blocker, dann major, dann minor. Prüfe jeden Befund zuerst selbst nach (Port 8850) – ist er nicht reproduzierbar, überspringen und
das begründen. Danach: mindestens 5 KI-Partien im Schnellmodus (localStorage 'lebensweg_test'={"fast":true}) bis zum Ende ohne Fehler,
plus Screenshots von Spiel und Siegerehrung ansehen.
Messwerte der Tester: ${found.filter(Boolean).map(r => r.stats).join(' | ').slice(0, 2000)}
BEFUNDE:
${all.map((f, i) => `${i + 1}. [${f.severity}] ${f.title}\n   Repro: ${f.repro}\n   Vorschlag: ${f.fix}`).join('\n').slice(0, 14000)}
Antworte mit: behoben / nicht reproduzierbar / bewusst gelassen (mit Grund) je Befund.`, { label: `fix${round}`, phase: 'Testen' })
  if (!fixed) throw new Error('Behebung abgebrochen – später fortsetzen')
  last = all
  if (!important.length) break
}

return { overview: spec.overview, packages: spec.contentPackages.map(p => p.key), content, engine, visual, rounds: round }