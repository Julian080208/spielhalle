export const meta = {
  name: 'spiel-ausbau',
  description: 'Ein Spiel der Spielhalle gründlich verbessern und mit Inhalten erweitern – planen, Inhalte schreiben, einbauen, durchtesten',
  whenToUse: 'args: {id, title, prefix, globalPrefix, files, about, wish, angles, contentHint, engineHints, visualMust, testers, portBase}',
  phases: [
    { title: 'Planen', detail: '3 unabhängige Entwürfe + Zusammenführung zu einem Bauplan' },
    { title: 'Inhalte', detail: 'Inhaltspakete als eigene Dateien schreiben und prüfen' },
    { title: 'Einbauen', detail: 'Spielwerk, dann Optik – nacheinander' },
    { title: 'Testen', detail: 'Tester finden parallel, einer behebt – bis es sauber ist' },
  ],
}

const A = args || {}
if (!A.id || !A.files || !A.angles || !A.testers) throw new Error('args unvollständig')
const ROOT = '/home/user/spielhalle'
const SCRATCH = `/tmp/claude-0/-home-user-spielhalle/7f8f18bd-815b-5dd0-91fa-e90ebfc9d13f/scratchpad/${A.id}`
const P = A.portBase || 8900

const CTX = `
PROJEKT: "Spielhalle" – Spiele-App für einen Partyraum. Windows-PC am Fernseher, 2–6 Leute auf dem Sofa, eine Maus/Tastatur.
Die App zeigt Spiele in einem eigenen Fenster (WebView2/Chromium) unter http://localhost:8777/spiele/…. Alles auf Deutsch (du-Form),
Regeln in ${ROOT}/CLAUDE.md. Gemeinsame Bibliothek: ${ROOT}/spiele/shared/hub.js (Hub.party.active(), Hub.dialog, Hub.toast, Hub.sfx,
Hub.tone, Hub.achieve, Hub.read/write, Hub.bar, Hub.chips für Casino-Spielgeld) und hub.css.
DAS SPIEL: "${A.title}" – Dateien: ${A.files}
${A.about}
WUNSCH DES BESITZERS: ${A.wish}
Familien- und freundestauglich (kein Alkohol/Drogen/Sex, nichts Verletzendes; Casino nur mit Spielgeld). Keine externen Ressourcen.

TESTEN IM BROWSER: python3 -m http.server <PORT> --directory ${ROOT} (im Hintergrund, danach beenden);
Playwright: const { chromium } = require('/opt/node22/lib/node_modules/playwright'); chromium.launch() geht direkt (KEIN playwright install).
Screenshots speichern und mit dem Read-Werkzeug ANSEHEN. Fehler über page.on('pageerror') und console-Fehler sammeln.
Hilfsdateien nur unter ${SCRATCH}/. Keine git-Befehle.
`

// ------------------------------------------------------------------ 1) Planen
phase('Planen')
const proposals = await parallel(A.angles.map(([k, focus], i) => () => agent(`${CTX}
AUFGABE: Lies alle Dateien des Spiels VOLLSTÄNDIG und spiele es kurz im Browser an (Port ${P + i}). Erstelle einen konkreten,
umsetzbaren Verbesserungsplan mit Fokus:
${focus}
Sei konkret (Mengen, Datenfelder, Beispiele, betroffene Funktionen). Nenne Risiken. Gut gegliederter Text, max. ~1500 Wörter.`,
  { label: `plan:${k}`, phase: 'Planen' })))
if (proposals.filter(Boolean).length < A.angles.length) throw new Error('Planer abgebrochen (vermutlich Nutzungslimit) – später fortsetzen')

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string', description: 'Zusammenfassung des Gesamtplans' },
    contentPackages: {
      type: 'array',
      description: '3–7 unabhängige Pakete; jedes wird von einer eigenen Person als EIGENE NEUE Datei geschrieben (Pfad in "file")',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'kurz, Kleinbuchstaben' },
          file: { type: 'string', description: `Pfad relativ zum Repo, z. B. spiele/${A.prefix}-<key>.js (Daten, genau eine globale Variable) oder eine neue Spielseite spiele/<name>.html` },
          globalName: { type: 'string', description: `bei Datendateien die globale Variable, z. B. ${A.globalPrefix}EREIGNISSE; bei Spielseiten leer` },
          what: { type: 'string' },
          minCount: { type: 'string' },
          schema: { type: 'string', description: 'GENAUES Format mit allen Feldern, erlaubten Werten und 2 vollständigen Beispielen (bei Spielseiten: genaue Vorgaben/Konfiguration)' },
          balance: { type: 'string' },
        },
        required: ['key', 'file', 'globalName', 'what', 'minCount', 'schema', 'balance'],
      },
    },
    enginePlan: { type: 'string', description: 'Schritt-für-Schritt-Plan für Spielwerk/Mechanik inkl. Einbinden der Pakete, KI, Speicherschlüssel, Test-Schnellmodus' },
    visualPlan: { type: 'string', description: 'Plan für Optik/Partygefühl/TV-Lesbarkeit/Animationen/Siegerehrung' },
    testPlan: { type: 'string', description: 'Was die Tester prüfen sollen' },
  },
  required: ['overview', 'contentPackages', 'enginePlan', 'visualPlan', 'testPlan'],
}
const spec = await agent(`${CTX}
AUFGABE: Drei Planer haben unabhängig Verbesserungen vorgeschlagen. Lies die Vorschläge und das Spiel selbst und erstelle EINEN
verbindlichen Bauplan. Übernimm die besten Ideen, streiche Überladenes, halte die Spieldauer partytauglich.
Arbeitsteilung: Inhalte werden in 3–7 Paketen PARALLEL von verschiedenen Leuten als jeweils EIGENE NEUE Datei geschrieben – daher
braucht jedes Paket ein exaktes Format und einen eigenen Dateipfad (niemals zwei Pakete in derselben Datei, niemals bestehende Dateien).
Hinweise zu Inhalten: ${A.contentHint}
Das Spielwerk wird danach von EINER Person umgebaut, dann die Optik von EINER Person.
Vorgaben fürs Spielwerk: ${A.engineHints}

VORSCHLAG 1 (${A.angles[0][0]}):
${proposals[0]}

VORSCHLAG 2 (${A.angles[1][0]}):
${proposals[1]}

VORSCHLAG 3 (${A.angles[2][0]}):
${proposals[2]}`, { label: 'plan:zusammenfuehren', phase: 'Planen', schema: SPEC_SCHEMA })
if (!spec) throw new Error('Kein Bauplan – später fortsetzen')
log(`Bauplan: ${spec.contentPackages.length} Pakete: ${spec.contentPackages.map(p => p.key).join(', ')}`)

// ------------------------------------------------------------------ 2) Inhalte
const content = await pipeline(
  spec.contentPackages,
  (pk) => agent(`${CTX}
GESAMTPLAN: ${spec.overview}

DEINE AUFGABE: Schreibe das Paket "${pk.key}" als NEUE Datei ${ROOT}/${pk.file} – und NUR diese Datei.
${pk.globalName ? `Die Datei setzt genau eine globale Variable: window.${pk.globalName} = …; (reine Daten, keine Logik, UTF-8, gut lesbar).` : 'Es ist eine eigenständige Spielseite; halte dich exakt an die Vorgaben und an das Gerüst bestehender Seiten.'}
INHALT: ${pk.what}
MINDESTMENGEN: ${pk.minCount}
FORMAT: ${pk.schema}
BALANCE: ${pk.balance}
Übernimm passende bestehende Inhalte aus dem Spiel und erweitere stark. Abwechslungsreich, lebensnah, deutsch, familientauglich, keine Doppelungen.
Prüfe am Ende maschinell (node bzw. Browser), dass die Datei fehlerfrei lädt und die Mengen stimmen. Antworte mit den gezählten Mengen.`,
    { label: `inhalt:${pk.key}`, phase: 'Inhalte' }),
  (written, pk) => { if (!written) throw new Error('Schreiben abgebrochen'); return agent(`${CTX}
AUFGABE: Strenge Prüfung des Pakets ${ROOT}/${pk.file}${pk.globalName ? ` (globale Variable ${pk.globalName})` : ''}.
Der Autor meldet: ${String(written).slice(0, 1200)}
Soll-Format: ${pk.schema}
Mindestmengen: ${pk.minCount}
Balance: ${pk.balance}
Gehe JEDEN Eintrag einzeln durch und BEHEBE direkt in der Datei (nur diese Datei): Format exakt (prüfe per Skript unter ${SCRATCH}/),
Deutsch fehlerfrei, familientauglich, keine (Fast-)Doppelungen, Balance plausibel, Mindestmengen erfüllt.
Antworte mit: gezählte Mengen, Anzahl korrigierter/ersetzter Einträge, Ergebnis des Prüfskripts.`, { label: `pruefen:${pk.key}`, phase: 'Inhalte' }) },
)
if (content.some(c => !c)) throw new Error('Paket abgebrochen (vermutlich Nutzungslimit) – später fortsetzen')

// ------------------------------------------------------------------ 3) Einbauen
phase('Einbauen')
const PKG_LIST = spec.contentPackages.map(p => `- ${p.file}${p.globalName ? ` → window.${p.globalName}` : ''}: ${p.what}\n  Format: ${p.schema}`).join('\n')
const engine = await agent(`${CTX}
AUFGABE (Spielwerk): Baue das Spiel nach diesem Plan um (Dateien: ${A.files}). Die neuen Pakete liegen fertig vor und müssen eingebunden werden:
${PKG_LIST}
SPIELWERK-PLAN:
${spec.enginePlan}
Vorgaben: ${A.engineHints}
Nichts darf hängen bleiben; die KI muss alle neuen Entscheidungen treffen können. Teste selbst (Port ${P + 10}) gründlich – mehrere komplette
Partien bzw. Durchläufe ohne Konsolenfehler, Screenshots ansehen. Antworte mit Änderungen und Testergebnissen.`, { label: 'einbau:spielwerk', phase: 'Einbauen' })
if (!engine) throw new Error('Spielwerk-Umbau abgebrochen – später fortsetzen')

const visual = await agent(`${CTX}
AUFGABE (Optik & Partygefühl): Das Spielwerk wurde gerade umgebaut. Bericht: ${String(engine).slice(0, 3000)}
Setze diesen Optik-Plan um:
${spec.visualPlan}
Pflicht: ${A.visualMust}
Nichts an der Logik kaputt machen. Teste (Port ${P + 11}) mit Screenshots bei 1280×720 und 1920×1080 und im Fernseher-Modus (localStorage
hub_party_v1 mit tv:true, tvScale:1.3) – SIEH SIE DIR AN. Mindestens ein kompletter Durchlauf ohne Konsolenfehler. Antworte mit Änderungen und Tests.`,
  { label: 'einbau:optik', phase: 'Einbauen' })
if (!visual) throw new Error('Optik-Umbau abgebrochen – später fortsetzen')

// ------------------------------------------------------------------ 4) Testen
const FIND_SCHEMA = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, title: { type: 'string' },
      repro: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'title', 'repro', 'fix'] } },
    stats: { type: 'string' },
  },
  required: ['findings', 'stats'],
}
let round = 0, last = []
while (round < 3) {
  round++
  const found = await parallel(A.testers.map(([k, task], i) => () => agent(`${CTX}
AUFGABE: Tester „${k}“ (Runde ${round}). Port ${P + 20 + i}.
Testhinweise aus dem Bauplan: ${spec.testPlan}
${task}
Ändere KEINE Dateien – melde nur echte, nachvollziehbare Probleme mit genauer Reproduktion; Schweregrad ehrlich
(blocker = hängt/stürzt/kaputt, major = deutlich störend, minor = Kleinigkeit).
${round > 1 ? `In der Vorrunde behoben: ${last.map(f => f.title).join('; ').slice(0, 1500)} – prüfe gezielt, ob das wirklich behoben ist.` : ''}`,
    { label: `test${round}:${k}`, phase: 'Testen', schema: FIND_SCHEMA })))
  if (found.some(r => !r)) throw new Error('Tester abgebrochen – später fortsetzen')
  const all = found.flatMap(r => r.findings || [])
  const important = all.filter(f => f.severity !== 'minor')
  log(`Testrunde ${round}: ${all.length} Befunde (${important.length} wichtig)`)
  if (!all.length) break
  const fixed = await agent(`${CTX}
AUFGABE: Behebe die Testbefunde (Dateien: ${A.files} und die Pakete ${spec.contentPackages.map(p => p.file).join(', ')}).
Erst blocker, dann major, dann minor. Prüfe jeden Befund zuerst selbst nach (Port ${P + 30}); nicht reproduzierbar → überspringen und begründen.
Danach gründlicher Testlauf ohne Konsolenfehler, Screenshots ansehen.
Messwerte der Tester: ${found.map(r => r.stats).join(' | ').slice(0, 2000)}
BEFUNDE:
${all.map((f, i) => `${i + 1}. [${f.severity}] ${f.title}\n   Repro: ${f.repro}\n   Vorschlag: ${f.fix}`).join('\n').slice(0, 14000)}
Antworte je Befund mit: behoben / nicht reproduzierbar / bewusst gelassen (Grund).`, { label: `fix${round}`, phase: 'Testen' })
  if (!fixed) throw new Error('Behebung abgebrochen – später fortsetzen')
  last = all
  if (!important.length) break
}

return { overview: spec.overview, packages: spec.contentPackages.map(p => p.file), engine, visual, rounds: round }
