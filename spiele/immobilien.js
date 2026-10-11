/* =====================================================================
   Immobilienkönig 2 – 3D-Brett, drei Editionen, bis zu 6 Spieler,
   Versteigerungen, Handel, KI in drei Stärken, Hausregeln, Statistik
   ===================================================================== */
(function(){
'use strict';
Hub.init('immo');
const bar = Hub.bar({id:'immo', title:'Immobilienkönig', stats:[['round', 'Runde'], ['cash', 'Dein Geld'], ['worth', 'Vermögen']], actions:['help', 'sound', 'full']});
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);

// =====================================================================
//  DATEN
// =====================================================================
const R6 = (...a) => a;
// Grundlayout (Typ, Gruppe, Preis, Mieten, Hauspreis)
const BASE = [
  {t:'go'}, {t:'st', g:0, p:60, r:R6(2, 10, 30, 90, 160, 250), h:50}, {t:'cc'}, {t:'st', g:0, p:60, r:R6(4, 20, 60, 180, 320, 450), h:50}, {t:'tax', a:200},
  {t:'rr', p:200}, {t:'st', g:1, p:100, r:R6(6, 30, 90, 270, 400, 550), h:50}, {t:'ch'}, {t:'st', g:1, p:100, r:R6(6, 30, 90, 270, 400, 550), h:50}, {t:'st', g:1, p:120, r:R6(8, 40, 100, 300, 450, 600), h:50},
  {t:'jail'}, {t:'st', g:2, p:140, r:R6(10, 50, 150, 450, 625, 750), h:100}, {t:'ut', p:150}, {t:'st', g:2, p:140, r:R6(10, 50, 150, 450, 625, 750), h:100}, {t:'st', g:2, p:160, r:R6(12, 60, 180, 500, 700, 900), h:100},
  {t:'rr', p:200}, {t:'st', g:3, p:180, r:R6(14, 70, 200, 550, 750, 950), h:100}, {t:'cc'}, {t:'st', g:3, p:180, r:R6(14, 70, 200, 550, 750, 950), h:100}, {t:'st', g:3, p:200, r:R6(16, 80, 220, 600, 800, 1000), h:100},
  {t:'park'}, {t:'st', g:4, p:220, r:R6(18, 90, 250, 700, 875, 1050), h:150}, {t:'ch'}, {t:'st', g:4, p:220, r:R6(18, 90, 250, 700, 875, 1050), h:150}, {t:'st', g:4, p:240, r:R6(20, 100, 300, 750, 925, 1100), h:150},
  {t:'rr', p:200}, {t:'st', g:5, p:260, r:R6(22, 110, 330, 800, 975, 1150), h:150}, {t:'st', g:5, p:260, r:R6(22, 110, 330, 800, 975, 1150), h:150}, {t:'ut', p:150}, {t:'st', g:5, p:280, r:R6(24, 120, 360, 850, 1025, 1200), h:150},
  {t:'gojail'}, {t:'st', g:6, p:300, r:R6(26, 130, 390, 900, 1100, 1275), h:200}, {t:'st', g:6, p:300, r:R6(26, 130, 390, 900, 1100, 1275), h:200}, {t:'cc'}, {t:'st', g:6, p:320, r:R6(28, 150, 450, 1000, 1200, 1400), h:200},
  {t:'rr', p:200}, {t:'ch'}, {t:'st', g:7, p:350, r:R6(35, 175, 500, 1100, 1300, 1500), h:200}, {t:'tax', a:100}, {t:'st', g:7, p:400, r:R6(50, 200, 600, 1400, 1700, 2000), h:200},
];
const EDITIONS = {
  klassik:{title:'Klassik', sub:'Gemütliche Kleinstadt mit Gassen, Plätzen und Alleen', cur:'T', curName:'Taler', logo:['IMMOBILIEN', 'KÖNIG'],
    colors:['#8a4a2a', '#7fd0ff', '#e0559a', '#ff9a2e', '#e8343a', '#ffd23f', '#2fbf71', '#2f5fd1'],
    streets:['Gartenweg', 'Mühlenstraße', 'Kastanienallee', 'Brunnengasse', 'Lindenplatz', 'Rosenstraße', 'Hafenkai', 'Marktplatz', 'Bergstraße', 'Uferweg', 'Schillerplatz', 'Domstraße', 'Rathausgasse', 'Opernring', 'Sonnenhof', 'Theaterplatz', 'Museumsufer', 'Seepromenade', 'Villenviertel', 'Sternwarte', 'Kaiserhöhe', 'Diamantallee'],
    rr:['Südbahnhof', 'Westbahnhof', 'Nordbahnhof', 'Ostbahnhof'], rrIc:'🚂', ut:['Elektrizitätswerk', 'Wasserwerk'], utIc:['💡', '🚰'], tax:['Einkommensteuer', 'Luxussteuer'], taxIc:['💸', '💎'],
    corners:['LOS', 'GEFÄNGNIS', 'FREI PARKEN', 'AB INS GEFÄNGNIS'], ch:'Ereignis', cc:'Gemeinschaft',
    theme:{room1:'#24364a', room2:'#070b12', bd:'#d9ecd9', fd1:'#f3faf2', fd2:'#e1eee1', rim:'#16242e', lc:'#c4202f', cbg:'radial-gradient(circle at 50% 40%,#eef8ee,#cde5cd)'}},
  deutschland:{title:'Deutschland', sub:'Von der Küste bis zu den Alpen – 22 deutsche Städte', cur:'€', curName:'Euro', logo:['DEUTSCHLAND', 'EDITION'],
    colors:['#7a4a2a', '#8fd6ff', '#d84a8a', '#ff8a1f', '#d4202f', '#f2c600', '#1f8a4a', '#1f3fa8'],
    streets:['Cottbus', 'Gera', 'Rostock', 'Kiel', 'Lübeck', 'Kassel', 'Erfurt', 'Würzburg', 'Bremen', 'Hannover', 'Leipzig', 'Dresden', 'Nürnberg', 'Stuttgart', 'Köln', 'Frankfurt', 'Düsseldorf', 'Hamburg', 'Heidelberg', 'Berlin', 'München', 'Sylt'],
    rr:['Flughafen BER', 'Flughafen FRA', 'Flughafen HAM', 'Flughafen MUC'], rrIc:'✈️', ut:['Windpark', 'Talsperre'], utIc:['🌬️', '💧'], tax:['Einkommensteuer', 'Solidarbeitrag'], taxIc:['💸', '🧾'],
    corners:['LOS', 'GEFÄNGNIS', 'FREI PARKEN', 'AB INS GEFÄNGNIS'], ch:'Ereignis', cc:'Gemeinschaft',
    theme:{room1:'#3a2a1a', room2:'#0a0806', bd:'#efe6cf', fd1:'#fffaf0', fd2:'#efe4c8', rim:'#1b1b1b', lc:'#1b1b1b', cbg:'radial-gradient(circle at 50% 40%,#fff8e6,#eadcb8)'}},
  welt:{title:'Weltreise', sub:'Rund um den Globus – von Kairo bis New York', cur:'$', curName:'Dollar', logo:['WELTREISE', 'IMMOBILIEN'],
    colors:['#9a6a3a', '#5fd6e8', '#ff6ab0', '#ffa82e', '#ff4a3a', '#ffe03f', '#3fd27a', '#4a5aff'],
    streets:['Kairo', 'Lima', 'Bangkok', 'Mexiko-Stadt', 'Istanbul', 'Rio de Janeiro', 'Kapstadt', 'Mumbai', 'Sydney', 'Toronto', 'Barcelona', 'Rom', 'Amsterdam', 'Wien', 'Paris', 'Dubai', 'Singapur', 'London', 'Tokio', 'Zürich', 'New York', 'Monaco'],
    rr:['Atlantik-Air', 'Pazifik-Linie', 'Orient-Express', 'Polar-Jet'], rrIc:'🛫', ut:['Solarfarm', 'Meerwasserwerk'], utIc:['☀️', '🌊'], tax:['Visagebühr', 'Kurtaxe'], taxIc:['🛂', '🏝️'],
    corners:['START', 'GEFÄNGNIS', 'RASTPLATZ', 'AB INS GEFÄNGNIS'], ch:'Abenteuer', cc:'Reisekasse',
    theme:{room1:'#103a5a', room2:'#03101c', bd:'#cfeaf6', fd1:'#f4fbff', fd2:'#dceef7', rim:'#0b2a40', lc:'#1f6fd1', cbg:'radial-gradient(circle at 50% 40%,#e8f7ff,#bfe2f2)'}},
};
const TOKENS = [['🎩', 'Zylinder'], ['🚗', 'Auto'], ['🐕', 'Hund'], ['⛵', 'Schiff'], ['🐈', 'Katze'], ['🦖', 'Dino'], ['🚀', 'Rakete'], ['🦆', 'Ente']];
const PCOLORS = Hub.party.COLORS.slice();
const AINAMES = ['Baronin Berta', 'Investor Ingo', 'Maklerin Maja', 'Graf Gustav', 'Tycoon Tina', 'Spekulant Sepp', 'Lady Lilo', 'Onkel Otto'];
let ED = EDITIONS.klassik, F = [];
function buildFields(){
  let s = 0, rr = 0, ut = 0, tx = 0;
  F = BASE.map((b, i) => {
    const f = {...b, i};
    if (b.t === 'st'){ f.n = ED.streets[s++]; f.c = ED.colors[b.g]; }
    if (b.t === 'rr'){ f.n = ED.rr[rr++]; f.ic = ED.rrIc; }
    if (b.t === 'ut'){ f.n = ED.ut[ut]; f.ic = ED.utIc[ut++]; }
    if (b.t === 'tax'){ f.n = ED.tax[tx]; f.ic = ED.taxIc[tx++]; }
    if (b.t === 'ch'){ f.n = ED.ch; f.ic = '❓'; }
    if (b.t === 'cc'){ f.n = ED.cc; f.ic = '🎁'; }
    if (b.t === 'go'){ f.n = ED.corners[0]; f.ic = '⬅️'; }
    if (b.t === 'jail'){ f.n = ED.corners[1]; f.ic = '🚔'; }
    if (b.t === 'park'){ f.n = ED.corners[2]; f.ic = '🅿️'; }
    if (b.t === 'gojail'){ f.n = ED.corners[3]; f.ic = '👮'; }
    return f;
  });
}
const SUF = ['promenade', 'bahnhof', 'viertel', 'steuer', 'schaft', 'beitrag', 'straße', 'allee', 'gasse', 'platz', 'warte', 'werk', 'höhe', 'ufer', 'ring', 'dorf', 'berg', 'burg', 'hof', 'kai', 'weg', 'see', 'park', 'linie', 'sperre', 'gebühr', 'taxe', 'farm'];
function hyph(n){ return esc(n).split(' ').map(w => { if (w.length < 9) return w; const lw = w.toLowerCase(); for (const sf of SUF){ const k = lw.lastIndexOf(sf); if (k > 2 && k + sf.length === lw.length) return w.slice(0, k) + '&shy;' + w.slice(k); } return w.slice(0, Math.ceil(w.length / 2)) + '&shy;' + w.slice(Math.ceil(w.length / 2)); }).join(' '); }
const money = n => `${Hub.fmt(n)} ${ED.cur}`;

// ---------- Ereigniskarten ----------
const CH_CARDS = [
  {e:'🏁', t:'Rücke vor bis LOS.', a:{to:0}}, {e:'🏛️', t:'Rücke vor bis {24}.', a:{to:24}}, {e:'🌹', t:'Rücke vor bis {11}.', a:{to:11}},
  {e:'💎', t:'Rücke vor bis {39}.', a:{to:39}}, {e:'🚉', t:'Rücke vor zum nächsten {rr}. Ist er besetzt, zahlst du die doppelte Miete.', a:{next:'rr', dbl:true}},
  {e:'🔌', t:'Rücke vor zum nächsten Werk. Ist es besetzt, zahlst du das Zehnfache der Augen.', a:{next:'ut'}},
  {e:'📈', t:'Die Bank zahlt dir eine Dividende von 50.', a:{gain:50}}, {e:'🗝️', t:'Du kommst aus dem Gefängnis frei! Behalte diese Karte.', a:{free:'ch'}},
  {e:'↩️', t:'Gehe 3 Felder zurück.', a:{back:3}}, {e:'🚨', t:'Gehe direkt ins Gefängnis. Gehe nicht über LOS.', a:{jail:true}},
  {e:'🔧', t:'Renovierung: Zahle 25 pro Haus und 100 pro Hotel.', a:{repair:[25, 100]}}, {e:'🅿️', t:'Strafzettel wegen Falschparkens: Zahle 15.', a:{pay:15}},
  {e:'🚂', t:'Mach einen Ausflug zum {5}.', a:{to:5}}, {e:'🏆', t:'Du wurdest zum Vereinsvorsitzenden gewählt. Zahle jedem Spieler 50.', a:{payEach:50}},
  {e:'🏦', t:'Dein Bausparvertrag wird fällig. Du erhältst 150.', a:{gain:150}}, {e:'🧩', t:'Du hast ein Kreuzworträtsel gewonnen: 100.', a:{gain:100}},
];
const CC_CARDS = [
  {e:'🏁', t:'Rücke vor bis LOS.', a:{to:0}}, {e:'🏦', t:'Bankirrtum zu deinen Gunsten. Ziehe 200 ein.', a:{gain:200}}, {e:'🩺', t:'Arztkosten. Zahle 50.', a:{pay:50}},
  {e:'📊', t:'Aus dem Verkauf von Aktien erhältst du 50.', a:{gain:50}}, {e:'🗝️', t:'Du kommst aus dem Gefängnis frei! Behalte diese Karte.', a:{free:'cc'}},
  {e:'🚨', t:'Gehe direkt ins Gefängnis. Gehe nicht über LOS.', a:{jail:true}}, {e:'🏖️', t:'Urlaubsgeld wird fällig. Du erhältst 100.', a:{gain:100}},
  {e:'🧾', t:'Steuerrückzahlung. Du erhältst 20.', a:{gain:20}}, {e:'🎂', t:'Du hast Geburtstag! Jeder Spieler schenkt dir 10.', a:{collectEach:10}},
  {e:'🛡️', t:'Deine Lebensversicherung wird fällig. Du erhältst 100.', a:{gain:100}}, {e:'🏥', t:'Krankenhausgebühren. Zahle 100.', a:{pay:100}},
  {e:'🎓', t:'Schulgeld. Zahle 50.', a:{pay:50}}, {e:'💼', t:'Beratungshonorar. Du erhältst 25.', a:{gain:25}},
  {e:'🚧', t:'Straßenreparatur: Zahle 40 pro Haus und 115 pro Hotel.', a:{repair:[40, 115]}}, {e:'👑', t:'Zweiter Platz im Schönheitswettbewerb: 10.', a:{gain:10}}, {e:'📜', t:'Du erbst 100.', a:{gain:100}},
];

// =====================================================================
//  ZUSTAND
// =====================================================================
const SET = Object.assign({tilt:true, cam:true, speed:1}, Hub.read('immo2_view', {}));
let S = null, gen = 0, U = 60;
const defaultsLobby = () => ({ed:'klassik', seats:[
  {on:true, type:'human', name:Hub.settings.name || 'Du', tok:0, col:0},
  {on:true, type:'normal', name:AINAMES[0], tok:1, col:1},
  {on:true, type:'normal', name:AINAMES[1], tok:2, col:2},
  {on:true, type:'normal', name:AINAMES[2], tok:3, col:3},
  {on:false, type:'normal', name:AINAMES[3], tok:4, col:4},
  {on:false, type:'normal', name:AINAMES[4], tok:5, col:5}],
  rules:{start:1500, end:0, auction:true, pot:false, dblGo:false, limit:true}});
let LB = Object.assign(defaultsLobby(), Hub.read('immo2_lobby', {}));
function partySeats(){
  const act = Hub.party.active().slice(0, 6);
  if (act.length < 2) return false;
  LB.seats = act.map(pp => ({on:true, type:'human', name:pp.name, tok:0, emoji:pp.avatar, col:pp.col}));
  while (LB.seats.length < 6) LB.seats.push({on:false, type:'normal', name:AINAMES[LB.seats.length], tok:LB.seats.length % 8, col:LB.seats.length});
  LB.party = true; Hub.write('immo2_lobby', LB); return true;
}
if (!Hub.read('immo2_lobby', null)) partySeats();
if (Hub.party.wantsParty('immo')) partySeats();

const alive = () => S.players.filter(p => !p.bk);
const owned = p => S.f.map((x, i) => i).filter(i => S.f[i].own === p.id);
const groupIdx = g => F.filter(f => f.t === 'st' && f.g === g).map(f => f.i);
const hasSet = (p, g) => groupIdx(g).every(i => S.f[i].own === p.id);
const isAI = p => p.type !== 'human';
const multiHuman = () => S && S.players.filter(q => !isAI(q)).length > 1;
const you = p => multiHuman() ? esc(p.name) : 'Du';               // Anrede: Name, wenn mehrere Menschen spielen
const youGen = (p, a, b) => multiHuman() ? `${esc(p.name)} ${b}` : a;
const humans = () => S.players.filter(p => !isAI(p) && !p.bk);
function worth(p){ return p.cash + owned(p).reduce((a, i) => a + (S.f[i].m ? F[i].p / 2 : F[i].p) + (S.f[i].h ? S.f[i].h * F[i].h / 2 : 0), 0); }
function rentOf(i, dice, mult = 1){
  const f = F[i], st = S.f[i]; if (st.own < 0 || st.m) return 0;
  const o = S.players[st.own];
  if (f.t === 'st') return (st.h ? f.r[st.h] : f.r[0] * (hasSet(o, f.g) ? 2 : 1)) * mult;
  if (f.t === 'rr'){ const n = F.filter(x => x.t === 'rr' && S.f[x.i].own === o.id).length; return 25 * 2 ** (n - 1) * mult; }
  if (f.t === 'ut'){ const n = F.filter(x => x.t === 'ut' && S.f[x.i].own === o.id).length; return dice * (mult > 1 || n === 2 ? 10 : 4); }
  return 0;
}

// =====================================================================
//  GRAFIK-BAUSTEINE
// =====================================================================
let gid = 0;
function shade(hex, k){ const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; };
function pawnSVG(col, emoji){
  const id = 'pg' + (++gid), d = shade(col, -.45), l = shade(col, .55);
  return `<svg viewBox="0 0 60 80"><defs><radialGradient id="${id}" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="${l}"/><stop offset=".35" stop-color="${col}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs>
    <ellipse cx="30" cy="73" rx="23" ry="7" fill="${d}"/><path d="M8 72 Q9 62 19 58 Q12 49 17 39 Q22 33 30 33 Q38 33 43 39 Q48 49 41 58 Q51 62 52 72 Z" fill="url(#${id})"/>
    <circle cx="30" cy="21" r="16" fill="url(#${id})"/><circle cx="30" cy="21" r="11.5" fill="rgba(255,255,255,.88)"/>
    <text x="30" y="27.5" text-anchor="middle" font-size="15" font-family="Segoe UI Emoji">${emoji}</text><ellipse cx="24" cy="12" rx="5" ry="3" fill="#fff" opacity=".55"/></svg>`;
}
const HOUSE_SVG = `<svg viewBox="0 0 30 32"><path d="M3 15 L15 3 L27 15 Z" fill="#126b30"/><path d="M15 3 L27 15 L25 15 L15 5Z" fill="#0b4a20"/><rect x="5" y="14" width="20" height="17" fill="#2fbf5a"/><rect x="5" y="14" width="20" height="3" fill="#1f9a44"/><rect x="12" y="21" width="6" height="10" fill="#0b4a20"/></svg>`;
const HOTEL_SVG = `<svg viewBox="0 0 60 42"><path d="M2 14 L30 2 L58 14 Z" fill="#8a0f1c"/><rect x="5" y="13" width="50" height="28" fill="#e8343a"/><rect x="5" y="13" width="50" height="3" fill="#b51d2a"/>${[0, 1, 2, 3, 4].map(k => `<rect x="${9 + k * 9.5}" y="19" width="5" height="6" fill="#ffe9a8"/>`).join('')}<rect x="26" y="30" width="8" height="11" fill="#5a0a12"/></svg>`;

// Mittel-Grafiken je Edition
function centerArt(){
  if (ED === EDITIONS.welt){
    let s = '<svg class="art" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid slice"><circle cx="450" cy="450" r="330" fill="#9fd6ef" opacity=".5"/>';
    s += '<path d="M200 330 q60 -60 140 -20 q40 30 20 80 q-30 40 -90 30 q-60 -20 -70 -90Z M430 260 q80 -30 130 30 q30 60 -20 90 q-60 20 -110 -30Z M520 470 q70 -10 110 50 q20 70 -60 90 q-70 -10 -50 -140Z M270 520 q50 0 60 60 q0 80 -50 100 q-40 -40 -10 -160Z" fill="#7cc79a" opacity=".55"/>';
    for (let k = 0; k < 12; k++) s += `<line x1="${120 + k * 60}" y1="120" x2="${120 + k * 60}" y2="780" stroke="#1f6fd1" stroke-opacity=".07"/>`;
    s += '<path d="M180 600 Q450 380 720 300" fill="none" stroke="#1f6fd1" stroke-width="4" stroke-dasharray="10 12" opacity=".4"/><text x="700" y="300" font-size="48" font-family="Segoe UI Emoji" opacity=".7">✈️</text></svg>';
    return s;
  }
  let s = '<svg class="art" viewBox="0 0 900 900" preserveAspectRatio="xMidYMid slice">';
  const rnd = (k => () => (k = (k * 16807) % 2147483647) / 2147483647)(ED === EDITIONS.deutschland ? 7 : 3);
  const col = ED === EDITIONS.deutschland ? ['#2a2a2a', '#5a4a3a', '#8a6a3a'] : ['#7aa88a', '#5a8a6e', '#9cc4a8'];
  for (let layer = 0; layer < 3; layer++){
    let x = 60; while (x < 840){ const w = 30 + rnd() * 50, h = 60 + rnd() * (180 - layer * 40); s += `<rect x="${x}" y="${690 - h - layer * 20}" width="${w}" height="${h + 200}" fill="${col[layer]}" opacity="${.18 + layer * .08}"/>`; x += w + 4; }
  }
  if (ED === EDITIONS.deutschland) s += '<rect x="120" y="720" width="660" height="10" fill="#1b1b1b" opacity=".5"/><rect x="120" y="730" width="660" height="10" fill="#d4202f" opacity=".5"/><rect x="120" y="740" width="660" height="10" fill="#f2c600" opacity=".6"/>';
  else s += '<path d="M60 720 Q300 690 450 710 T840 700 L840 900 L60 900Z" fill="#9cc4a8" opacity=".35"/>';
  return s + '</svg>';
}

// =====================================================================
//  BRETT-AUFBAU
// =====================================================================
const UNITS = 11.9;
function cell(i){
  if (i === 0) return [10, 10, 'corner']; if (i < 10) return [10, 10 - i, 'b']; if (i === 10) return [10, 0, 'corner']; if (i < 20) return [10 - (i - 10), 0, 'l'];
  if (i === 20) return [0, 0, 'corner']; if (i < 30) return [0, i - 20, 't']; if (i === 30) return [0, 10, 'corner']; return [i - 30, 10, 'r'];
}
const off = k => k === 0 ? 0 : k === 10 ? 10.45 : 1.45 + (k - 1);
const size = k => (k === 0 || k === 10) ? 1.45 : 1;
function fieldRect(i){ const [r, c] = cell(i); return {x:off(c), y:off(r), w:size(c), h:size(r)}; }   // in Einheiten
function fieldCenter(i){ const q = fieldRect(i); return [(q.x + q.w / 2) / UNITS * 100, (q.y + q.h / 2) / UNITS * 100]; }
function buildBoard(){
  const th = ED.theme, root = document.documentElement.style;
  Object.entries(th).forEach(([k, v]) => root.setProperty('--' + k, v));
  const b = $('board'); b.innerHTML = '';
  F.forEach(f => {
    const [r, c, side] = cell(f.i), d = document.createElement('div');
    d.className = 'fd ' + side; d.style.gridRow = r + 1; d.style.gridColumn = c + 1; d.id = 'fd' + f.i;
    if (side === 'corner') d.innerHTML = `<div class="tx"><span class="ic">${f.ic}</span><span class="nm">${f.n}</span></div>`;
    else d.innerHTML = (f.t === 'st' ? `<div class="cb" style="--c:${f.c}"></div>` : '') + `<div class="tx"><span class="nm">${hyph(f.n)}</span>${f.ic ? `<span class="ic">${f.ic}</span>` : '<span></span>'}<span class="pr">${f.p ? money(f.p) : f.a ? 'Zahle ' + money(f.a) : ''}</span></div>`;
    d.insertAdjacentHTML('beforeend', '<div class="mort"></div><div class="ownr"></div>');
    d.onclick = () => showDeed(f.i);
    b.appendChild(d);
  });
  const c = document.createElement('div'); c.className = 'center';
  c.innerHTML = centerArt() + `<div class="logo">${ED.logo[0]}<small>${ED.logo[1]}</small></div>
    <div class="deck ch"><span>❓</span>${ED.ch.toUpperCase()}</div><div class="deck cc"><span>🎁</span>${ED.cc.toUpperCase()}</div><div class="potbox" id="potbox"></div>`;
  b.appendChild(c);
  const L = $('layer'); L.innerHTML = `<div class="dice3d" id="dice">${cubeHTML('c1')}${cubeHTML('c2')}</div>`;
  layout();
}
function cubeHTML(id){
  const P = {1:[4], 2:[0, 8], 3:[0, 4, 8], 4:[0, 2, 6, 8], 5:[0, 2, 4, 6, 8], 6:[0, 2, 3, 5, 6, 8]};
  return `<div class="cube" id="${id}">${[1, 2, 3, 4, 5, 6].map(n => `<div class="face f${n} ${n === 1 ? 'red' : ''}">${Array.from({length:9}, (_, k) => `<i style="visibility:${P[n].includes(k) ? 'visible' : 'hidden'}"></i>`).join('')}</div>`).join('')}</div>`;
}
function layout(){
  const w = $('stageWrap'), aw = w.clientWidth, ah = w.clientHeight;
  const tilt = SET.tilt ? 30 : 0;
  const s = Math.floor(Math.min(aw * .96, ah * (SET.tilt ? 1.08 : .96)));
  U = s / UNITS;
  const b3 = $('board3d');
  b3.style.width = b3.style.height = s + 'px';
  $('board').style.width = $('board').style.height = s + 'px';
  b3.style.setProperty('--u', U + 'px'); b3.style.setProperty('--tilt', tilt + 'deg');
  document.documentElement.style.setProperty('--u', U + 'px');
  camera(S && S.camFocus != null ? S.camFocus : null, true);
  if (S) renderAll();
}
let camT = null;
function camera(i, instant){
  const b3 = $('board3d'), tilt = SET.tilt ? 30 : 0, s = U * UNITS;
  let z = 1, dx = 0, dy = 0;
  if (i != null && SET.cam){ const [x, y] = fieldCenter(i); dx = (x / 100 - .5) * s; dy = (y / 100 - .5) * s; z = 1.32; const mo = s / 2 * (1 - 1 / z) * 1.1; dx = Math.max(-mo, Math.min(mo, dx)); dy = Math.max(-mo, Math.min(mo, dy)); }
  if (instant) b3.style.transition = 'none';
  b3.style.transform = `rotateX(${tilt}deg) scale(${z}) translate3d(${-dx}px,${-dy * (SET.tilt ? 1.02 : 1)}px,0)`;
  if (instant){ void b3.offsetWidth; b3.style.transition = ''; }
  if (S) S.camFocus = i;
}
addEventListener('resize', () => layout());

// =====================================================================
//  DARSTELLUNG
// =====================================================================
function renderAll(){ renderFields(); renderTokens(); renderBuildings(); renderPlayers(); renderPot(); updBar(); }
function renderFields(){
  F.forEach(f => {
    const el = $('fd' + f.i); if (!el) return; const st = S.f[f.i];
    el.style.setProperty('--oc', st.own >= 0 ? S.players[st.own].col : 'transparent');
    el.classList.toggle('mo', !!st.m);
  });
}
function tokenPos(p){
  const [x, y] = fieldCenter(p.pos), here = alive().filter(q => q.pos === p.pos), k = here.indexOf(p), n = here.length;
  const sp = U * .34 / (U * UNITS) * 100, cols = Math.min(3, n), row = Math.floor(k / 3), col = k % 3;
  return [x + (col - (cols - 1) / 2) * sp, y + (row - (n > 3 ? .5 : 0)) * sp + 1.6];
}
function renderTokens(){
  const L = $('layer');
  S.players.forEach(p => {
    let t = $('tok' + p.id);
    if (p.bk){ if (t) t.remove(); return; }
    if (!t){ t = document.createElement('div'); t.className = 'tok'; t.id = 'tok' + p.id; t.innerHTML = pawnSVG(p.col, p.tok); L.appendChild(t); }
    const [x, y] = tokenPos(p); t.style.left = x + '%'; t.style.top = y + '%'; t.style.zIndex = Math.round(y * 10);
    t.style.setProperty('--pc', rgbOf(p.col)); t.classList.toggle('act', S.players[S.cur] === p && !S.over);
  });
}
function renderBuildings(fresh){
  const L = $('layer');
  L.querySelectorAll('.bld').forEach(e => { if (!fresh || +e.dataset.f !== fresh) e.remove(); });
  F.forEach(f => {
    const st = S.f[f.i]; if (f.t !== 'st' || !st.h) return;
    if (fresh === f.i) L.querySelectorAll(`.bld[data-f="${f.i}"]`).forEach(e => e.remove());
    const q = fieldRect(f.i), [, , side] = cell(f.i);
    const pts = [];
    const n = st.h === 5 ? 1 : st.h;
    for (let k = 0; k < n; k++){
      const t = n === 1 ? .5 : .14 + k * (.72 / (n - 1));
      let ux, uy;
      if (side === 'b'){ ux = q.x + t * q.w; uy = q.y + .2; }
      else if (side === 't'){ ux = q.x + t * q.w; uy = q.y + q.h - .02; }
      else if (side === 'l'){ ux = q.x + q.w - .11; uy = q.y + .2 + t * .78; }
      else { ux = q.x + .11; uy = q.y + .2 + t * .78; }
      pts.push([ux / UNITS * 100, uy / UNITS * 100]);
    }
    pts.forEach(([x, y]) => { const e = document.createElement('div'); e.className = 'bld' + (st.h === 5 ? ' hotel' : '') + (fresh === f.i ? ' new' : ''); e.dataset.f = f.i; e.innerHTML = st.h === 5 ? HOTEL_SVG : HOUSE_SVG; e.style.left = x + '%'; e.style.top = y + '%'; e.style.zIndex = Math.round(y * 10); L.appendChild(e); });
  });
}
function renderPlayers(){
  const mx = Math.max(1, ...S.players.map(worth));
  $('players').innerHTML = S.players.map(p => {
    const props = owned(p).sort((a, b) => (F[a].g ?? 9) - (F[b].g ?? 9) || a - b);
    return `<div class="pcard2 ${S.players[S.cur] === p && !S.over ? 'cur' : ''} ${p.bk ? 'bk' : ''}" id="pc${p.id}" style="--pc:${rgbOf(p.col)}">
      <div class="badges">${p.jail ? '🔒' : ''}${p.free.length ? '🗝️'.repeat(p.free.length) : ''}</div>
      <div class="row1"><div class="pawn">${pawnSVG(p.col, p.tok)}</div><div><div class="nm">${esc(p.name)}</div><div class="tag">${isAI(p) ? {easy:'KI · leicht', normal:'KI · normal', hard:'KI · schwer'}[p.type] : 'Mensch'}${p.bk ? ' · pleite' : ''}</div></div><div class="cash" data-cash="${p.id}">${money(p.cash)}</div></div>
      <div class="props">${props.map(i => `<i class="${S.f[i].m ? 'm' : ''}" title="${esc(F[i].n)}" style="background:${F[i].t === 'st' ? F[i].c : F[i].t === 'rr' ? '#3a3f4a' : '#8a8f9c'}"></i>`).join('')}</div>
      <div class="wbar"><b style="width:${worth(p) / mx * 100}%"></b></div></div>`;
  }).join('');
}
function renderPot(){ const pb = $('potbox'); if (!pb) return; pb.style.display = S.rules.pot ? 'block' : 'none'; pb.textContent = `🅿️ Topf: ${money(S.pot)}`; }
function updBar(){
  const me = S.players.find(p => !isAI(p)) || S.players[0];
  bar.set('round', S.rules.end ? `${Math.min(S.round, S.rules.end)}/${S.rules.end}` : S.round); bar.set('cash', money(me.cash)); bar.set('worth', money(worth(me)));
}
function log(html, p){
  S.log.unshift({h:html, c:p ? p.col : ''}); S.log.length = Math.min(S.log.length, 120);
  const d = document.createElement('div'); d.innerHTML = html; if (p) d.style.setProperty('--lc2', p.col);
  $('log').prepend(d); while ($('log').children.length > 120) $('log').lastChild.remove();
}
function floatAt(p, txt, col){
  const el = $('pc' + p.id) || $('tok' + p.id); if (!el) return;
  const r = el.getBoundingClientRect(), f = document.createElement('div'); f.className = 'float'; f.textContent = txt; f.style.color = col;
  f.style.left = (r.left + r.width * .7) + 'px'; f.style.top = (r.top + 10) + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1800);
}
function setTurnHead(p, sub){
  $('turnTitle').innerHTML = `<span class="pawn">${pawnSVG(p.col, p.tok)}</span>${esc(p.name)}`;
  $('turnSub').innerHTML = sub || '';
}
function turnBanner(p){
  return new Promise(res => {
    const b = document.createElement('div'); b.className = 'tbanner'; b.style.setProperty('--pc', p.col);
    b.innerHTML = `<div class="tb-in"><span class="tb-pawn">${pawnSVG(p.col, p.tok)}</span><div><small>Runde ${S.round}</small><b>${esc(p.name)}</b><span>ist dran!</span></div></div>`;
    document.body.appendChild(b); Hub.tone(523, .1, 'triangle', .05); Hub.tone(784, .14, 'triangle', .05, .1);
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 350); }, 1400);
  });
}
function highlight(i){ const el = $('fd' + i); if (!el) return; el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl'); }

// =====================================================================
//  DIALOG-HILFEN
// =====================================================================
function modal(title, html, {wide, center} = {}){
  const ov = document.createElement('div'); ov.className = 'h-overlay';
  ov.innerHTML = `<div class="h-dialog ${center ? 'center' : ''}" style="${wide ? 'width:min(760px,100%)' : ''}"><h2></h2><div class="h-dbody">${html}</div><div class="h-row"></div></div>`;
  ov.querySelector('h2').textContent = title;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
  return {el:ov, body:ov.querySelector('.h-dbody'), row:ov.querySelector('.h-row'), close(){ ov.classList.remove('on'); setTimeout(() => ov.remove(), 220); }};
}
function ask(title, html, buttons, opts){
  return new Promise(res => {
    const m = modal(title, html, opts);
    const key = e => { if (e.key === 'Enter'){ const pb = m.row.querySelector('.primary') || m.row.lastChild; if (pb){ e.preventDefault(); pb.click(); } } };
    buttons.forEach(([label, val, cls]) => { const b = document.createElement('button'); b.className = 'h-btn ' + (cls || ''); b.innerHTML = label; b.onclick = () => { removeEventListener('keydown', key); m.close(); res(val); }; m.row.appendChild(b); });
    setTimeout(() => addEventListener('keydown', key), 300);
  });
}
function deedHTML(i, hlRent){
  const f = F[i], st = S ? S.f[i] : null;
  if (!f.p) return '';
  let rows = '';
  if (f.t === 'st'){
    const lv = st ? st.h : -1, set = st && st.own >= 0 && hasSet(S.players[st.own], f.g);
    rows = `<tr class="${hlRent && lv === 0 && !set ? 'on' : ''}"><td>Miete</td><td>${money(f.r[0])}</td></tr><tr class="${hlRent && lv === 0 && set ? 'on' : ''}"><td>mit ganzer Farbgruppe</td><td>${money(f.r[0] * 2)}</td></tr>` +
      [1, 2, 3, 4].map(k => `<tr class="${hlRent && lv === k ? 'on' : ''}"><td>mit ${k} ${k > 1 ? 'Häusern' : 'Haus'}</td><td>${money(f.r[k])}</td></tr>`).join('') +
      `<tr class="${hlRent && lv === 5 ? 'on' : ''}"><td>mit Hotel</td><td>${money(f.r[5])}</td></tr>`;
    return `<div class="deed2"><div class="hd" style="--c:${f.c}"><small>BESITZURKUNDE</small><b>${esc(f.n)}</b></div><table>${rows}</table><div class="ft">Haus/Hotel je ${money(f.h)} · Hypothek ${money(f.p / 2)} · Kaufpreis ${money(f.p)}</div></div>`;
  }
  if (f.t === 'rr') rows = [1, 2, 3, 4].map(k => `<tr><td>${k} ${k > 1 ? 'Linien' : 'Linie'} im Besitz</td><td>${money(25 * 2 ** (k - 1))}</td></tr>`).join('');
  if (f.t === 'ut') rows = `<tr><td>1 Werk im Besitz</td><td>4 × Augen</td></tr><tr><td>beide Werke</td><td>10 × Augen</td></tr>`;
  return `<div class="deed2"><div class="hd" style="--c:#2a3240"><small>BESITZURKUNDE</small><b>${f.ic} ${esc(f.n)}</b></div><table>${rows}</table><div class="ft">Hypothek ${money(f.p / 2)} · Kaufpreis ${money(f.p)}</div></div>`;
}
function showDeed(i){
  if (!S) return;
  const f = F[i], st = S.f[i];
  let info = '';
  if (f.p){ info = st.own >= 0 ? `<p style="text-align:center">Besitzer: <b style="color:${S.players[st.own].col}">${esc(S.players[st.own].name)}</b>${st.m ? ' · <b>Hypothek</b>' : ''}${st.h ? ` · ${st.h === 5 ? 'Hotel' : st.h + ' ' + (st.h > 1 ? 'Häuser' : 'Haus')}` : ''}</p>` : '<p style="text-align:center">Noch zu haben.</p>'; }
  else info = `<p style="text-align:center;font-size:40px;margin:6px 0">${f.ic || ''}</p><p style="text-align:center">${f.t === 'tax' ? `Zahle ${money(f.a)}${S.rules.pot ? ' (in den Frei-Parken-Topf)' : ''}.` : f.t === 'ch' || f.t === 'cc' ? 'Ziehe eine Karte.' : f.t === 'go' ? `Wer über LOS zieht, erhält ${money(200)}${S.rules.dblGo ? ' – wer genau darauf landet, sogar das Doppelte' : ''}.` : f.t === 'park' ? (S.rules.pot ? `Hier wartet der Topf: ${money(S.pot)}.` : 'Ausruhen – nichts passiert.') : f.t === 'gojail' ? 'Direkt ins Gefängnis!' : 'Nur zu Besuch.'}</p>`;
  ask(f.n, deedHTML(i) + info, [['Schließen', 0, 'primary']]);
}
function showCard(kind, card){
  const mc = $('mcard'), c = kind === 'ch' ? '#e86a10' : '#1f6fd1';
  mc.style.setProperty('--c', c); $('mcT').textContent = (kind === 'ch' ? ED.ch : ED.cc).toUpperCase(); $('mcE').textContent = card.e; $('mcB').textContent = kind === 'ch' ? '❓' : '🎁';
  $('mcP').textContent = card.t.replace(/\{(\d+)\}/g, (_, n) => F[+n].n).replace('{rr}', ED.rrIc === '🚂' ? 'Bahnhof' : ED.rrIc === '✈️' ? 'Flughafen' : 'Reiseanbieter');
  mc.classList.add('on'); Hub.tone(700, .06, 'triangle', .04); Hub.tone(1050, .08, 'triangle', .04, .12);
  return mc;
}
const hideCard = () => $('mcard').classList.remove('on');

// =====================================================================
//  WÜRFEL
// =====================================================================
const FACE_ROT = {1:[0, 0], 6:[0, 180], 2:[0, -90], 5:[0, 90], 3:[-90, 0], 4:[90, 0]};
const diceRot = {c1:[0, 0, 0], c2:[0, 0, 0]};
async function rollDice(){
  const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
  [['c1', a], ['c2', b]].forEach(([id, v]) => {
    const el = $(id), cur = diceRot[id], [rx, ry] = FACE_ROT[v];
    const nx = rx + 360 * (Math.ceil(cur[0] / 360) + 2), ny = ry + 360 * (Math.ceil(cur[1] / 360) + 2), nz = cur[2] + 180 + Math.random() * 180;
    diceRot[id] = [nx, ny, nz];
    el.classList.add('roll'); el.style.transform = `translateZ(calc(var(--u) * .31)) rotateZ(${nz}deg) rotateX(${nx}deg) rotateY(${ny}deg)`;
  });
  for (let k = 0; k < 8; k++) Hub.tone(250 + Math.random() * 350, .025, 'square', .025, k * .09);
  await wait(1150 / Math.max(.6, spd()));
  return [a, b];
}
const spd = () => S && S.players[S.cur] && isAI(S.players[S.cur]) ? SET.speed : 1;
const pause = ms => wait(ms / spd());

// =====================================================================
//  GELD
// =====================================================================
function gain(p, a, why){
  if (a <= 0) return;
  p.cash += a; floatAt(p, '+' + money(a), '#7dffa8');
  if (why) log(`${p.tok} <b>${esc(p.name)}</b> erhält ${money(a)} – ${why}.`, p);
  if (!isAI(p)) Hub.tone(990, .08, 'triangle', .045);
  renderPlayers(); updBar();
}
async function pay(p, a, to, why){
  if (a <= 0 || p.bk) return true;
  if (p.cash < a){ const ok = await raiseFunds(p, a, to, why); if (!ok) return false; }
  p.cash -= a;
  if (to){ to.cash += a; floatAt(to, '+' + money(a), '#7dffa8'); to.st.rentIn += why && why.startsWith('Miete') ? a : 0; }
  else if (S.rules.pot && !(why || '').startsWith('Kauf') && !(why || '').startsWith('Bau')) { S.pot += a; renderPot(); }
  if (why && why.startsWith('Miete')) p.st.rentOut += a;
  floatAt(p, '−' + money(a), '#ff8a95');
  log(`${p.tok} <b>${esc(p.name)}</b> zahlt ${money(a)}${to ? ` an <b>${esc(to.name)}</b>` : ''}${why ? ` – ${why}` : ''}.`, p);
  if (!isAI(p)) Hub.tone(330, .1, 'triangle', .04);
  renderPlayers(); updBar(); return true;
}
function liquidValue(p){ return owned(p).reduce((a, i) => a + (S.f[i].m ? 0 : F[i].p / 2) + S.f[i].h * F[i].h / 2, 0); }
async function raiseFunds(p, need, to, why){
  if (p.cash + liquidValue(p) < need){
    if (!isAI(p)) await ask(`${p.name}: Pleite!`, `<p>${you(p)} ${multiHuman() ? 'muss' : 'musst'} ${money(need)} zahlen${why ? ` (${why})` : ''}, kannst aber selbst durch Verkäufe und Hypotheken höchstens ${money(p.cash + liquidValue(p))} aufbringen.</p>`, [['Bankrott erklären', 1, 'primary']]);
    await bankrupt(p, to); return false;
  }
  if (isAI(p)){ aiRaise(p, need); return p.cash >= need; }
  // Mensch: Verwaltungsdialog bis genug Geld da ist
  for (;;){
    if (p.cash >= need) return true;
    const r = await manageDialog(p, {need, why});
    if (r === 'bankrupt'){ await bankrupt(p, to); return false; }
  }
}
function aiRaise(p, need){
  let guard = 0;
  while (p.cash < need && guard++ < 200){
    // Häuser verkaufen (gleichmäßig, von teuersten Gruppen ohne Mehrwert zuerst)
    const sell = owned(p).filter(i => canSell(p, i)).sort((a, b) => F[a].h - F[b].h);
    if (sell.length){ sellHouse(p, sell[0], true); continue; }
    const mort = owned(p).filter(i => canMortgage(p, i)).sort((a, b) => aiKeepScore(p, a) - aiKeepScore(p, b));
    if (mort.length){ mortgage(p, mort[0], true); continue; }
    break;
  }
  renderAll();
}
async function bankrupt(p, to){
  p.bk = true; p.bkRound = S.round;
  log(`💥 <b>${esc(p.name)} ist pleite!</b>${to ? ` Alles geht an ${esc(to.name)}.` : ''}`, p);
  owned(p).forEach(i => {
    const st = S.f[i];
    if (st.h){ if (st.h === 5) S.hotels++; else S.houses += st.h; if (to) to.cash += st.h * F[i].h / 2; st.h = 0; }
    if (to) st.own = to.id; else { st.own = -1; st.m = false; }
  });
  if (to) to.cash += Math.max(0, p.cash); p.cash = 0;
  if (to && p.free.length){ to.free.push(...p.free); } else p.free.forEach(k => S[k === 'ch' ? 'chDeck' : 'ccDeck'].push(k === 'ch' ? 7 : 4)); p.free = [];
  Hub.sfx(isAI(p) ? 'ok' : 'bad');
  renderAll();
}

// =====================================================================
//  BAUEN & HYPOTHEKEN
// =====================================================================
function canBuild(p, i){
  const f = F[i], st = S.f[i]; if (f.t !== 'st' || st.own !== p.id || !hasSet(p, f.g) || st.h >= 5) return false;
  const gs = groupIdx(f.g); if (gs.some(k => S.f[k].m)) return false;
  if (st.h > Math.min(...gs.map(k => S.f[k].h))) return false;
  if (S.rules.limit){ if (st.h === 4 && S.hotels <= 0) return false; if (st.h < 4 && S.houses <= 0) return false; }
  return p.cash >= f.h;
}
function canSell(p, i){ const f = F[i], st = S.f[i]; if (f.t !== 'st' || st.own !== p.id || !st.h) return false; if (st.h === 5 && S.rules.limit && S.houses < 4) return false; return st.h === Math.max(...groupIdx(f.g).map(k => S.f[k].h)); }
function canMortgage(p, i){ const f = F[i], st = S.f[i]; if (st.own !== p.id || st.m) return false; if (f.t === 'st' && groupIdx(f.g).some(k => S.f[k].h)) return false; return true; }
const unmortCost = i => Math.ceil(F[i].p / 2 * 1.1);
function build(p, i, silent){
  const st = S.f[i]; p.cash -= F[i].h;
  if (st.h === 4){ S.hotels--; S.houses += 4; } else S.houses--;
  st.h++; p.st.built++;
  if (!silent) Hub.tone(520, .06, 'square', .03), Hub.tone(780, .08, 'square', .03, .06);
  log(`${p.tok} <b>${esc(p.name)}</b> baut ${st.h === 5 ? 'ein <b>Hotel</b>' : 'ein Haus'} in ${esc(F[i].n)}.`, p);
  if (!isAI(p)){ Hub.achieve('immo', 'house', 'Bauherr', 'Baue dein erstes Haus'); if (st.h === 5) Hub.achieve('immo', 'hotel', 'Hotelier', 'Baue ein Hotel'); }
  renderBuildings(i); renderPlayers(); updBar();
}
function sellHouse(p, i, silent){
  const st = S.f[i];
  if (st.h === 5){ S.hotels++; S.houses -= 4; } else S.houses++;
  st.h--; p.cash += F[i].h / 2;
  log(`${p.tok} <b>${esc(p.name)}</b> verkauft ${st.h === 4 ? 'das Hotel' : 'ein Haus'} in ${esc(F[i].n)} für ${money(F[i].h / 2)}.`, p);
  if (!silent) renderAll();
}
function mortgage(p, i, silent){ S.f[i].m = true; p.cash += F[i].p / 2; log(`${p.tok} <b>${esc(p.name)}</b> nimmt eine Hypothek auf ${esc(F[i].n)} auf (+${money(F[i].p / 2)}).`, p); if (!silent) renderAll(); }
function unmortgage(p, i){ const c = unmortCost(i); if (p.cash < c) return false; p.cash -= c; S.f[i].m = false; log(`${p.tok} <b>${esc(p.name)}</b> löst die Hypothek auf ${esc(F[i].n)} ab (−${money(c)}).`, p); renderAll(); return true; }

// Verwaltungsdialog (Bauen, Verkaufen, Hypotheken) – auch für Geldbeschaffung
function manageDialog(p, {need, why} = {}){
  return new Promise(res => {
    const m = modal(need ? `${p.name}: Geld beschaffen` : (multiHuman() ? `Grundstücke von ${p.name}` : 'Deine Grundstücke'), '', {wide:true});
    const draw = () => {
      const ids = owned(p).sort((a, b) => (F[a].g ?? 9) - (F[b].g ?? 9) || a - b);
      m.body.innerHTML = (need ? `<p>${you(p)} ${multiHuman() ? 'muss' : 'musst'} <b>${money(need)}</b> zahlen${why ? ` (${esc(why)})` : ''}. Du hast <b style="color:${p.cash >= need ? '#7dffa8' : '#ff8a95'}">${money(p.cash)}</b>. Verkaufe Häuser oder nimm Hypotheken auf.</p>`
          : `<p>Geld: <b>${money(p.cash)}</b>${S.rules.limit ? ` · Bank: ${S.houses} Häuser, ${S.hotels} Hotels übrig` : ''}. Gebaut wird gleichmäßig; Häuser brauchen eine komplette Farbgruppe ohne Hypothek.</p>`) +
        (ids.length ? `<div class="mgrid">${ids.map(i => { const f = F[i], st = S.f[i];
          return `<div class="mitem ${st.m ? 'mo' : ''}"><div class="h" style="--c:${f.t === 'st' ? f.c : '#3a3f4a'}"><span>${esc(f.n)}</span><span>${st.m ? '🏦' : st.h === 5 ? '🏨' : '🏠'.repeat(st.h)}</span></div><div class="b">
            ${f.t === 'st' ? `<div class="r"><button class="h-btn sm" data-a="build" data-i="${i}" ${canBuild(p, i) && !need ? '' : 'disabled'}>+ ${st.h === 4 ? 'Hotel' : 'Haus'} ${money(f.h)}</button><button class="h-btn sm" data-a="sell" data-i="${i}" ${canSell(p, i) ? '' : 'disabled'}>− ${money(f.h / 2)}</button></div>` : ''}
            <div class="r">${st.m ? `<button class="h-btn sm" data-a="unm" data-i="${i}" ${p.cash >= unmortCost(i) && !need ? '' : 'disabled'}>Ablösen ${money(unmortCost(i))}</button>` : `<button class="h-btn sm" data-a="mort" data-i="${i}" ${canMortgage(p, i) ? '' : 'disabled'}>Hypothek +${money(f.p / 2)}</button>`}</div></div></div>`; }).join('')}</div>` : '<p>Du besitzt noch keine Grundstücke.</p>');
      m.row.innerHTML = '';
      if (need){
        const bk = document.createElement('button'); bk.className = 'h-btn danger'; bk.textContent = 'Bankrott erklären'; bk.onclick = () => { m.close(); res('bankrupt'); }; m.row.appendChild(bk);
        const ok = document.createElement('button'); ok.className = 'h-btn primary'; ok.textContent = `Bezahlen (${money(need)})`; ok.disabled = p.cash < need; ok.onclick = () => { m.close(); res('ok'); }; m.row.appendChild(ok);
      } else { const ok = document.createElement('button'); ok.className = 'h-btn primary'; ok.textContent = 'Fertig'; ok.onclick = () => { m.close(); res('ok'); }; m.row.appendChild(ok); }
      m.body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const i = +b.dataset.i, a = b.dataset.a;
        if (a === 'build' && canBuild(p, i)) build(p, i);
        if (a === 'sell' && canSell(p, i)){ sellHouse(p, i); Hub.tone(400, .06, 'triangle', .03); }
        if (a === 'mort' && canMortgage(p, i)){ mortgage(p, i); Hub.tone(500, .06, 'triangle', .03); }
        if (a === 'unm') unmortgage(p, i);
        renderAll(); draw();
      });
    };
    draw();
  });
}

// =====================================================================
//  KI
// =====================================================================
function aiReserve(p){ const base = {easy:60, normal:150, hard:220}[p.type]; const threat = Math.max(0, ...S.players.filter(o => o !== p && !o.bk).flatMap(o => owned(o).map(i => rentOf(i, 7)))); return base + Math.min(400, threat * .4); }
function propValue(p, i){
  const f = F[i]; let v = f.p;
  if (f.t === 'st'){
    const others = groupIdx(f.g).filter(k => k !== i);
    const mine = others.filter(k => S.f[k].own === p.id).length;
    if (mine === others.length) v *= 3.2; else if (mine) v *= 1.7;
    const owners = new Set(others.map(k => S.f[k].own).filter(o => o >= 0 && o !== p.id));
    if (owners.size === 1 && others.every(k => S.f[k].own >= 0 && S.f[k].own !== p.id)) v *= 1.9; // blockt fremde Gruppe
  } else if (f.t === 'rr'){ const n = F.filter(x => x.t === 'rr' && S.f[x.i].own === p.id).length; v *= 1 + n * .35; }
  else if (f.t === 'ut'){ v *= F.some(x => x.t === 'ut' && S.f[x.i].own === p.id) ? 1.3 : .9; }
  if (S.f[i].m) v -= f.p * .55;
  return v;
}
function aiKeepScore(p, i){ const f = F[i]; return (f.t === 'st' && hasSet(p, f.g) ? 1000 : 0) + propValue(p, i); }
function aiWantsBuy(p, i){
  const f = F[i]; if (p.cash < f.p) return false;
  if (p.type === 'easy') return Math.random() < .75 && p.cash - f.p > 40;
  const v = propValue(p, i), res = aiReserve(p);
  if (v >= f.p * 1.6) return p.cash - f.p >= 20;
  return p.cash - f.p >= res * (S.round < 8 ? .5 : 1);
}
function aiMaxBid(p, i){ const mult = {easy:.75, normal:1, hard:1.15}[p.type]; return Math.max(0, Math.min(p.cash - aiReserve(p) * .4, propValue(p, i) * mult)); }
async function aiManage(p){
  // Hypotheken ablösen
  for (const i of owned(p).filter(i => S.f[i].m).sort((a, b) => aiKeepScore(p, b) - aiKeepScore(p, a))) if (p.cash - unmortCost(i) > aiReserve(p) + 150) unmortgage(p, i);
  // Bauen
  const cap = p.type === 'hard' ? 5 : p.type === 'normal' ? 5 : 3;
  for (let guard = 0; guard < 40; guard++){
    const opts = owned(p).filter(i => canBuild(p, i) && S.f[i].h < cap && p.cash - F[i].h >= aiReserve(p) * (p.type === 'hard' ? .55 : .8));
    if (!opts.length) break;
    // bevorzugt 3. Haus (bester Ertrag), dann günstige Gruppen
    opts.sort((a, b) => ((S.f[b].h === 2) - (S.f[a].h === 2)) || (F[b].r[S.f[b].h + 1] - F[b].r[S.f[b].h]) / F[b].h - (F[a].r[S.f[a].h + 1] - F[a].r[S.f[a].h]) / F[a].h);
    build(p, opts[0]); await pause(260);
  }
  // Handelsangebote
  if (p.type !== 'easy' && Math.random() < (p.type === 'hard' ? .45 : .25)) await aiProposeTrade(p);
}
async function aiProposeTrade(p){
  // Suche Gruppe, der genau ein Grundstück fehlt
  for (let g = 0; g < 8; g++){
    const gs = groupIdx(g), mine = gs.filter(k => S.f[k].own === p.id);
    if (mine.length !== gs.length - 1) continue;
    const miss = gs.find(k => S.f[k].own !== p.id), st = S.f[miss];
    if (st.own < 0 || S.f[miss].h || gs.some(k => S.f[k].h)) continue;
    const o = S.players[st.own]; if (o.bk) continue;
    const offer = Math.round(Math.min(p.cash - aiReserve(p) * .5, F[miss].p * (p.type === 'hard' ? 1.9 : 1.6)) / 10) * 10;
    if (offer < F[miss].p * 1.2) continue;
    const deal = {from:p, to:o, give:[], get:[miss], money:offer, ask:0};
    let ok;
    if (isAI(o)) ok = aiEvalTrade(o, deal) > 0;
    else ok = await ask(`Angebot von ${p.name}`, `<p style="text-align:center"><span style="display:inline-block;width:46px;height:58px">${pawnSVG(p.col, p.tok)}</span></p><p><b>${esc(p.name)}</b> möchte <b>${esc(F[miss].n)}</b> von dir kaufen und bietet <b style="color:#7dffa8">${money(offer)}</b>.</p>${deedHTML(miss)}<p style="font-size:13px;color:var(--text-2)">Achtung: Damit hätte ${esc(p.name)} die komplette Farbgruppe!</p>`,
      [['Ablehnen', false], ['Annehmen', true, 'primary']], {center:true});
    if (ok){ execTrade(deal); } else log(`🤝 <b>${esc(o.name)}</b> lehnt das Angebot von ${esc(p.name)} für ${esc(F[miss].n)} ab.`, p);
    return;
  }
}
// Bewertet einen Handel aus Sicht des KI-Spielers „ai“ (positiv = annehmen)
function aiEvalTrade(ai, d){
  const recv = d.from === ai ? d.get : d.give, lose = d.from === ai ? d.give : d.get;
  const cashIn = d.from === ai ? d.ask - d.money : d.money - d.ask;
  let v = cashIn;
  recv.forEach(i => v += propValue(ai, i));
  lose.forEach(i => { v -= propValue(ai, i); });
  // Gibt er dem Gegner eine komplette Gruppe?
  const other = d.from === ai ? d.to : d.from;
  const otherGets = d.from === ai ? d.give : d.get;
  otherGets.forEach(i => { if (F[i].t === 'st'){ const gs = groupIdx(F[i].g); if (gs.every(k => k === i || S.f[k].own === other.id || otherGets.includes(k))) v -= F[i].p * ({easy:.8, normal:1.6, hard:2.2}[ai.type]); } });
  const greed = {easy:-.05, normal:.08, hard:.15}[ai.type];
  return v - Math.abs(cashIn) * 0 - greed * (recv.concat(lose).reduce((a, i) => a + F[i].p, 0) + Math.abs(cashIn));
}
function execTrade(d){
  const {from, to} = d;
  d.give.forEach(i => S.f[i].own = to.id); d.get.forEach(i => S.f[i].own = from.id);
  from.cash += d.ask - d.money; to.cash += d.money - d.ask;
  const desc = side => side.length ? side.map(i => esc(F[i].n)).join(', ') : '';
  log(`🤝 <b>Handel:</b> ${esc(from.name)} ↔ ${esc(to.name)}${d.give.length ? ` · gibt ${desc(d.give)}` : ''}${d.get.length ? ` · erhält ${desc(d.get)}` : ''}${d.money ? ` · zahlt ${money(d.money)}` : ''}${d.ask ? ` · bekommt ${money(d.ask)}` : ''}`, from);
  Hub.sfx('ok');
  [from, to].forEach(p => { if (!isAI(p)){ Hub.achieve('immo', 'trade', 'Geschäftstüchtig', 'Schließe einen Handel ab'); if (F.some(f => f.t === 'st' && hasSet(p, f.g))) Hub.achieve('immo', 'set', 'Monopol!', 'Besitze eine komplette Farbgruppe'); } });
  renderAll();
}

// =====================================================================
//  HANDEL (Mensch)
// =====================================================================
function tradeDialog(p){
  const partners = alive().filter(o => o !== p);
  if (!partners.length) return Promise.resolve();
  return new Promise(res => {
    const m = modal('Handeln', '', {wide:true});
    let partner = partners[0];
    const tradable = q => owned(q).filter(i => !(F[i].t === 'st' && groupIdx(F[i].g).some(k => S.f[k].h)));
    const draw = () => {
      const mine = tradable(p), theirs = tradable(partner);
      m.body.innerHTML = `<div class="trade"><div class="col"><h4><span style="width:22px;height:28px;display:inline-block">${pawnSVG(p.col, p.tok)}</span>${multiHuman() ? esc(p.name) + ' gibt' : 'Du gibst'}</h4><div class="list">${mine.map(i => `<label><input type="checkbox" data-g="${i}"><i style="background:${F[i].c || '#556'}"></i>${esc(F[i].n)}${S.f[i].m ? ' (Hyp.)' : ''}</label>`).join('') || '<small>keine Grundstücke</small>'}</div>
        <p style="margin:8px 0 4px;font-size:13px">+ Geld (max. ${money(p.cash)})</p><input type="number" id="tm" min="0" max="${p.cash}" step="10" value="0"></div>
        <div class="col"><h4>Von <select id="tp">${partners.map(o => `<option value="${o.id}" ${o === partner ? 'selected' : ''}>${o.tok} ${esc(o.name)}</option>`).join('')}</select></h4><div class="list">${theirs.map(i => `<label><input type="checkbox" data-t="${i}"><i style="background:${F[i].c || '#556'}"></i>${esc(F[i].n)}${S.f[i].m ? ' (Hyp.)' : ''}</label>`).join('') || '<small>keine Grundstücke</small>'}</div>
        <p style="margin:8px 0 4px;font-size:13px">+ Geld (max. ${money(partner.cash)})</p><input type="number" id="ta" min="0" max="${partner.cash}" step="10" value="0"></div></div><div class="mood" id="mood"></div>`;
      const deal = () => ({from:p, to:partner, give:[...m.body.querySelectorAll('[data-g]:checked')].map(e => +e.dataset.g), get:[...m.body.querySelectorAll('[data-t]:checked')].map(e => +e.dataset.t),
        money:Math.max(0, Math.min(p.cash, Math.floor(+$('tm').value || 0))), ask:Math.max(0, Math.min(partner.cash, Math.floor(+$('ta').value || 0)))});
      const mood = () => {
        const d = deal(); if (!d.give.length && !d.get.length && !d.money && !d.ask){ $('mood').textContent = 'Wähle aus, was getauscht werden soll.'; return; }
        if (!isAI(partner)){ $('mood').textContent = `${partner.name} entscheidet selbst.`; return; }
        const v = aiEvalTrade(partner, d);
        $('mood').innerHTML = v > 0 ? '😀 <b>Interessant!</b> Das könnte klappen.' : v > -80 ? '🙂 Fast – noch etwas mehr bieten?' : v > -250 ? '😐 Hm, eher nicht.' : '😠 Das ist ja lächerlich!';
      };
      m.body.querySelectorAll('input').forEach(e => e.oninput = mood);
      $('tp').onchange = e => { partner = S.players[+e.target.value]; draw(); };
      mood();
      m.row.innerHTML = '';
      const c = document.createElement('button'); c.className = 'h-btn'; c.textContent = 'Abbrechen'; c.onclick = () => { m.close(); res(); }; m.row.appendChild(c);
      const o = document.createElement('button'); o.className = 'h-btn primary'; o.textContent = 'Angebot machen';
      o.onclick = async () => {
        const d = deal(); if (!d.give.length && !d.get.length) return Hub.toast('Leeres Angebot', 'Wähle mindestens ein Grundstück aus.', 'alert');
        m.close();
        let ok;
        if (isAI(partner)){ await wait(500); ok = aiEvalTrade(partner, d) > 0; await ask(ok ? 'Deal!' : 'Abgelehnt', `<p style="text-align:center"><span style="display:inline-block;width:46px;height:58px">${pawnSVG(partner.col, partner.tok)}</span></p><p style="text-align:center">${esc(partner.name)}: „${ok ? ['Abgemacht!', 'Einverstanden – gute Geschäfte!', 'Das nehme ich gern.'][Math.floor(Math.random() * 3)] : ['Nein danke.', 'Da musst du schon mehr bieten.', 'Netter Versuch!'][Math.floor(Math.random() * 3)]}“</p>`, [['OK', 0, 'primary']], {center:true}); }
        else ok = await ask(`${partner.name}, nimmst du an?`, `<p>${esc(p.name)} bietet: ${d.give.map(i => esc(F[i].n)).join(', ') || '–'}${d.money ? ` + ${money(d.money)}` : ''}</p><p>und möchte: ${d.get.map(i => esc(F[i].n)).join(', ') || '–'}${d.ask ? ` + ${money(d.ask)}` : ''}</p>`, [['Ablehnen', false], ['Annehmen', true, 'primary']], {center:true});
        if (ok) execTrade(d); else log(`🤝 ${esc(partner.name)} lehnt ab.`, partner);
        res();
      };
      m.row.appendChild(o);
    };
    draw();
  });
}

// =====================================================================
//  VERSTEIGERUNG
// =====================================================================
function auction(i){
  return new Promise(res => {
    const f = F[i];
    const bidders = alive().filter(p => p.cash > 10).map(p => ({p, out:false}));
    if (!bidders.length){ res(); return; }
    let bid = 0, lead = null, idx = 0;
    const m = modal(`Versteigerung: ${f.n}`, '', {center:true});
    const draw = (txt) => {
      m.body.innerHTML = `${deedHTML(i)}<div class="auc"><div class="bid">${money(bid)}</div><div class="who">${lead ? `Höchstbietend: <b style="color:${lead.p.col}">${esc(lead.p.name)}</b>` : 'Noch kein Gebot – Mindestgebot 10'}</div>
        <div class="bidders">${bidders.map(b => `<div class="${b.out ? 'out' : ''} ${b === lead ? 'lead' : ''}">${b.p.tok} ${esc(b.p.name)}</div>`).join('')}</div><div class="who" id="aucMsg">${txt || ''}</div><div class="btns" id="aucBtns"></div></div>`;
    };
    const finish = () => {
      m.close();
      if (lead){ lead.p.cash -= bid; S.f[i].own = lead.p.id; lead.p.st.bought++; log(`🔨 <b>${esc(lead.p.name)}</b> ersteigert ${esc(f.n)} für ${money(bid)}.`, lead.p); Hub.sfx('ok');
        if (!isAI(lead.p) && bid < f.p * .7) Hub.achieve('immo', 'bargain', 'Schnäppchenjäger', 'Ersteigere ein Grundstück unter 70 % des Preises'); }
      else log(`🔨 Niemand bietet für ${esc(f.n)}.`);
      renderAll(); res();
    };
    const g0 = gen;
    const step = async () => {
      if (!S || g0 !== gen){ m.close(); return res(); }
      const active = bidders.filter(b => !b.out);
      if ((lead && active.length === 1 && active[0] === lead) || !active.length){ draw(lead ? 'Zum Ersten, zum Zweiten … VERKAUFT!' : ''); Hub.tone(200, .15, 'square', .05); await wait(1100); return finish(); }
      const b = bidders[idx % bidders.length]; idx++;
      if (b.out || b === lead) return step();
      draw(`${esc(b.p.name)} ist dran …`);
      const minBid = bid + 10;
      if (b.p.cash < minBid){ b.out = true; return step(); }
      if (isAI(b.p)){
        await wait(450); if (!S || g0 !== gen){ m.close(); return res(); }
        const mx = aiMaxBid(b.p, i);
        if (minBid <= mx){ const inc = [10, 10, 20, 50][Math.floor(Math.random() * 4)]; bid = Math.min(Math.floor(mx), bid + inc, b.p.cash); bid = Math.max(bid, minBid); lead = b; Hub.tone(880, .05, 'triangle', .04); }
        else { b.out = true; }
        return step();
      }
      // Mensch
      draw(`<b style="color:${b.p.col}">${multiHuman() ? esc(b.p.name) + '</b> ist' : 'Du</b> bist'} dran (${money(b.p.cash)} verfügbar).`);
      const box = m.body.querySelector('#aucBtns');
      [[10, '+10'], [50, '+50'], [100, '+100']].forEach(([inc, l]) => { const bt = document.createElement('button'); bt.className = 'h-btn'; bt.textContent = `${l} → ${money(bid + inc)}`; bt.disabled = bid + inc > b.p.cash; bt.onclick = () => { bid += inc; lead = b; Hub.tone(880, .05, 'triangle', .04); step(); }; box.appendChild(bt); });
      const ps = document.createElement('button'); ps.className = 'h-btn danger'; ps.textContent = 'Aussteigen'; ps.onclick = () => { b.out = true; step(); }; box.appendChild(ps);
    };
    draw(); step();
  });
}

// =====================================================================
//  ZUG-ABLAUF
// =====================================================================
function actionUI(buttons, extras){
  // buttons: [{l, v, primary, big, dis}]; extras: Verwaltungsknöpfe
  const box = $('actions');
  return new Promise(res => {
    box.innerHTML = '';
    buttons.forEach(b => { const e = document.createElement('button'); e.className = 'h-btn ' + (b.primary ? 'primary ' : '') + (b.big ? 'big' : ''); e.innerHTML = b.l; e.disabled = !!b.dis; e.onclick = () => { box.innerHTML = ''; res(b.v); }; box.appendChild(e); });
    if (extras){
      const r = document.createElement('div'); r.className = 'rowb';
      [['🏠', 'Bauen &<br>Hypothek', 'manage'], ['🤝', 'Handeln', 'trade'], ['📜', 'Urkunden', 'deeds']].forEach(([ic, l, v]) => { const e = document.createElement('button'); e.className = 'h-btn'; e.innerHTML = `<span>${ic}</span>${l}`; e.onclick = () => { box.innerHTML = ''; res(v); }; r.appendChild(e); });
      box.appendChild(r);
    }
    S.waitingUI = res;
  });
}
// Tastatur für den Laptop am Fernseher: Leertaste/Enter = Hauptaktion, B = Bauen, H = Handeln, U = Urkunden
addEventListener('keydown', e => {
  if (!S || S.over || document.querySelector('.h-overlay.on')) return;
  const box = $('actions');
  if (e.code === 'Space' || e.code === 'Enter'){ const b = box.querySelector('.big:not(:disabled)'); if (b){ e.preventDefault(); b.click(); } }
  const map = {KeyB:0, KeyH:1, KeyU:2}; if (e.code in map){ const r = box.querySelectorAll('.rowb .h-btn')[map[e.code]]; if (r) r.click(); }
});
async function humanExtras(p, v){
  if (v === 'manage') await manageDialog(p);
  if (v === 'trade') await tradeDialog(p);
  if (v === 'deeds'){
    const ids = owned(p);
    await ask(multiHuman() ? `Urkunden von ${p.name}` : 'Deine Urkunden', ids.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-height:60vh;overflow:auto">${ids.map(i => `<div style="transform:scale(.8);margin:-20px -24px">${deedHTML(i, true)}</div>`).join('')}</div>` : '<p>Du besitzt noch keine Grundstücke.</p>', [['Schließen', 0, 'primary']], {wide:true});
  }
}
async function movePlayer(p, steps, g){
  const dir = Math.sign(steps);
  for (let k = 0; k < Math.abs(steps); k++){
    p.pos = (p.pos + dir + 40) % 40;
    if (dir > 0 && p.pos === 0 && k < Math.abs(steps) - 1 || dir > 0 && p.pos === 0 && k === Math.abs(steps) - 1 && !S.rules.dblGo) gain(p, 200, `über ${F[0].n}`);
    const t = $('tok' + p.id); if (t){ t.classList.remove('hop'); void t.offsetWidth; t.classList.add('hop'); }
    renderTokens(); camera(p.pos);
    Hub.tone(560 + (k % 2) * 90, .03, 'triangle', .025);
    await pause(isAI(p) ? 150 : 175);
    if (g !== gen) return;
  }
  if (dir > 0 && p.pos === 0 && S.rules.dblGo) gain(p, 400, `genau auf ${F[0].n} gelandet`);
}
async function goTo(p, target, g, collect = true){
  const steps = (target - p.pos + 40) % 40;
  if (!collect){ p.pos = target; renderTokens(); camera(target); await pause(400); return; }
  await movePlayer(p, steps, g);
}
async function toJail(p){
  p.pos = 10; p.jail = 1; S.jailedNow = true;
  log(`🚨 ${p.tok} <b>${esc(p.name)}</b> muss ins Gefängnis!`, p);
  Hub.tone(880, .25, 'sawtooth', .03); Hub.tone(660, .25, 'sawtooth', .03, .25); Hub.tone(880, .25, 'sawtooth', .03, .5);
  renderTokens(); camera(10); renderPlayers();
  await pause(700);
}
async function drawCard(p, kind, dice, g){
  const deck = S[kind + 'Deck'], k = deck.shift(), list = kind === 'ch' ? CH_CARDS : CC_CARDS, card = list[k];
  if (!card.a.free) deck.push(k);
  showCard(kind, card); log(`${kind === 'ch' ? '❓' : '🎁'} ${p.tok} <b>${esc(p.name)}</b>: <i>${esc($('mcP').textContent)}</i>`, p);
  if (isAI(p)) await pause(1900); else await new Promise(r => { const mc = $('mcard'); const end = () => { removeEventListener('pointerdown', end); clearTimeout(tm); r(); }; const tm = setTimeout(end, 4500); setTimeout(() => addEventListener('pointerdown', end), 300); });
  hideCard(); await wait(250);
  if (g !== gen) return;
  const a = card.a;
  if (a.gain) gain(p, a.gain, 'Karte');
  if (a.pay) await pay(p, a.pay, null, 'Karte');
  if (a.free){ p.free.push(kind); renderPlayers(); }
  if (a.jail) return toJail(p);
  if (a.repair){ const cost = owned(p).reduce((s, i) => s + (S.f[i].h === 5 ? a.repair[1] : S.f[i].h * a.repair[0]), 0); if (cost) await pay(p, cost, null, 'Reparaturen'); else log(`${p.tok} ${esc(p.name)} hat keine Gebäude – Glück gehabt!`, p); }
  if (a.payEach){ for (const o of alive()) if (o !== p) await pay(p, a.payEach, o, 'Karte'); }
  if (a.collectEach){ for (const o of alive()) if (o !== p) await pay(o, a.collectEach, p, 'Geburtstag'); }
  if (a.to != null){ await goTo(p, a.to, g); return land(p, dice, g); }
  if (a.back){ await movePlayer(p, -a.back, g); return land(p, dice, g); }
  if (a.next){
    let t = p.pos; do { t = (t + 1) % 40; } while (F[t].t !== a.next);
    await goTo(p, t, g);
    if (S.f[t].own >= 0 && S.f[t].own !== p.id && !S.f[t].m){
      const o = S.players[S.f[t].own];
      const r = a.next === 'rr' ? rentOf(t, 0) * 2 : (dice[0] + dice[1]) * 10;
      return pay(p, r, o, `Miete ${F[t].n}`);
    }
    return land(p, dice, g);
  }
}
async function land(p, dice, g){
  const f = F[p.pos], st = S.f[p.pos];
  highlight(p.pos);
  if (f.t === 'gojail') return toJail(p);
  if (f.t === 'tax') return pay(p, f.a, null, f.n);
  if (f.t === 'ch' || f.t === 'cc') return drawCard(p, f.t, dice, g);
  if (f.t === 'park'){ if (S.rules.pot && S.pot > 0){ const v = S.pot; S.pot = 0; renderPot(); gain(p, v, 'Frei-Parken-Topf'); Hub.sfx('ach'); if (!isAI(p) && v >= 500) Hub.achieve('immo', 'pot', 'Jackpot!', 'Räume einen Frei-Parken-Topf mit mindestens 500 ab'); } return; }
  if (!f.p) return;
  if (st.own < 0){
    let buy;
    if (isAI(p)){ buy = aiWantsBuy(p, p.pos); await pause(500); }
    else {
      const can = p.cash >= f.p;
      buy = await ask((multiHuman() ? p.name + ': ' : '') + (can ? `${f.n} kaufen?` : f.n), deedHTML(p.pos) + `<p style="text-align:center">${multiHuman() ? 'Geld von ' + esc(p.name) : 'Dein Geld'}: <b>${money(p.cash)}</b>${can ? '' : ' – das reicht leider nicht.'}</p>`,
        [[S.rules.auction ? 'Versteigern' : 'Nicht kaufen', false], ...(can ? [[`Kaufen für ${money(f.p)}`, true, 'primary']] : [])], {center:true});
    }
    if (g !== gen) return;
    if (buy){
      p.cash -= f.p; st.own = p.id; p.st.bought++;
      log(`🏷️ ${p.tok} <b>${esc(p.name)}</b> kauft <b>${esc(f.n)}</b> für ${money(f.p)}.`, p);
      floatAt(p, '−' + money(f.p), '#ff8a95'); Hub.tone(660, .08, 'triangle', .04); Hub.tone(990, .1, 'triangle', .04, .07);
      if (!isAI(p) && f.t === 'st' && hasSet(p, f.g)){ Hub.sfx('ach'); Hub.toast('Farbgruppe komplett!', 'Jetzt kannst du Häuser bauen.', 'home'); Hub.achieve('immo', 'set', 'Monopol!', 'Besitze eine komplette Farbgruppe'); }
      renderAll();
    } else if (S.rules.auction){ log(`${p.tok} ${esc(p.name)} kauft ${esc(f.n)} nicht – Versteigerung!`, p); await auction(p.pos); }
    else log(`${p.tok} ${esc(p.name)} kauft ${esc(f.n)} nicht.`, p);
    return;
  }
  if (st.own === p.id || st.m) return;
  const o = S.players[st.own];
  const r = rentOf(p.pos, dice[0] + dice[1]);
  if (r > 0){ await pay(p, r, o, `Miete ${f.n}`); if (r >= 1000 && !isAI(o)) Hub.achieve('immo', 'rent1k', 'Kassensturz', 'Kassiere mindestens 1 000 Miete auf einmal'); }
}
async function jailPhase(p, g){
  // Rückgabe: true = Zug geht normal weiter (frei), 'moved' = schon gezogen, false = bleibt
  let choice;
  if (isAI(p)){
    const early = S.round < (p.type === 'hard' ? 12 : 18) && F.some(f => f.p && S.f[f.i].own < 0);
    choice = p.free.length ? 'card' : (early && p.cash > 200) ? 'pay' : 'roll';
    await pause(500);
  } else {
    setTurnHead(p, `${you(p)} ${multiHuman() ? 'sitzt' : 'sitzt'} im Gefängnis (Versuch ${p.jail}/3).`);
    choice = await actionUI([{l:'🎲 Pasch versuchen', v:'roll', primary:true, big:true}, ...(p.free.length ? [{l:'🗝️ Freikarte nutzen', v:'card'}] : []), {l:`Kaution zahlen (${money(50)})`, v:'pay', dis:p.cash < 50}]);
  }
  if (g !== gen) return false;
  if (choice === 'card'){ const k = p.free.shift(); S[k + 'Deck'].push(k === 'ch' ? 7 : 4); p.jail = 0; log(`🗝️ ${esc(p.name)} nutzt die Freikarte.`, p); renderPlayers(); return true; }
  if (choice === 'pay'){ await pay(p, 50, null, 'Kaution'); p.jail = 0; return !p.bk; }
  const d = await rollDice(); if (g !== gen) return false;
  if (d[0] === d[1]){ p.jail = 0; log(`🎲 ${esc(p.name)} würfelt einen Pasch und kommt frei!`, p); await movePlayer(p, d[0] + d[1], g); await land(p, d, g); return 'moved'; }
  p.jail++;
  if (p.jail > 3){ log(`${esc(p.name)} muss nach drei Versuchen die Kaution zahlen.`, p); await pay(p, 50, null, 'Kaution'); if (p.bk) return false; p.jail = 0; await movePlayer(p, d[0] + d[1], g); await land(p, d, g); return 'moved'; }
  log(`🔒 ${esc(p.name)} bleibt im Gefängnis (${d[0]}+${d[1]}).`, p);
  return false;
}
async function doTurn(p, g){
  S.cur = S.players.indexOf(p);
  renderAll(); camera(SET.cam ? p.pos : null);
  setTurnHead(p, isAI(p) ? 'denkt nach …' : (multiHuman() ? 'ist am Zug! (Leertaste = würfeln)' : 'Du bist am Zug!'));
  if (!isAI(p) && multiHuman()) await turnBanner(p);
  save();
  if (isAI(p)) await pause(450);
  else Hub.tone(880, .08, 'triangle', .04);
  let dbl = 0, canRoll = true;
  if (p.jail){
    const r = await jailPhase(p, g); if (g !== gen) return;
    if (r === 'moved' || r === false) canRoll = false;
  }
  while (canRoll && !p.bk){
    if (isAI(p)){ await aiPreRoll(p); }
    else {
      for (;;){
        setTurnHead(p, dbl ? `Pasch! ${multiHuman() ? esc(p.name) + ' darf' : 'Du darfst'} nochmal würfeln.` : (multiHuman() ? 'ist am Zug! (Leertaste = würfeln)' : 'Du bist am Zug!'));
        const v = await actionUI([{l:'🎲 Würfeln', v:'roll', primary:true, big:true}], true);
        if (g !== gen) return;
        if (v === 'roll') break;
        await humanExtras(p, v); if (g !== gen) return;
      }
    }
    setTurnHead(p, 'würfelt …');
    const d = await rollDice(); if (g !== gen) return;
    const isD = d[0] === d[1];
    setTurnHead(p, `${d[0]} + ${d[1]} = <b>${d[0] + d[1]}</b>${isD ? ' · Pasch!' : ''}`);
    if (isD) dbl++;
    if (dbl === 3){ log(`🎲 ${esc(p.name)} würfelt den dritten Pasch in Folge!`, p); await toJail(p); break; }
    S.jailedNow = false;
    await movePlayer(p, d[0] + d[1], g); if (g !== gen) return;
    await land(p, d, g); if (g !== gen) return;
    renderAll();
    if (p.bk || S.jailedNow || !isD) break;
    log(`🎲 ${esc(p.name)} hat einen Pasch und darf nochmal.`, p);
  }
  if (g !== gen || p.bk) return;
  // Nach dem Würfeln
  if (isAI(p)){ await aiManage(p); await pause(350); }
  else {
    for (;;){
      setTurnHead(p, 'Bauen, handeln – oder Zug beenden.');
      const v = await actionUI([{l:'Zug beenden ➜', v:'end', primary:true, big:true}], true);
      if (g !== gen) return;
      if (v === 'end') break;
      await humanExtras(p, v); if (g !== gen) return;
    }
  }
}
async function aiPreRoll(p){
  // Vor dem Würfeln: wenn reich, bauen/ablösen
  if (p.cash > aiReserve(p) + 300) await aiManage(p);
  await pause(300);
}
async function gameLoop(){
  const g = ++gen;
  while (!S.over && g === gen){
    const p = S.players[S.cur];
    if (!p.bk) await doTurn(p, g);
    if (g !== gen) return;
    if (checkEnd()) return;
    // nächster Spieler
    let n = S.cur;
    do { n = (n + 1) % S.players.length; if (n === 0){ S.round++; S.hist.push(S.players.map(worth)); } } while (S.players[n].bk);
    S.cur = n;
    if (checkEnd()) return;
  }
}
function checkEnd(){
  if (S.over) return true;
  const al = alive(), timeUp = S.rules.end && S.round > S.rules.end, noHumans = !humans().length && S.players.some(p => !isAI(p));
  if (al.length > 1 && !timeUp && !noHumans) return false;
  S.over = true; localStorage.removeItem('immo2_save');
  S.hist.push(S.players.map(worth));
  endScreen(timeUp, noHumans);
  return true;
}
async function endScreen(timeUp, noHumans){
  renderAll(); camera(null);
  const rank = S.players.slice().sort((a, b) => (a.bk - b.bk) || (a.bk ? (b.bkRound || 0) - (a.bkRound || 0) : worth(b) - worth(a)));
  const win = rank[0], hs = S.players.filter(p => !isAI(p));
  const humanWon = !isAI(win);
  if (humanWon){ Hub.sfx('ach'); if (hs.length === 1){ Hub.achieve('immo', 'win', 'Immobilienkönig', 'Gewinne eine Partie Immobilienkönig'); if (S.players.filter(isAI).length >= 3) Hub.achieve('immo', 'win3', 'Stadtbesitzer', 'Gewinne gegen drei oder mehr Computer-Gegner'); if (S.players.some(p => p.type === 'hard')) Hub.achieve('immo', 'winhard', 'Härtefall', 'Gewinne gegen schwere Computer-Gegner'); } }
  else Hub.sfx('bad');
  if (hs.length) Hub.score('immo', worth(hs[0]), {label:'Vermögen', silent:!humanWon});
  const m = modal(humanWon ? `👑 ${win.name} ist ${hs.length > 1 ? 'Immobilienkönig' : 'Immobilienkönig'}!` : `${win.name} gewinnt`, `
    <p>${noHumans ? 'Alle menschlichen Spieler sind pleite.' : timeUp ? 'Die Rundenzahl ist erreicht – gewertet wird das Gesamtvermögen.' : 'Alle anderen sind pleite gegangen!'}</p>
    <div class="endrank">${rank.map((p, k) => `<div><span>${['🥇', '🥈', '🥉'][k] || (k + 1) + '.'}</span><span class="pawn">${pawnSVG(p.col, p.tok)}</span>${esc(p.name)}<small style="color:var(--text-2)">${p.bk ? 'pleite' : `${owned(p).length} Grundst. · Miete kassiert ${money(p.st.rentIn)}`}</small><b>${p.bk ? '–' : money(worth(p))}</b></div>`).join('')}</div>
    <canvas class="chart" id="chart" width="700" height="220"></canvas>`, {wide:true});
  [['Zur Spielhalle', 'home', ''], ['Neues Spiel', 'new', 'primary']].forEach(([l, v, c]) => { const b = document.createElement('button'); b.className = 'h-btn ' + c; b.textContent = l; b.onclick = () => { m.close(); if (v === 'home') location.href = '../Launcher.html'; else openLobby(); }; m.row.appendChild(b); });
  setTimeout(() => drawChart($('chart')), 50);
}
function drawChart(cv){
  if (!cv) return; const c = cv.getContext('2d'), W = cv.width, H = cv.height, h = S.hist; if (h.length < 2) return;
  const mx = Math.max(...h.flat(), 1);
  c.clearRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
  for (let k = 0; k <= 4; k++){ const y = 15 + (H - 35) * k / 4; c.beginPath(); c.moveTo(40, y); c.lineTo(W - 10, y); c.stroke(); c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '11px Bahnschrift'; c.fillText(Hub.fmt(mx * (1 - k / 4)), 2, y + 4); }
  S.players.forEach((p, pi) => {
    c.strokeStyle = p.col; c.lineWidth = 3; c.beginPath();
    h.forEach((row, k) => { const x = 40 + (W - 50) * k / (h.length - 1), y = 15 + (H - 35) * (1 - row[pi] / mx); k ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
  });
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Vermögensverlauf pro Runde', 44, H - 4);
}

// =====================================================================
//  SPEICHERN
// =====================================================================
function save(){ if (!S || S.over) return; const {waitingUI, ...rest} = S; Hub.write('immo2_save', rest); }
function startGame(state){
  S = state; S.waitingUI = null;
  ED = EDITIONS[S.ed]; buildFields();
  $('lobby').classList.add('hide');
  $('log').innerHTML = '';
  buildBoard();
  S.log.slice().reverse().forEach(e => { const d = document.createElement('div'); d.innerHTML = e.h; if (e.c) d.style.setProperty('--lc2', e.c); $('log').prepend(d); });
  renderAll(); renderBuildings();
  Hub.sfx('launch');
  gameLoop();
}
function newGameFromLobby(){
  const seats = LB.seats.filter(s => s.on);
  if (seats.length < 2) return Hub.toast('Zu wenig Spieler', 'Mindestens zwei Plätze müssen besetzt sein.', 'alert');
  const players = seats.map((s, k) => ({id:k, name:(s.name || 'Spieler').slice(0, 18), type:s.type, tok:s.emoji || TOKENS[s.tok][0], col:PCOLORS[s.col], cash:LB.rules.start, pos:0, jail:0, free:[], bk:false, st:{rentIn:0, rentOut:0, bought:0, built:0}}));
  shuffle(players); players.forEach((p, k) => p.id = k);
  // Reihenfolge der Ids nach dem Mischen korrigieren erfolgt oben; Startgrundstücke danach
  const st = {ed:LB.ed, rules:{...LB.rules}, players, f:BASE.map(() => ({own:-1, h:0, m:false})), cur:0, round:1, pot:0, houses:32, hotels:12,
    chDeck:shuffle([...CH_CARDS.keys()]), ccDeck:shuffle([...CC_CARDS.keys()]), log:[], hist:[], over:false};
  if (LB.rules.quick){
    // Schnellstart: jeder bekommt zwei zufällige Straßen (keine komplette Gruppe)
    const free = shuffle(BASE.map((b, i) => i).filter(i => BASE[i].t === 'st' || BASE[i].t === 'rr'));
    players.forEach(pl => { let n = 0; for (const i of free){ if (n >= 2) break; if (st.f[i].own >= 0) continue; st.f[i].own = pl.id; n++; } });
  }
  st.hist.push(players.map(p => p.cash));
  startGame(st);
  log(`🎲 Neues Spiel – Edition <b>${ED.title}</b>. Reihenfolge: ${S.players.map(p => p.tok).join(' → ')}`);
}

// =====================================================================
//  LOBBY
// =====================================================================
function edPreview(k){
  const e = EDITIONS[k];
  const strip = e.colors.map((c, i) => `<rect x="${10 + i * 37}" y="78" width="33" height="22" rx="3" fill="${c}"/>`).join('');
  return `<svg viewBox="0 0 310 110" preserveAspectRatio="xMidYMid slice"><rect width="310" height="110" fill="${e.theme.bd}"/><rect x="0" y="0" width="310" height="110" fill="${e.theme.room1}" opacity=".35"/>
    <text x="155" y="48" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="26" fill="#fff" style="paint-order:stroke" stroke="${e.theme.lc}" stroke-width="7">${e.logo[0]}</text>${strip}</svg>`;
}
function openLobby(){
  gen++; S = null;
  const L = $('lobby'); L.classList.remove('hide');
  const saveExists = !!Hub.read('immo2_save', null);
  const seatHTML = (s, k) => {
    const used = LB.seats.filter((o, j) => j !== k && o.on).map(o => o.tok);
    return `<div class="seat ${s.on ? '' : 'off'}" data-k="${k}">
      <button class="pawnBtn" data-a="col" title="Farbe wechseln">${pawnSVG(PCOLORS[s.col], s.emoji || TOKENS[s.tok][0])}</button>
      <div class="tokpick">${TOKENS.map(([e, n], ti) => `<button data-a="tok" data-t="${ti}" title="${n}" class="${ti === s.tok ? 'on' : ''}" ${used.includes(ti) ? 'disabled' : ''}>${e}</button>`).join('')}</div>
      <input class="h-input" data-a="name" value="${esc(s.name)}" maxlength="18">
      <select data-a="type"><option value="off" ${!s.on ? 'selected' : ''}>— frei —</option><option value="human" ${s.on && s.type === 'human' ? 'selected' : ''}>👤 Mensch</option><option value="easy" ${s.on && s.type === 'easy' ? 'selected' : ''}>🤖 KI leicht</option><option value="normal" ${s.on && s.type === 'normal' ? 'selected' : ''}>🤖 KI normal</option><option value="hard" ${s.on && s.type === 'hard' ? 'selected' : ''}>🤖 KI schwer</option></select></div>`;
  };
  const rule = (k, label, opts) => `<div class="rule"><span>${label}</span><select data-r="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(LB.rules[k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  L.innerHTML = `<div class="lb"><h1>IMMOBILIEN<span>KÖNIG</span></h1><div class="sub">Kaufen. Bauen. Kassieren. – Das große Grundstücksspiel für 2–6 Spieler.</div>
    <div class="sec"><h3>Spielbrett wählen</h3><div class="eds">${Object.keys(EDITIONS).map(k => `<div class="ed ${LB.ed === k ? 'on' : ''}" data-ed="${k}"><div class="pv">${edPreview(k)}</div><div class="tt"><b>${EDITIONS[k].title}</b><small>${EDITIONS[k].sub}</small></div></div>`).join('')}</div></div>
    <div class="sec"><h3 style="display:flex;justify-content:space-between;align-items:center">Spieler (Figur anklicken = Farbe wechseln)<button class="h-btn sm primary" id="lbParty">👥 Partyrunde übernehmen (${Hub.party.active().map(pp => esc(pp.name)).join(', ') || 'niemand'})</button></h3><div class="seats">${LB.seats.map(seatHTML).join('')}</div></div>
    <div class="sec"><h3>Regeln</h3><div class="rules">
      ${rule('start', '💰 Startkapital', [[1000, '1.000'], [1500, '1.500 (Standard)'], [2000, '2.000'], [3000, '3.000']])}
      ${rule('end', '⏱️ Spielende', [[0, 'Bis zum Bankrott'], [15, 'Nach 15 Runden'], [25, 'Nach 25 Runden'], [40, 'Nach 40 Runden']])}
      ${rule('auction', '🔨 Versteigerungen', [[true, 'An'], [false, 'Aus']])}
      ${rule('pot', '🅿️ Frei-Parken-Topf', [[false, 'Aus (Standard)'], [true, 'An']])}
      ${rule('dblGo', '⬅️ Doppelt auf LOS', [[false, 'Aus (Standard)'], [true, 'An']])}
      ${rule('limit', '🏘️ Häuserknappheit (32/12)', [[true, 'An (Standard)'], [false, 'Aus']])}
      ${rule('quick', '🚀 Schnellstart (2 Grundstücke je Spieler)', [[false, 'Aus'], [true, 'An – ideal für Partyabende']])}
    </div></div>
    <div class="go">${saveExists ? '<button class="h-btn lg" id="lbResume">▶ Gespeichertes Spiel fortsetzen</button>' : ''}<button class="h-btn primary lg" id="lbStart">Spiel starten</button></div></div>`;
  const persist = () => Hub.write('immo2_lobby', LB);
  L.querySelectorAll('.ed').forEach(e => e.onclick = () => { LB.ed = e.dataset.ed; persist(); openLobby(); Hub.sfx('click'); });
  L.querySelectorAll('.seat').forEach(el => {
    const k = +el.dataset.k, s = LB.seats[k];
    el.querySelector('[data-a=col]').onclick = () => { const used = LB.seats.filter((o, j) => j !== k && o.on).map(o => o.col); let c = s.col; do { c = (c + 1) % PCOLORS.length; } while (used.includes(c) && c !== s.col); s.col = c; persist(); openLobby(); };
    el.querySelectorAll('[data-a=tok]').forEach(b => b.onclick = () => { s.tok = +b.dataset.t; delete s.emoji; persist(); openLobby(); });
    el.querySelector('[data-a=name]').oninput = e => { s.name = e.target.value; persist(); };
    el.querySelector('[data-a=type]').onchange = e => { const v = e.target.value; if (v === 'off'){ s.on = false; } else { s.on = true; s.type = v; if (v === 'human' && AINAMES.includes(s.name)) s.name = (Hub.settings.name || 'Du') + (LB.seats.filter(o => o.on && o.type === 'human').length > 1 ? ' ' + (k + 1) : ''); if (v !== 'human' && (!s.name || s.name === (Hub.settings.name || 'Du') || LB.seats.some((o, j) => j !== k && o.on && o.name === s.name))) s.name = AINAMES.find(n => !LB.seats.some(o => o.on && o.name === n)) || AINAMES[k]; } persist(); openLobby(); };
  });
  L.querySelectorAll('[data-r]').forEach(sel => sel.onchange = e => { const v = e.target.value; LB.rules[sel.dataset.r] = v === 'true' ? true : v === 'false' ? false : +v; persist(); });
  $('lbStart').onclick = newGameFromLobby;
  $('lbParty').onclick = () => { if (partySeats()){ Hub.sfx('ok'); openLobby(); } else Hub.toast('Partyrunde leer', 'Lege im Partyraum fest, wer dabei ist.', 'user'); };
  if ($('lbResume')) $('lbResume').onclick = () => { const st = Hub.read('immo2_save', null); if (st) startGame(st); };
}

// =====================================================================
//  ANSICHT & START
// =====================================================================
function syncView(){
  $('v3d').classList.toggle('on', SET.tilt); $('vcam').classList.toggle('on', SET.cam);
  $('vspeed').textContent = SET.speed >= 2.5 ? '⏩ Schnell' : SET.speed <= .7 ? '▶ Langsam' : '⏩ Normal';
  Hub.write('immo2_view', SET);
}
$('v3d').onclick = () => { SET.tilt = !SET.tilt; syncView(); layout(); };
$('vcam').onclick = () => { SET.cam = !SET.cam; syncView(); camera(S && SET.cam ? S.players[S.cur].pos : null); };
$('vspeed').onclick = () => { SET.speed = SET.speed === 1 ? 2.6 : SET.speed > 1 ? .6 : 1; syncView(); };
bar.on('help', () => ask('Immobilienkönig – Regeln', `<p>Würfle und ziehe übers Brett. Freie Grundstücke kannst du <b>kaufen</b> – oder sie werden <b>versteigert</b>. Wer auf deinem Grundstück landet, zahlt <b>Miete</b>.</p>
  <p>Besitzt du eine ganze <b>Farbgruppe</b>, verdoppelt sich die Miete und du darfst <b>Häuser</b> (bis 4) und dann ein <b>Hotel</b> bauen – immer gleichmäßig. Linien/Bahnhöfe zahlen mehr, je mehr du hast; Werke ein Vielfaches der Augenzahl.</p>
  <p>Pasch = nochmal würfeln, drei Pasche = Gefängnis. Raus kommst du mit Pasch, Freikarte oder 50 Kaution.</p>
  <p>Fehlt Geld, musst du Häuser verkaufen oder <b>Hypotheken</b> aufnehmen. Über <b>Handeln</b> tauschst du Grundstücke und Geld – die Computer-Gegner machen dir auch selbst Angebote!</p>
  <p>Tipp: Klicke ein Feld an, um die Besitzurkunde zu sehen. Unten rechts: 3D-Ansicht, Kamera und Tempo.</p>`, [['Verstanden', 0, 'primary']], {wide:true}));
syncView();
buildFields(); buildBoard();
openLobby();
// Für Tests
window.__immo = {get S(){ return S; }, F:() => F, aiEvalTrade, propValue, rentOf, worth, owned, canBuild, EDITIONS, auction, tradeDialog, manageDialog, land, camera};
})();
