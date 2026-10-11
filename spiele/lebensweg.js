/* =====================================================================
   Lebensweg 2 – große Spielwelt mit Abzweigungen, Berufen mit
   Spezialfähigkeiten, Häusern, Versicherungen, Aktien, Klagen,
   Wetten, Ruhestandswahl – für 2–6 Spieler (Mensch/KI)
   ===================================================================== */
(function(){
'use strict';
Hub.init('leben');
const bar = Hub.bar({id:'leben', title:'Lebensweg', stats:[['cash', 'Dein Geld'], ['job', 'Beruf'], ['life', 'Lebensmomente']], actions:['help', 'sound', 'full']});
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const K = n => (n < 0 ? '−' : '') + Hub.fmt(Math.abs(n) / 1000) + ' T';

// =====================================================================
//  DATEN
// =====================================================================
const JOBS = [
  {n:'Koch', e:'👨‍🍳', s:45000, c:'#ff9a2e'}, {n:'Mechanikerin', e:'👩‍🔧', s:50000, c:'#5a6270', perk:'mechanic', pd:'Bekommt alle Auto-Reparaturkosten der anderen.'},
  {n:'Polizist', e:'👮', s:50000, c:'#2f5fd1', perk:'police', pd:'Kassiert alle Strafzettel und Bußgelder.'}, {n:'Verkäuferin', e:'🧑‍💼', s:40000, c:'#2fbf71'},
  {n:'Friseur', e:'💇', s:35000, c:'#ff7ab8'}, {n:'Künstlerin', e:'👩‍🎨', s:30000, c:'#c45cff', perk:'artist', pd:'Zahltag: Bei einer 1–3 am Rad gibt es 40 T Extra.'},
  {n:'Busfahrer', e:'🚌', s:45000, c:'#ffb02e'}, {n:'Influencerin', e:'🤳', s:35000, c:'#ff5d9e', perk:'influencer', pd:'+10 T bei jedem Lebensmoment.'},
  {n:'Gärtnerin', e:'👩‍🌾', s:40000, c:'#3a9a3a'},
];
const UJOBS = [
  {n:'Ärztin', e:'👩‍⚕️', s:110000, c:'#14a8b8', perk:'doctor', pd:'Bei jeder Geburt zahlen die Eltern 10 T an sie.'}, {n:'Anwalt', e:'👨‍⚖️', s:95000, c:'#5a3a8a', perk:'lawyer', pd:'Erhält 15 T bei jeder Klage.'},
  {n:'Ingenieurin', e:'👩‍🔬', s:90000, c:'#2f6bff'}, {n:'Lehrer', e:'👨‍🏫', s:65000, c:'#2fbf71', perk:'teacher', pd:'Jedes Hochzeitspaar zahlt ihm 10 T.'},
  {n:'Programmiererin', e:'👩‍💻', s:95000, c:'#1b2028', perk:'programmer', pd:'Kauft Aktien zum halben Preis.'}, {n:'Tierärztin', e:'🐾', s:80000, c:'#8a5a34', perk:'vet', pd:'Für jedes neue Haustier zahlt der Besitzer 10 T.'},
  {n:'Pilotin', e:'👩‍✈️', s:100000, c:'#0b6aa8', perk:'pilot', pd:'Jede gebuchte Reise bringt ihr 10 T.'}, {n:'Architekt', e:'👷', s:85000, c:'#c45a2a', perk:'architect', pd:'Jeder Hauskauf bringt ihm 15 T.'},
];
const HOUSES = [
  {n:'Wohnwagen', e:'🚐', p:40000, lo:30000, hi:70000, c:'#8a8f9c'}, {n:'Stadtwohnung', e:'🏢', p:100000, lo:80000, hi:160000, c:'#5a8ad8'},
  {n:'Reihenhaus', e:'🏘️', p:160000, lo:130000, hi:250000, c:'#d88a5a'}, {n:'Landhaus', e:'🏡', p:240000, lo:200000, hi:380000, c:'#5aa85a'},
  {n:'Strandhaus', e:'🏖️', p:300000, lo:240000, hi:480000, c:'#ffb02e'}, {n:'Villa am See', e:'🏰', p:400000, lo:330000, hi:680000, c:'#c45cff'},
];
const UNI_EVENTS = [
  {e:'🎉', t:'Die Party des Jahres im Wohnheim!', life:1}, {e:'📚', t:'Teure Fachbücher gekauft.', m:-5000}, {e:'✈️', t:'Auslandssemester in Spanien!', m:-20000, life:2},
  {e:'☕', t:'Nebenjob im Café.', m:10000}, {e:'🏅', t:'Stipendium bekommen!', m:30000}, {e:'😵', t:'Prüfungsstress – aber bestanden.', m:0},
  {e:'🎸', t:'Du gründest eine Uni-Band.', life:1}, {e:'💻', t:'Neuer Laptop fürs Studium.', m:-8000}, {e:'🏆', t:'Du gewinnst den Uni-Hackathon!', m:20000, life:1},
];
const EVENTS = [
  {e:'🚗', t:'Auffahrunfall! Die Reparatur kostet 25 T.', m:-25000, tag:'car'}, {e:'🚓', t:'Geblitzt! Bußgeld 5 T.', m:-5000, tag:'police'},
  {e:'🛞', t:'Reifenpanne auf der Autobahn: 4 T.', m:-4000, tag:'car'}, {e:'🅿️', t:'Strafzettel fürs Falschparken: 2 T.', m:-2000, tag:'police'},
  {e:'🌪️', t:'Ein Sturm deckt dein Dach ab: 40 T.', m:-40000, tag:'house', need:'house'}, {e:'💧', t:'Wasserrohrbruch im Keller: 20 T.', m:-20000, tag:'house', need:'house'},
  {e:'🐜', t:'Termiten im Dachstuhl: 30 T.', m:-30000, tag:'house', need:'house'}, {e:'🦷', t:'Zahnspangen für die Kinder: 8 T pro Kind.', kids:-8000, need:'kids'},
  {e:'🎭', t:'Dein Kind gewinnt die Talentshow!', m:20000, life:1, need:'kids'}, {e:'🚌', t:'Klassenfahrt: 5 T pro Kind.', kids:-5000, need:'kids'},
  {e:'💼', t:'Bonus vom Chef: ein halbes Jahresgehalt!', sal:.5, need:'job'}, {e:'📈', t:'Beförderung! Dein Gehalt steigt um 15 T.', raise:15000, need:'job'},
  {e:'📉', t:'Kurzarbeit – dein Gehalt sinkt um 10 T.', raise:-10000, need:'job'}, {e:'🎰', t:'Lottogewinn – drei Richtige!', m:15000},
  {e:'📕', t:'Du schreibst einen Bestseller!', m:80000, life:1}, {e:'🧳', t:'Spontaner Kurzurlaub in Paris.', m:-15000, life:1},
  {e:'🏺', t:'Erbstück vom Dachboden versteigert.', m:40000}, {e:'🧾', t:'Steuernachzahlung vom Finanzamt.', m:-20000},
  {e:'💎', t:'Du findest einen Schatz beim Umgraben!', m:50000, life:1}, {e:'📺', t:'Riesiger neuer Fernseher – musste sein.', m:-10000},
  {e:'🐕', t:'Du rettest einen Hund aus dem Fluss – Held des Tages!', life:1}, {e:'🏃', t:'Du läufst deinen ersten Marathon!', life:1},
  {e:'🎤', t:'Du gewinnst eine Quizshow im Fernsehen!', m:60000, life:1}, {e:'💸', t:'Fehlinvestition in Krypto-Kartoffeln.', m:-30000},
  {e:'🌱', t:'Ehrenamt im Tierheim – ein gutes Gefühl.', life:1}, {e:'🎨', t:'Dein Gemälde wird versteigert!', m:35000},
  {e:'🍀', t:'Startup-Beteiligung zahlt sich aus!', m:70000}, {e:'🧯', t:'Küchenbrand – zum Glück nur Sachschaden: 15 T.', m:-15000, tag:'house', need:'house'},
  {e:'🎂', t:'Großes Familienfest!', life:1}, {e:'🏥', t:'Krankenhausaufenthalt: 10 T Zuzahlung.', m:-10000},
  {e:'🎻', t:'Du lernst endlich Geige.', life:1, m:-5000}, {e:'🚙', t:'Neues Auto gekauft.', m:-30000},
  {e:'🏁', t:'Großes Seifenkistenrennen! Alle drehen – die höchste Zahl gewinnt 50 T.', group:'race'}, {e:'📸', t:'Klassentreffen! Alle bekommen einen Lebensmoment.', group:'photo'},
  {e:'🎂', t:'Du feierst eine riesige Party – jeder schenkt dir 10 T!', group:'party'},
];
const CARCOL = Hub.party.COLORS.slice();
const AVATARS = ['👩', '👨', '🧑', '👱‍♀️', '🧔', '👩‍🦰', '👨‍🦱', '🧕', '👵', '👴', '🦸', '🧙', ...Hub.party.AVATARS];
const AINAMES = ['Lena', 'Tom', 'Aylin', 'Jonas', 'Mira', 'Paul', 'Sophie', 'Emil'];

// ---------- Welt & Wege ----------
const WW = 3600, WH = 2400;
const SEGS = {
  studium:{pts:[[300, 2160], [190, 1880], [250, 1560], [420, 1320], [640, 1200], [860, 1060]], next:['stadt'],
    types:['uni', 'pay', 'uni', 'life', 'uni', 'stock', 'uni', 'pay', 'life', 'uni', 'event', 'grad']},
  beruf:{pts:[[300, 2160], [560, 2040], [760, 1800], [880, 1460], [860, 1060]], next:['stadt'], types:['pay', 'event', 'life', 'insure', 'pay', 'event', 'pay']},
  stadt:{pts:[[860, 1060], [760, 820], [700, 560], [850, 330], [1150, 240], [1450, 320], [1620, 560]], next:['familie', 'abenteuer'],
    types:['life', 'pay', 'event', 'wed', 'life', 'event', 'pay', 'stock', 'event', 'spin', 'life', 'pay', 'sue', 'event', 'pay', 'house']},
  familie:{pts:[[1620, 560], [1640, 800], [1820, 1000], [2060, 1060], [2300, 920]], next:['seen'], types:['baby', 'pay', 'pet', 'life', 'twins', 'event', 'baby', 'pay', 'life', 'event', 'baby']},
  abenteuer:{pts:[[1620, 560], [1860, 330], [2200, 220], [2560, 360], [2580, 700], [2300, 920]], next:['seen'], types:['trip', 'event', 'life', 'gamble', 'pay', 'trip', 'life', 'event', 'gamble', 'pay', 'trip']},
  seen:{pts:[[2300, 920], [2650, 960], [2960, 1010], [3160, 1260], [3010, 1500], [2700, 1560]], next:['sicher', 'riskant'],
    types:['pay', 'event', 'life', 'stock', 'night', 'event', 'pay', 'life', 'sue', 'baby', 'event', 'pay', 'spin', 'tax']},
  sicher:{pts:[[2700, 1560], [2360, 1500], [2060, 1600], [1900, 1820], [1840, 2060]], next:['finale'], types:['pay', 'life', 'event', 'pay', 'insure', 'life', 'event', 'pay', 'life']},
  riskant:{pts:[[2700, 1560], [2820, 1860], [2620, 2150], [2250, 2250], [1840, 2060]], next:['finale'], types:['gamble', 'pay', 'gamble', 'trip', 'gamble', 'event', 'gamble']},
  finale:{pts:[[1840, 2060], [1600, 2160], [1350, 2120], [1160, 1990]], next:[], types:['pay', 'life', 'event', 'tax', 'life', 'pay', 'event', 'retire']},
};
const FORKS = {
  start:{title:'Wie beginnt dein Leben?', opts:[{seg:'studium', e:'🎓', t:'Studium', s:'100 T Studienkredit – danach Berufe mit hohem Gehalt (bis 110 T).', c:'#b04a3a'}, {seg:'beruf', e:'💼', t:'Gleich arbeiten', s:'Sofort Geld verdienen – kürzerer Weg, kleinere Gehälter.', c:'#2fbf71'}]},
  stadt:{title:'Welchen Weg nimmst du?', opts:[{seg:'familie', e:'👨‍👩‍👧', t:'Familienweg', s:'Kinder, Haustiere und Lebensmomente – ruhig und herzlich.', c:'#7ad8ff'}, {seg:'abenteuer', e:'🏔️', t:'Abenteuerweg', s:'Reisen, Wetten und Erlebnisse – teurer, aber aufregend.', c:'#ff9a2e'}]},
  seen:{title:'Die letzte Etappe', opts:[{seg:'sicher', e:'🛡️', t:'Sicherer Weg', s:'Mehr Zahltage und ruhige Ereignisse.', c:'#2fbf71'}, {seg:'riskant', e:'🎲', t:'Riskanter Weg', s:'Kürzer – mit vier Wett-Feldern: alles oder nichts!', c:'#e8343a'}]},
};
const TSTYLE = {start:['#ffd23f', '🏁'], pay:['#2fbf71', '💰'], life:['#ff7ab8', '⭐'], baby:['#7ad8ff', '👶'], twins:['#7ad8ff', '👶'], pet:['#c9a0ff', '🐶'], event:['#ff9a2e', '❗'],
  uni:['#b04a3a', '📖'], sue:['#8a5a34', '⚖️'], tax:['#6a7280', '🧾'], stock:['#2f6bff', '📈'], spin:['#c45cff', '🎰'], insure:['#14c8d8', '🛡️'], trip:['#ffb02e', '🧳'], gamble:['#e8343a', '🎲'],
  grad:['#e8343a', '🎓'], wed:['#e8343a', '💒'], house:['#e8343a', '🏠'], night:['#e8343a', '📚'], retire:['#e8343a', '🌴']};
const TNAME = {start:'Start', pay:'Zahltag', life:'Lebensmoment', baby:'Baby', twins:'Zwillinge', pet:'Haustier', event:'Ereignis', uni:'Uni-Leben', sue:'Klage', tax:'Steuern', stock:'Aktien', spin:'Glücksrad-Wette', insure:'Versicherung', trip:'Reise', gamble:'Wette',
  grad:'Abschluss', wed:'Hochzeit', house:'Hauskauf', night:'Abendschule', retire:'Ruhestand'};
const STOPS = new Set(['grad', 'wed', 'house', 'night', 'retire']);

// Spline & Felder
function catmull(pts, step = 6){
  const out = [], P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++){
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(d / step));
    for (let k = 0; k < n; k++){
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return {pts:out, L};
}
const atLen = (seg, s) => { const {pts, L} = seg.poly; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); const a = pts[i - 1], b = pts[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0]), i]; };
const SP = [];   // alle Felder
const FIRST = {};
SP.push({id:0, seg:null, s:0, x:300, y:2160, ang:-.5, type:'start', next:[]});
Object.entries(SEGS).forEach(([k, seg]) => {
  seg.poly = catmull(seg.pts); seg.len = seg.poly.L[seg.poly.L.length - 1];
  const n = seg.types.length; seg.ids = [];
  seg.types.forEach((t, j) => { const s = seg.len * (j + 1) / (n + .6); const [x, y, ang] = atLen(seg, s); const id = SP.length; SP.push({id, seg:k, s, x, y, ang, type:t, next:[]}); seg.ids.push(id); });
  FIRST[k] = seg.ids[0];
});
Object.entries(SEGS).forEach(([k, seg]) => {
  seg.ids.forEach((id, j) => { if (j < seg.ids.length - 1) SP[id].next = [seg.ids[j + 1]]; else SP[id].next = seg.next.map(n => FIRST[n]); });
});
SP[0].next = [FIRST.studium, FIRST.beruf];
const forkKey = id => id === 0 ? 'start' : SP[id].next.length > 1 ? SP[id].seg : null;

// =====================================================================
//  ZUSTAND
// =====================================================================
const VIEW = Object.assign({follow:true, speed:1}, Hub.read('leben2_view', {}));
let S = null, gen = 0;
const LBdef = () => ({seats:[
  {on:true, type:'human', name:Hub.settings.name || 'Du', av:0, col:0}, {on:true, type:'normal', name:AINAMES[0], av:3, col:1},
  {on:true, type:'normal', name:AINAMES[1], av:4, col:2}, {on:false, type:'normal', name:AINAMES[2], av:7, col:3},
  {on:false, type:'normal', name:AINAMES[3], av:6, col:4}, {on:false, type:'normal', name:AINAMES[4], av:5, col:5}],
  rules:{start:10000, lifeval:'random', crazy:false, events:'normal'}});
let LB = Object.assign(LBdef(), Hub.read('leben2_lobby', {}));
function partySeats(){
  const act = Hub.party.active().slice(0, 6);
  if (act.length < 2) return false;
  LB.seats = act.map(pp => ({on:true, type:'human', name:pp.name, av:12 + pp.av, col:pp.col}));
  while (LB.seats.length < 6) LB.seats.push({on:false, type:'normal', name:AINAMES[LB.seats.length], av:LB.seats.length, col:LB.seats.length});
  Hub.write('leben2_lobby', LB); return true;
}
if (!Hub.read('leben2_lobby', null)) partySeats();
if (Hub.party.wantsParty('leben')) partySeats();
const isAI = p => p.type !== 'human';
const multiHuman = () => S && S.players.filter(q => !isAI(q)).length > 1;
const who = p => multiHuman() ? `${p.av} ${p.name}: ` : '';
const active = () => S.players.filter(p => !p.retired);
const lifeSum = p => p.life.reduce((a, b) => a + b, 0);
const total = p => p.cash + lifeSum(p) - p.loans * 25000;
const mult = () => S.rules.crazy ? 2 : 1;

// =====================================================================
//  WELT RENDERN
// =====================================================================
const cv = $('world'), ctx = cv.getContext('2d');
let world = null, W = 0, H = 0, DPR = 1;
const cam = {x:300, y:2000, z:.9, tx:300, ty:2000, tz:.9};
function resize(){ DPR = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; }
addEventListener('resize', resize);
function prand(seed){ return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function nearRoad(x, y, d){
  for (const seg of Object.values(SEGS)) for (let i = 0; i < seg.poly.pts.length; i += 4){ const p = seg.poly.pts[i]; if (Math.abs(p[0] - x) < d && Math.abs(p[1] - y) < d && Math.hypot(p[0] - x, p[1] - y) < d) return true; }
  return Math.hypot(x - 300, y - 2160) < d;
}
function buildWorld(){
  world = document.createElement('canvas'); world.width = WW; world.height = WH;
  const c = world.getContext('2d'), R = prand(42);
  // Boden
  const g = c.createLinearGradient(0, 0, WW, WH); g.addColorStop(0, '#8fd47a'); g.addColorStop(.5, '#7cc46a'); g.addColorStop(1, '#6ab85a'); c.fillStyle = g; c.fillRect(0, 0, WW, WH);
  for (let k = 0; k < 9000; k++){ c.fillStyle = R() < .5 ? 'rgba(40,90,30,.08)' : 'rgba(255,255,200,.06)'; c.fillRect(R() * WW, R() * WH, 2 + R() * 3, 2 + R() * 4); }
  const blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  // Regionen-Untergründe
  blob(470, 1620, 330, 280, 'rgba(200,120,80,.18)');        // Campus
  blob(1120, 640, 420, 330, 'rgba(160,170,190,.35)');       // Stadt
  blob(1950, 1180, 380, 170, 'rgba(255,240,180,.25)');      // Vorstadt
  blob(2350, 120, 900, 200, 'rgba(150,140,130,.35)');       // Berge
  blob(1550, 2240, 420, 170, 'rgba(255,230,160,.45)');      // Ruhestand
  blob(2450, 1950, 420, 230, 'rgba(120,40,140,.18)');       // Casino
  // Seen
  blob(2870, 1260, 230, 170, '#e8d9a8'); blob(2870, 1260, 200, 145, '#3a9ae8'); blob(2870, 1260, 175, 122, '#5ab4f0');
  blob(3420, 600, 260, 330, '#e8d9a8'); blob(3440, 600, 230, 300, '#3a9ae8');
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; for (let k = 0; k < 14; k++){ const x = 2720 + R() * 300, y = 1170 + R() * 180; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y - 6, x + 24, y); c.stroke(); }
  // Fluss
  c.strokeStyle = '#4aa8ec'; c.lineWidth = 46; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 900); c.bezierCurveTo(250, 1000, 420, 820, 560, 980); c.bezierCurveTo(650, 1080, 600, 1300, 720, 1400); c.stroke();
  // Berge
  for (let k = 0; k < 16; k++){ const x = 1700 + k * 120 + R() * 60, h = 160 + R() * 160, y = 220 + R() * 50; c.fillStyle = '#7a8090'; c.beginPath(); c.moveTo(x - 140, y); c.lineTo(x, y - h); c.lineTo(x + 140, y); c.fill(); c.fillStyle = '#5a6070'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + 140, y); c.lineTo(x + 30, y); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 40, y - h + 50); c.lineTo(x, y - h); c.lineTo(x + 42, y - h + 52); c.lineTo(x + 10, y - h + 38); c.fill(); }
  // Hügel & Wald zwischen den Wegen
  for (let k = 0; k < 7; k++) blob(1950 + R() * 500, 520 + R() * 260, 120 + R() * 60, 60 + R() * 30, 'rgba(60,140,50,.35)');
  // Gebäude-Helfer
  const bld = (x, y, w, h, col, roof) => {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 8, y + 8, w, h);
    c.fillStyle = col; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let wy = y + 12; wy < y + h - 14; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 18) if (R() < .8) c.fillRect(wx, wy, 9, 12);
    if (roof){ c.fillStyle = roof; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + w / 2, y - h * .35); c.lineTo(x + w + 8, y); c.fill(); }
  };
  const house = (x, y, s, col, roof) => { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 20 * s + 6, y - 6 * s + 6, 40 * s, 30 * s); c.fillStyle = col; c.fillRect(x - 20 * s, y - 6 * s, 40 * s, 30 * s); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 26 * s, y - 6 * s); c.lineTo(x, y - 28 * s); c.lineTo(x + 26 * s, y - 6 * s); c.fill(); c.fillStyle = '#5a3a1a'; c.fillRect(x - 5 * s, y + 8 * s, 10 * s, 16 * s); c.fillStyle = '#bfe6ff'; c.fillRect(x - 15 * s, y + 2 * s, 8 * s, 8 * s); c.fillRect(x + 7 * s, y + 2 * s, 8 * s, 8 * s); };
  const tryPlace = (fn, x, y, d = 85) => { if (!nearRoad(x, y, d)) fn(x, y); };
  // Campus
  [[330, 1500, 120, 90], [480, 1430, 100, 120], [600, 1560, 90, 80], [380, 1700, 140, 80], [560, 1720, 110, 90]].forEach(([x, y, w, h]) => tryPlace(() => bld(x, y, w, h, '#b85a3a', '#7a2a1a'), x + w / 2, y + h / 2, 70));
  // Stadt-Skyline
  for (let k = 0; k < 26; k++){ const x = 840 + R() * 560, y = 420 + R() * 420, w = 50 + R() * 50, h = 80 + R() * 160; tryPlace(() => bld(x, y, w, h, pick(['#6a7a9a', '#8a9ab8', '#4a5a7a', '#9aa8c0', '#7a6a8a'])), x + w / 2, y + h / 2, 80); }
  // Vorstadt-Häuser
  for (let k = 0; k < 22; k++){ const x = 1560 + R() * 760, y = 820 + R() * 420; tryPlace(() => house(x, y, 1.2 + R() * .5, pick(['#ffe9c8', '#ffd8d8', '#d8f0ff', '#fff4b0', '#e8ffd8']), pick(['#c4402a', '#8a4a2a', '#5a6a8a'])), x, y, 75); }
  // Elternhaus
  house(190, 2280, 2.4, '#fff4b0', '#c4402a');
  // Ruhestand: Villen & Palmen
  [[1450, 2290], [1700, 2310], [1250, 2260]].forEach(([x, y]) => tryPlace(() => house(x, y, 2.2, '#fff', '#2fa0a8'), x, y, 70));
  // Casino-Meile
  [[2350, 1980], [2520, 1880], [2180, 2120]].forEach(([x, y]) => tryPlace(() => { bld(x - 60, y - 50, 120, 90, '#3a1a5a'); c.fillStyle = '#ffd23f'; c.font = '800 26px Bahnschrift'; c.textAlign = 'center'; c.fillText('CASINO', x, y - 60); }, x, y, 60));
  // Bäume
  const tree = (x, y, s) => { c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x + 8, y + 10, 26 * s, 12 * s, 0, 0, 7); c.fill(); c.fillStyle = '#6a4a2a'; c.fillRect(x - 4 * s, y - 4 * s, 8 * s, 16 * s); c.fillStyle = pick(['#2f8a3a', '#3aa04a', '#278a4a']); c.beginPath(); c.arc(x, y - 18 * s, 24 * s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - 8 * s, y - 26 * s, 9 * s, 0, 7); c.fill(); };
  const palm = (x, y) => { c.strokeStyle = '#8a5a2a'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 40, x + 4, y - 70); c.stroke(); c.fillStyle = '#2fa04a'; for (let k = 0; k < 6; k++){ c.save(); c.translate(x + 4, y - 70); c.rotate(k * 1.05); c.beginPath(); c.ellipse(26, 0, 30, 8, 0, 0, 7); c.fill(); c.restore(); } };
  for (let k = 0; k < 420; k++){ const x = R() * WW, y = 250 + R() * (WH - 250); if (Math.hypot(x - 2870, y - 1260) < 260 || Math.hypot(x - 3430, y - 600) < 340 || (x > 830 && x < 1450 && y > 400 && y < 880)) continue; tryPlace(() => tree(x, y, .8 + R() * .7), x, y, 70); }
  for (let k = 0; k < 18; k++){ const x = 1150 + R() * 900, y = 2180 + R() * 180; tryPlace(() => palm(x, y), x, y, 60); }
  // Regionsnamen
  const label = (t, x, y, s = 1) => { c.font = `800 ${46 * s}px Bahnschrift`; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeText(t, x, y); c.fillStyle = 'rgba(255,255,255,.88)'; c.fillText(t, x, y); };
  label('ELTERNHAUS', 260, 2370, .8); label('UNIVERSITÄT', 470, 1880, .9); label('STADT', 1120, 980); label('VORSTADT', 1960, 1300, .9); label('BERGE', 2450, 90);
  label('SEENLAND', 2870, 1480, .9); label('CASINO-MEILE', 2480, 1760, .8); label('RUHESTAND', 1450, 2380, .9);
  // Straßen
  c.lineCap = 'round'; c.lineJoin = 'round';
  const roads = Object.values(SEGS);
  [[84, '#2a2e36'], [70, '#5a5f6b'], [62, '#6a707c']].forEach(([w, col]) => { c.strokeStyle = col; c.lineWidth = w; roads.forEach(seg => { c.beginPath(); seg.poly.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }); });
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4; c.setLineDash([22, 22]); roads.forEach(seg => { c.beginPath(); seg.poly.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }); c.setLineDash([]);
  // Felder
  SP.forEach(sp => {
    const [col, ic] = TSTYLE[sp.type], stop = STOPS.has(sp.type) || sp.type === 'start', r = stop ? 42 : 31;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(sp.x + 4, sp.y + 6, r, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(sp.x, sp.y, r + 5, 0, 7); c.fill();
    const gg = c.createRadialGradient(sp.x - r * .3, sp.y - r * .3, 2, sp.x, sp.y, r); gg.addColorStop(0, shade(col, .35)); gg.addColorStop(1, col);
    c.fillStyle = gg; c.beginPath(); c.arc(sp.x, sp.y, r, 0, 7); c.fill();
    c.font = `${stop ? 40 : 30}px "Segoe UI Emoji"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, sp.x, sp.y + 2);
    if (sp.type === 'twins'){ c.font = '800 15px Bahnschrift'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText('×2', sp.x + 18, sp.y + 18); c.fillText('×2', sp.x + 18, sp.y + 18); }
    if (stop){
      // Schild
      const t = TNAME[sp.type].toUpperCase(); c.font = '800 20px Bahnschrift'; const tw = c.measureText(t).width + 24;
      c.fillStyle = '#5a3a1a'; c.fillRect(sp.x - 3, sp.y - r - 52, 6, 30);
      c.fillStyle = sp.type === 'start' ? '#ffd23f' : '#e8343a'; c.beginPath(); c.roundRect ? c.roundRect(sp.x - tw / 2, sp.y - r - 84, tw, 34, 8) : c.rect(sp.x - tw / 2, sp.y - r - 84, tw, 34); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); c.fillStyle = sp.type === 'start' ? '#1b2028' : '#fff'; c.fillText(t, sp.x, sp.y - r - 66);
    }
  });
  // Abzweig-Schilder
  Object.entries(FORKS).forEach(([k, fk]) => {
    const id = k === 'start' ? 0 : SEGS[k].ids[SEGS[k].ids.length - 1], sp = SP[id];
    fk.opts.forEach((o, j) => {
      const tgt = SP[FIRST[o.seg]], a = Math.atan2(tgt.y - sp.y, tgt.x - sp.x), sx = sp.x + Math.cos(a) * 95 + (j ? 30 : -30) * 0, sy = sp.y + Math.sin(a) * 95 - 60;
      c.save(); c.translate((sp.x + tgt.x) / 2, (sp.y + tgt.y) / 2 - 64);
      c.font = '800 17px Bahnschrift'; const t = `${o.e} ${o.t}`, tw = c.measureText(t).width + 20;
      c.fillStyle = '#5a3a1a'; c.fillRect(-3, 10, 6, 34);
      c.fillStyle = o.c; c.beginPath(); c.roundRect ? c.roundRect(-tw / 2, -18, tw, 30, 7) : c.rect(-tw / 2, -18, tw, 30); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, 0, -2); c.restore();
    });
  });
}
function shade(hex, k){ const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }

// ---------- Autos ----------
function drawCar(c, x, y, ang, col, pegs, s = 1, glow){
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  if (glow){ c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(0, 0, 58, 38, 0, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.roundRect ? c.roundRect(-40, -22, 84, 50, 16) : c.rect(-40, -22, 84, 50); c.fill();
  c.fillStyle = '#1b1b1b'; [[-26, -25], [20, -25], [-26, 19], [20, 19]].forEach(([wx, wy]) => { c.beginPath(); c.roundRect ? c.roundRect(wx, wy, 16, 7, 3) : c.rect(wx, wy, 16, 7); c.fill(); });
  const g = c.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, shade(col, .35)); g.addColorStop(1, shade(col, -.25));
  c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(-42, -22, 84, 44, 16) : c.rect(-42, -22, 84, 44); c.fill();
  c.strokeStyle = shade(col, -.45); c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(190,230,255,.9)'; c.beginPath(); c.roundRect ? c.roundRect(20, -17, 12, 34, 5) : c.rect(20, -17, 12, 34); c.fill();
  c.fillStyle = '#fff6b0'; c.fillRect(38, -16, 4, 7); c.fillRect(38, 9, 4, 7);
  // Sitzplätze / Stecker
  const seats = [[8, -9], [8, 9], [-8, -9], [-8, 9], [-24, -9], [-24, 9]];
  pegs.slice(0, 6).forEach((pc, k) => { const [px, py] = seats[k]; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(px + 1, py + 2, 6.5, 0, 7); c.fill(); c.fillStyle = pc; c.beginPath(); c.arc(px, py, 6.5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(px - 2, py - 2, 2.2, 0, 7); c.fill(); });
  c.restore();
}
function pegsOf(p){ const a = [p.pegCol]; if (p.married) a.push(p.spouseCol); for (let k = 0; k < p.kids; k++) a.push(k % 2 ? '#7ad8ff' : '#ffb0d8'); return a; }

// ---------- Kamera & Zeichenschleife ----------
let lastT = 0, floats = [], tt = 0;
function carPos(p){ return p.anim || {x:SP[p.pos].x, y:SP[p.pos].y, ang:SP[p.pos].ang}; }
function slotOffset(p){
  const here = S.players.filter(q => q.pos === p.pos && !q.anim), k = here.indexOf(p); if (k < 0 || here.length < 2) return [0, 0];
  const sp = SP[p.pos], nx = -Math.sin(sp.ang), ny = Math.cos(sp.ang), o = (k - (here.length - 1) / 2) * 34;
  return [nx * o, ny * o];
}
function frame(now){
  const dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now; tt += dt;
  if (!world){ requestAnimationFrame(frame); return; }
  // Kamera
  if (S && VIEW.follow && !cam.free && !cam.over){ const p = S.players[S.cur]; if (p){ const q = carPos(p); cam.tx = q.x; cam.ty = q.y; cam.tz = Math.max(cam.tz, .75); } }
  if (cam.over){ cam.tz = Math.min(W / WW, H / WH) * 1.02; cam.tx = WW / 2; cam.ty = WH / 2; }
  const k = 1 - Math.pow(.02, dt);
  cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k;
  // Kamera in der Welt halten
  const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
  cam.x = hw * 2 >= WW ? WW / 2 : Math.max(hw, Math.min(WW - hw, cam.x));
  cam.y = hh * 2 >= WH ? WH / 2 : Math.max(hh, Math.min(WH - hh, cam.y));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#6ab85a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(world, 0, 0);
  if (S){
    // Zielmarkierungen (Gabelung)
    if (S.forkHint) S.forkHint.forEach(id => { const sp = SP[id]; ctx.strokeStyle = `rgba(255,255,255,${.5 + Math.sin(tt * 6) * .4})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sp.x, sp.y, 52, 0, 7); ctx.stroke(); });
    // aktives Feld
    const cur = S.players[S.cur];
    if (cur && !cur.anim){ const sp = SP[cur.pos]; ctx.strokeStyle = cur.col; ctx.lineWidth = 6; ctx.globalAlpha = .6 + Math.sin(tt * 4) * .3; ctx.beginPath(); ctx.arc(sp.x, sp.y, 50 + Math.sin(tt * 4) * 4, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    // Autos
    S.players.slice().sort((a, b) => (a === cur) - (b === cur)).forEach(p => { const q = carPos(p), [ox, oy] = p.anim ? [0, 0] : slotOffset(p); drawCar(ctx, q.x + ox, q.y + oy, q.ang, p.col, pegsOf(p), p === cur ? 1.08 : .92, p === cur); });
  }
  ctx.restore();
  // schwebende Texte
  floats = floats.filter(f => tt - f.t0 < 1.8);
  requestAnimationFrame(frame);
}
function worldToScreen(x, y){ return [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2]; }
function floatText(p, txt, col){
  const q = carPos(p), [sx, sy] = worldToScreen(q.x, q.y - 40), f = document.createElement('div');
  f.className = 'float'; f.textContent = txt; f.style.color = col; f.style.left = sx + 'px'; f.style.top = sy + 'px'; $('wrap').appendChild(f); setTimeout(() => f.remove(), 1900);
}
// Ziehen & Zoomen
let drag = null;
cv.addEventListener('pointerdown', e => { drag = {x:e.clientX, y:e.clientY, cx:cam.tx, cy:cam.ty, moved:false}; cv.classList.add('drag'); cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6){ drag.moved = true; cam.free = true; cam.over = false; syncTools(); } if (drag.moved){ cam.tx = drag.cx - dx / cam.z; cam.ty = drag.cy - dy / cam.z; cam.x = cam.tx; cam.y = cam.ty; } });
addEventListener('pointerup', () => { drag = null; cv.classList.remove('drag'); });
cv.addEventListener('wheel', e => { e.preventDefault(); cam.over = false; cam.tz = Math.max(.25, Math.min(1.8, cam.tz * (e.deltaY < 0 ? 1.12 : .89))); syncTools(); }, {passive:false});
function syncTools(){ $('tOver').classList.toggle('on', !!cam.over); $('tFollow').classList.toggle('on', VIEW.follow && !cam.free); $('tSpeed').textContent = VIEW.speed > 1.5 ? '⏩ Schnell' : VIEW.speed < .8 ? '▶ Langsam' : '⏩ Normal'; Hub.write('leben2_view', VIEW); }
$('tOver').onclick = () => { cam.over = !cam.over; if (!cam.over) cam.tz = .9; cam.free = false; syncTools(); };
$('tFollow').onclick = () => { if (cam.free){ cam.free = false; } else VIEW.follow = !VIEW.follow; cam.over = false; syncTools(); };
$('tSpeed').onclick = () => { VIEW.speed = VIEW.speed === 1 ? 2.5 : VIEW.speed > 1 ? .6 : 1; syncTools(); };

// =====================================================================
//  GLÜCKSRAD
// =====================================================================
const wc = $('wheel').getContext('2d'); let wAng = 0;
const WCOL = ['#e8343a', '#ff9a2e', '#ffd23f', '#2fbf71', '#14c8d8', '#2f6bff', '#7a5cff', '#c45cff', '#ff5d9e', '#8a5a34'];
function drawWheel(){
  const c = wc, R = 206; c.clearRect(0, 0, 412, 412); c.save(); c.translate(206, 206);
  for (let k = 0; k < 10; k++){
    c.save(); c.rotate(wAng + k * Math.PI / 5);
    const g = c.createRadialGradient(0, 0, 20, 0, 0, R); g.addColorStop(0, shade(WCOL[k], .3)); g.addColorStop(1, WCOL[k]);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R - 2, -Math.PI / 10, Math.PI / 10); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    c.translate(R * .7, 0); c.rotate(Math.PI / 2); c.font = '800 46px Bahnschrift'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(k + 1, 0, 0); c.fillStyle = '#fff'; c.fillText(k + 1, 0, 0);
    c.restore();
  }
  c.restore();
}
let spinBusy = false;
async function spinWheel(){
  if (spinBusy) return 0;
  spinBusy = true;
  const v = rnd(1, 10), target = -Math.PI / 2 - (v - 1) * Math.PI / 5;
  const start = wAng, delta = ((target - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) + Math.PI * 2 * (3 + rnd(0, 2));
  const dur = 2200 / Math.max(.7, curSpeed()), t0 = performance.now();
  $('wbox').classList.remove('ready'); $('whint').textContent = '…';
  await new Promise(res => { let last = -1; const f = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3.2); wAng = start + delta * e; drawWheel(); const seg = Math.floor((wAng + Math.PI / 10) / (Math.PI / 5)); if (seg !== last){ last = seg; Hub.tone(1300, .012, 'square', .02); const p = $('ptr'); p.classList.remove('tick'); void p.offsetWidth; p.classList.add('tick'); } if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  wAng = target; drawWheel(); $('whint').textContent = v; spinBusy = false;
  Hub.tone(880, .1, 'triangle', .05);
  // Aktien-Auszahlung
  if (S) for (const o of S.players) if (o.stocks.includes(v)){ o.cash += 10000 * mult(); floatText(o, `📈 +${K(10000 * mult())}`, '#167a3a'); log(`📈 <b>${esc(o.name)}</b> kassiert ${K(10000 * mult())} für Aktie Nr. ${v}.`, o); }
  renderPlayers();
  return v;
}
function waitWheel(text, extra){
  // Wartet auf Klick aufs Rad oder den Drehen-Knopf; optional weitere Knöpfe (liefern {act})
  return new Promise(res => {
    msg(text || 'Klicke auf das Glücksrad!');
    const box = $('wbox'); box.classList.add('ready'); $('whint').textContent = 'DREH';
    let done = false;
    const go = async () => { if (done) return; done = true; $('wheel').onclick = null; acts([]); res(await spinWheel()); };
    $('wheel').onclick = go;
    acts([{l:'🎡 Drehen', v:'spin', primary:true}, ...(extra || [])]).then(v => { if (v === 'spin') go(); else if (!done){ done = true; $('wheel').onclick = null; box.classList.remove('ready'); res({act:v}); } });
  });
}
const curSpeed = () => S && S.players[S.cur] && isAI(S.players[S.cur]) ? VIEW.speed : 1;
const pause = ms => wait(ms / curSpeed());

addEventListener('keydown', e => {
  const ov = [...document.querySelectorAll('.h-overlay.on')].pop();
  if (ov){
    const cards = ov.querySelectorAll('.lcard:not(.dis)');
    const n = parseInt(e.key, 10); if (n >= 1 && n <= cards.length){ cards[n - 1].click(); return; }
    if (e.key === 'Enter'){ const b = ov.querySelector('.h-row .primary') || [...ov.querySelectorAll('.h-row button')].pop(); if (b){ e.preventDefault(); b.click(); } }
    return;
  }
  if (e.code === 'Space' || e.code === 'Enter'){ const b = $('acts').querySelector('.primary'); if (b){ e.preventDefault(); b.click(); } }
});
// =====================================================================
//  UI-HILFEN
// =====================================================================
function msg(t){ $('msg').innerHTML = t || ''; }
let actRes = null;
function acts(list){
  const box = $('acts'); box.innerHTML = '';
  if (actRes){ const r = actRes; actRes = null; }
  return new Promise(res => {
    if (!list.length) return;
    actRes = res;
    list.forEach(b => { const e = document.createElement('button'); e.className = 'h-btn ' + (b.primary ? 'primary' : ''); e.innerHTML = b.l; e.disabled = !!b.dis; e.onclick = () => { box.innerHTML = ''; actRes = null; res(b.v); }; box.appendChild(e); });
  });
}
function log(h, p){ const d = document.createElement('div'); d.innerHTML = h; if (p) d.style.setProperty('--lc', p.col); $('log').prepend(d); while ($('log').children.length > 7) $('log').lastChild.remove(); }
function modal(title, html, {wide} = {}){
  const ov = document.createElement('div'); ov.className = 'h-overlay';
  ov.innerHTML = `<div class="h-dialog center" style="${wide ? 'width:min(820px,100%)' : ''}"><h2></h2><div class="h-dbody">${html}</div><div class="h-row"></div></div>`;
  ov.querySelector('h2').textContent = title; document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
  return {el:ov, body:ov.querySelector('.h-dbody'), row:ov.querySelector('.h-row'), close(){ ov.classList.remove('on'); setTimeout(() => ov.remove(), 220); }};
}
function ask(title, html, buttons, opts){
  return new Promise(res => { const m = modal(title, html, opts); buttons.forEach(([l, v, c]) => { const b = document.createElement('button'); b.className = 'h-btn ' + (c || ''); b.innerHTML = l; b.onclick = () => { m.close(); res(v); }; m.row.appendChild(b); }); });
}
// Karten-Auswahl (Berufe, Häuser, Gabelungen)
function chooseCards(p, title, cards, aiIdx, sub){
  if (isAI(p)) return pause(900).then(() => aiIdx);
  return new Promise(res => {
    const m = modal(who(p) + title, (sub ? `<p>${sub}</p>` : '') + `<div class="lcards">${cards.map((c, k) => `<button class="lcard ${c.dis ? 'dis' : ''}" data-k="${k}" style="--c:${c.c || '#7a5cff'}"><span class="kn">${k + 1}</span><div class="top"><span class="e">${c.e}</span><b>${esc(c.t)}</b></div><div class="bd">${c.big ? `<div class="big">${c.big}</div>` : ''}<div class="sm">${c.s || ''}</div></div></button>`).join('')}</div>`, {wide:cards.length > 2});
    m.body.querySelectorAll('.lcard').forEach(b => b.onclick = () => { const k = +b.dataset.k; if (cards[k].dis) return; m.close(); Hub.sfx('click'); res(k); });
  });
}
function showEvent(p, ev, amount, kind){
  const col = kind === 'uni' ? '#b04a3a' : amount > 0 ? '#2fbf71' : amount < 0 ? '#e8343a' : '#ff7ab8';
  const html = `<div class="evcard" style="--c:${col}"><div class="top"><div class="e">${ev.e}</div><b>${kind === 'uni' ? 'UNI-LEBEN' : 'EREIGNIS'}</b></div><p>${esc(ev.t)}</p><div class="amt ${amount > 0 ? 'p' : amount < 0 ? 'n' : ''}">${amount ? (amount > 0 ? '+' : '') + K(amount) : ''}${ev.life ? ` ${amount ? '·' : ''} +${ev.life} ⭐` : ''}${ev.raise ? ` Gehalt ${ev.raise > 0 ? '+' : ''}${K(ev.raise)}` : ''}</div></div>`;
  if (isAI(p)){ const m = modal(p.name, html); return pause(1600).then(() => m.close()); }
  return ask('', html, [['Weiter', 0, 'primary']]);
}

// =====================================================================
//  SPIELER-ANZEIGE
// =====================================================================
function renderPlayers(){
  if (!S) return;
  $('plist').innerHTML = S.players.map((p, k) => `<div class="pc ${k === S.cur && !S.over ? 'cur' : ''} ${p.retired ? 'ret' : ''}" style="--pc:${p.col}">
    <div class="r1"><div class="av">${p.av}</div><div><div class="nm">${esc(p.name)}${p.retired ? ' 🌴' : ''}</div><div class="jb">${p.job ? `${p.job.e} ${p.job.n} · ${K(p.salary)}` : p.student ? '🎓 Student' : 'noch ohne Beruf'}</div></div>
    <div class="cash">${K(p.cash)}${p.loans ? `<small>Kredit ${K(p.loans * 20000)}</small>` : ''}</div></div>
    <div class="chips"><span>⭐ ${p.life.length}</span>${p.married ? '<span>💍</span>' : ''}${p.kids ? `<span>👶 ${p.kids}</span>` : ''}${p.pets ? `<span>🐶 ${p.pets}</span>` : ''}${p.house ? `<span>${p.house.e} ${p.house.n}</span>` : ''}${p.carIns ? '<span>🚗🛡️</span>' : ''}${p.homeIns ? '<span>🏠🛡️</span>' : ''}${p.stocks.length ? `<span>📈 ${p.stocks.join(',')}</span>` : ''}${p.retired ? `<span>${p.retired === 'villa' ? '🏰 Villa' : '🌾 Landhaus'}</span>` : ''}</div></div>`).join('');
  const me = S.players.find(p => !isAI(p)) || S.players[0];
  bar.set('cash', K(me.cash)); bar.set('job', me.job ? me.job.n : me.student ? 'Student' : '–'); bar.set('life', me.life.length);
}

// =====================================================================
//  GELD & EFFEKTE
// =====================================================================
function settle(p){ while (p.cash < 0){ p.cash += 20000; p.loans++; log(`🏦 <b>${esc(p.name)}</b> nimmt einen Kredit über 20 T auf.`, p); } }
function money(p, a, why){
  if (!a) return;
  p.cash += a; settle(p);
  floatText(p, (a > 0 ? '+' : '') + K(a), a > 0 ? '#167a3a' : '#c4202f');
  if (why) log(`${p.av} <b>${esc(p.name)}</b>: ${why} <b>${a > 0 ? '+' : ''}${K(a)}</b>`, p);
  if (!isAI(p)) Hub.tone(a > 0 ? 990 : 300, .08, 'triangle', .045);
  renderPlayers();
}
function transfer(from, to, a, why){
  if (!to || to === from) return money(from, -a, why);
  from.cash -= a; settle(from); to.cash += a;
  floatText(from, '−' + K(a), '#c4202f'); floatText(to, '+' + K(a), '#167a3a');
  log(`${from.av} <b>${esc(from.name)}</b> zahlt ${K(a)} an <b>${esc(to.name)}</b>${why ? ' – ' + why : ''}.`, from);
  renderPlayers();
}
const perkHolder = (perk, not) => S.players.find(o => o !== not && o.job && o.job.perk === perk);
function addLife(p, n, why){
  for (let k = 0; k < n; k++) p.life.push(S.rules.lifeval === 'fixed' ? 150000 : pick([50000, 100000, 100000, 150000, 150000, 200000, 250000]));
  floatText(p, `+${n} ⭐`, '#ff3d8b');
  if (why) log(`⭐ <b>${esc(p.name)}</b>: ${why} (+${n} Lebensmoment${n > 1 ? 'e' : ''})`, p);
  const inf = p.job && p.job.perk === 'influencer'; if (inf) money(p, 10000 * n, 'Influencer-Bonus');
  if (!isAI(p)) Hub.tone(1320, .12, 'triangle', .045);
  renderPlayers();
}

// =====================================================================
//  FELD-AKTIONEN
// =====================================================================
async function payday(p, landed){
  if (!p.job) return;
  let s = p.salary;
  if (p.job.perk === 'artist'){ const v = isAI(p) ? rnd(1, 10) : await waitWheel(who(p) + 'Künstlerin-Bonus: Dreh das Rad – bei 1 bis 3 gibt es 40 T extra!'); if (v <= 3){ s += 40000; } }
  money(p, s, landed ? 'Zahltag' : 'Zahltag (vorbeigefahren)');
  if (landed){ p.salary += 10000; log(`📈 <b>${esc(p.name)}</b> bekommt eine Gehaltserhöhung (+10 T)!`, p); floatText(p, 'Gehalt +10 T', '#2f6bff'); renderPlayers(); }
  if (!isAI(p) && p.salary >= 150000) Hub.achieve('leben', 'rich', 'Spitzenverdiener', 'Erreiche 150 T Gehalt');
}
async function doEvent(p, uni){
  let ev, guard = 0;
  do { ev = pick(uni ? UNI_EVENTS : EVENTS); guard++; } while (guard < 30 && ev.need && !((ev.need === 'house' && p.house) || (ev.need === 'kids' && p.kids) || (ev.need === 'job' && p.job)));
  let a = (ev.m || 0) * mult();
  if (ev.kids) a = ev.kids * p.kids * mult();
  if (ev.sal) a = Math.round(p.salary * ev.sal);
  let note = '';
  if (ev.tag === 'car' && p.carIns){ note = ' (Autoversicherung zahlt!)'; a = 0; }
  if (ev.tag === 'house' && p.homeIns){ note = ' (Hausratversicherung zahlt!)'; a = 0; }
  await showEvent(p, {...ev, t:ev.t + note}, a, uni ? 'uni' : '');
  if (ev.group === 'photo'){ S.players.forEach(o => addLife(o, 1)); log('📸 Alle bekommen einen Lebensmoment!'); return; }
  if (ev.group === 'party'){ for (const o of S.players) if (o !== p) transfer(o, p, 10000 * mult(), 'Partygeschenk'); return; }
  if (ev.group === 'race'){
    let best = -1, win = [];
    for (const o of S.players){
      const v = isAI(o) || o.retired ? (await pause(250), await spinWheel()) : await waitWheel(`🏁 Seifenkistenrennen: <b style="color:${o.col}">${esc(o.name)}</b> dreht!`);
      floatText(o, `🏁 ${v}`, '#1b2028');
      if (v > best){ best = v; win = [o]; } else if (v === best) win.push(o);
    }
    win.forEach(o => money(o, Math.round(50000 * mult() / win.length), '🏁 gewinnt das Rennen'));
    return;
  }
  if (a < 0 && ev.tag === 'car' && perkHolder('mechanic', p)) transfer(p, perkHolder('mechanic', p), -a, 'Werkstatt');
  else if (a < 0 && ev.tag === 'police' && perkHolder('police', p)) transfer(p, perkHolder('police', p), -a, 'Bußgeld');
  else if (a) money(p, a, ev.t.replace(/[.!]$/, ''));
  if (ev.raise && p.job){ p.salary = Math.max(20000, p.salary + ev.raise); renderPlayers(); }
  if (ev.life) addLife(p, ev.life);
}
async function baby(p, n){
  p.kids += n; addLife(p, n, n > 1 ? 'Zwillinge!' : 'Nachwuchs!');
  const doc = perkHolder('doctor', p); if (doc) transfer(p, doc, 10000 * n, 'Geburtshilfe');
  if (!isAI(p)){ Hub.tone(1046, .2, 'sine', .05); if (n > 1) Hub.achieve('leben', 'twins', 'Doppeltes Glück', 'Bekomme Zwillinge'); if (p.kids >= 4) Hub.achieve('leben', 'family', 'Großfamilie', 'Habe 4 oder mehr Kinder'); }
}
async function landOn(p){
  const sp = SP[p.pos], t = sp.type;
  if (t === 'pay') return payday(p, true);
  if (t === 'life') return addLife(p, 1, 'Ein besonderer Lebensmoment');
  if (t === 'baby') return baby(p, 1);
  if (t === 'twins') return baby(p, 2);
  if (t === 'pet'){ p.pets++; addLife(p, 1, 'Ein Haustier zieht ein'); const vet = perkHolder('vet', p); if (vet) transfer(p, vet, 10000, 'Tierarzt'); else money(p, -5000, 'Tierbedarf'); return; }
  if (t === 'event') return doEvent(p, false);
  if (t === 'uni') return doEvent(p, true);
  if (t === 'tax'){ const a = Math.max(5000, Math.round(p.salary * .3 / 1000) * 1000); return money(p, -a, 'Steuern'); }
  if (t === 'sue') return sue(p);
  if (t === 'stock') return stock(p);
  if (t === 'spin') return betSpin(p);
  if (t === 'insure') return insure(p);
  if (t === 'trip') return trip(p);
  if (t === 'gamble') return gamble(p);
}
async function sue(p){
  const targets = S.players.filter(o => o !== p);
  if (!targets.length) return;
  let tg;
  if (isAI(p)) tg = targets.slice().sort((a, b) => total(b) - total(a))[0];
  else { const k = await chooseCards(p, '⚖️ Wen verklagst du?', targets.map(o => ({e:o.av, t:o.name, big:K(o.cash), s:'muss dir 50 T zahlen', c:o.col})), 0, 'Ein Rechtsstreit! Wähle einen Mitspieler – er muss dir 50 T zahlen.'); tg = targets[k]; }
  transfer(tg, p, 50000 * mult(), 'Klage verloren');
  const law = perkHolder('lawyer'); if (law) money(law, 15000, 'Anwaltshonorar');
}
async function stock(p){
  const free = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => !S.players.some(o => o.stocks.includes(n)));
  const price = p.job && p.job.perk === 'programmer' ? 25000 : 50000;
  if (!free.length) return log('📈 Alle Aktien sind vergriffen.');
  let n = null;
  if (isAI(p)){ const lim = {easy:200000, normal:100000, hard:70000}[p.type]; if (p.cash - price > lim || (p.type === 'easy' && Math.random() < .3)) n = pick(free); await pause(700); }
  else {
    n = await new Promise(res => {
      const m = modal(who(p) + '📈 Aktie kaufen?', `<p>Kaufe eine Aktie für <b>${K(price)}</b>. Immer wenn <b>irgendjemand</b> deine Zahl am Glücksrad dreht, bekommst du <b>10 T</b>!</p><div class="stockgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-n="${k}" ${free.includes(k) ? '' : 'disabled'}>${k}</button>`).join('')}</div>`);
      m.body.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { m.close(); res(+b.dataset.n); });
      const no = document.createElement('button'); no.className = 'h-btn'; no.textContent = 'Nein danke'; no.onclick = () => { m.close(); res(null); }; m.row.appendChild(no);
    });
  }
  if (n == null) return;
  p.stocks.push(n); money(p, -price, `kauft Aktie Nr. ${n}`);
  if (!isAI(p) && p.stocks.length >= 3) Hub.achieve('leben', 'stocks', 'Börsenhai', 'Besitze drei Aktien');
}
async function betSpin(p){
  const others = S.players.filter(o => o !== p);
  if (others.length >= 2) return groupSpin(p, others);
  return soloBet(p);
}
// Alle Spieler setzen auf Zahlen – wer zuerst getroffen wird, gewinnt den Topf
async function groupSpin(p, others){
  const taken = {}, pickNum = async (pl, count) => {
    for (let c = 0; c < count; c++){
      const free = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => !taken[n]);
      let n;
      if (isAI(pl)) n = free[Math.floor(Math.random() * free.length)];
      else n = await new Promise(res => {
        const m = modal(`${pl.av} ${pl.name}: Wähle ${count > 1 ? (c ? 'deine zweite' : 'deine erste') : 'deine'} Zahl`, `<p>🎰 <b>Gruppen-Glücksrad!</b> Jeder setzt 10 T auf eine Zahl – wessen Zahl das Rad zuerst trifft, gewinnt den ganzen Topf + ${K(80000 * mult())} Bonus.</p><div class="stockgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-n="${k}" ${taken[k] ? 'disabled' : ''} style="${taken[k] ? `background:${taken[k].col};opacity:.55` : ''}">${k}</button>`).join('')}</div>`);
        m.body.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { m.close(); res(+b.dataset.n); });
      });
      taken[n] = pl; pl.cash -= 10000; settle(pl);
    }
  };
  msg(`🎰 <b>Gruppen-Glücksrad!</b> ${esc(p.name)} darf zwei Zahlen wählen.`);
  await pickNum(p, 2);
  for (const o of others) await pickNum(o, 1);
  const pot = Object.keys(taken).length * 10000;
  renderPlayers();
  log(`🎰 Gruppen-Glücksrad: ${Object.entries(taken).map(([n, pl]) => `${pl.av}${n}`).join(' · ')}`);
  for (let k = 0; k < 8; k++){
    const v = isAI(p) ? (await pause(300), await spinWheel()) : await waitWheel(`🎰 Topf: ${K(pot)} – ${multiHuman() ? esc(p.name) + ' dreht' : 'dreh'} das Rad!`);
    const w = taken[v];
    if (w){ money(w, pot + 80000 * mult(), `🎰 gewinnt das Gruppen-Glücksrad (Zahl ${v})`); Hub.sfx('ach'); if (!isAI(w)) Hub.achieve('leben', 'bet', 'Volltreffer', 'Gewinne eine Glücksrad-Wette'); return; }
    log(`🎰 ${v} – niemand getroffen, nochmal!`);
  }
  log('🎰 Niemand getroffen – der Topf geht an die Bank.');
}
async function soloBet(p){
  let n = null;
  if (isAI(p)){ const lim = {easy:0, normal:80000, hard:160000}[p.type]; if (p.cash > lim) n = rnd(1, 10); await pause(600); }
  else {
    n = await new Promise(res => {
      const m = modal(who(p) + '🎰 Glücksrad-Wette', `<p>Setze <b>10 T</b> auf eine Zahl. Trifft das Rad <b>genau</b>, gewinnst du <b>${K(120000 * mult())}</b> – ein Nachbarfeld bringt immerhin ${K(20000 * mult())}.</p><div class="stockgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-n="${k}">${k}</button>`).join('')}</div>`);
      m.body.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { m.close(); res(+b.dataset.n); });
      const no = document.createElement('button'); no.className = 'h-btn'; no.textContent = 'Nicht wetten'; no.onclick = () => { m.close(); res(null); }; m.row.appendChild(no);
    });
  }
  if (n == null) return log(`🎰 ${esc(p.name)} wettet nicht.`, p);
  money(p, -10000, `setzt auf die ${n}`);
  const v = isAI(p) ? (await pause(300), await spinWheel()) : await waitWheel(`${multiHuman() ? esc(p.name) + ' hat' : 'Du hast'} auf die ${n} gesetzt – dreh!`);
  if (v === n){ money(p, 120000 * mult(), '🎰 VOLLTREFFER!'); Hub.sfx('ach'); if (!isAI(p)) Hub.achieve('leben', 'bet', 'Volltreffer', 'Gewinne eine Glücksrad-Wette'); }
  else if (Math.abs(v - n) === 1 || Math.abs(v - n) === 9) money(p, 20000 * mult(), 'knapp daneben');
  else log(`🎰 ${esc(p.name)} verliert die Wette (${v}).`, p);
}
async function insure(p){
  const opts = [];
  if (!p.carIns) opts.push({k:'car', e:'🚗', t:'Autoversicherung', big:K(10000), s:'Bezahlt alle Auto-Schäden.', c:'#14c8d8'});
  if (p.house && !p.homeIns) opts.push({k:'home', e:'🏠', t:'Hausversicherung', big:K(Math.round(p.house.p * .1)), s:'Bezahlt alle Schäden am Haus.', c:'#2f6bff'});
  if (!opts.length) return log(`🛡️ ${esc(p.name)} ist bereits rundum versichert.`, p);
  opts.push({k:null, e:'🙅', t:'Keine', s:'Ich verlasse mich aufs Glück.', c:'#8a8f9c'});
  const ai = () => { if (p.type === 'easy') return Math.random() < .5 ? 0 : opts.length - 1; return 0; };
  const k = await chooseCards(p, '🛡️ Versicherung abschließen?', opts, ai());
  const o = opts[k]; if (!o.k) return;
  if (o.k === 'car'){ p.carIns = true; money(p, -10000, 'Autoversicherung'); } else { p.homeIns = true; money(p, -Math.round(p.house.p * .1), 'Hausversicherung'); }
}
const TRIPS = [{e:'🗼', t:'Paris', c:30000, l:1}, {e:'🏝️', t:'Malediven', c:60000, l:2}, {e:'🏔️', t:'Alpen-Trekking', c:20000, l:1}, {e:'🗽', t:'New York', c:45000, l:1}, {e:'🐘', t:'Safari', c:70000, l:2}, {e:'🏯', t:'Japan', c:55000, l:2}];
async function trip(p){
  const t = pick(TRIPS), cost = t.c * mult();
  let go;
  if (isAI(p)) go = p.cash - cost > {easy:0, normal:40000, hard:80000}[p.type];
  else go = await ask(who(p) + '🧳 Reiseangebot', `<div class="evcard" style="--c:#ffb02e"><div class="top"><div class="e">${t.e}</div><b>REISE</b></div><p>${t.t} für ${K(cost)}</p><div class="amt">+${t.l} ⭐</div></div>`, [['Lieber sparen', false], ['Buchen!', true, 'primary']]);
  if (!go) return log(`🧳 ${esc(p.name)} bleibt zu Hause.`, p);
  const pil = perkHolder('pilot', p); if (pil) transfer(p, pil, 10000, 'Flugticket'); money(p, -cost, `Reise nach ${t.t}`);
  addLife(p, t.l, `Urlaub: ${t.t}`);
  if (!isAI(p)) Hub.achieve('leben', 'trip', 'Weltenbummler', 'Unternimm eine Reise');
}
async function gamble(p){
  const v = isAI(p) ? (await pause(400), await spinWheel()) : await waitWheel(who(p) + '🎲 Wett-Feld! 1–3: −50 T · 4–7: nichts · 8–10: +100 T');
  if (v <= 3) money(p, -50000 * mult(), `Wette verloren (${v})`);
  else if (v >= 8){ money(p, 100000 * mult(), `Wette gewonnen (${v})`); if (!isAI(p)) Hub.tone(1320, .2, 'triangle', .05); }
  else log(`🎲 ${esc(p.name)}: ${v} – nichts passiert.`, p);
}
// ---------- Stoppfelder ----------
async function chooseJob(p, list, title){
  const opts = shuffle(list.slice()).slice(0, 3);
  const best = opts.reduce((b, j, i) => j.s + (j.perk ? 8000 : 0) > opts[b].s + (opts[b].perk ? 8000 : 0) ? i : b, 0);
  const k = await chooseCards(p, title, opts.map(j => ({e:j.e, t:j.n, big:K(j.s), s:j.pd || 'Solider Job ohne Besonderheiten.', c:j.c})), p.type === 'easy' ? rnd(0, 2) : best);
  p.job = opts[k]; p.salary = opts[k].s; p.student = false;
  log(`💼 <b>${esc(p.name)}</b> wird ${p.job.n} ${p.job.e} (${K(p.salary)} Gehalt).`, p);
  floatText(p, `${p.job.e} ${p.job.n}`, '#2f6bff'); renderPlayers();
}
async function stopAt(p, t){
  if (t === 'grad'){
    addLife(p, 1, 'Abschluss geschafft! 🎓');
    await chooseJob(p, UJOBS, '🎓 Abschluss! Wähle deinen Beruf');
    if (!isAI(p)) Hub.achieve('leben', 'grad', 'Akademiker', 'Schließe das Studium ab');
  }
  if (t === 'wed' && !p.married){
    p.married = true; p.spouseCol = pick(['#ffb0d8', '#9fd6ff', '#ffe08a', '#c8f0b0']);
    addLife(p, 2, 'Hochzeit! 💒');
    const v = isAI(p) ? (await pause(400), await spinWheel()) : await waitWheel(who(p) + '💒 Hochzeit! Dreh für die Geschenke – alle Gäste zahlen.');
    const each = (v <= 4 ? 10000 : v <= 8 ? 20000 : 30000) * mult();
    for (const o of S.players) if (o !== p) transfer(o, p, each, 'Hochzeitsgeschenk');
    const tea = perkHolder('teacher', p); if (tea) transfer(p, tea, 10000, 'Trauzeuge-Rede');
    if (!isAI(p)) Hub.achieve('leben', 'wed', 'Ja, ich will!', 'Heirate in Lebensweg');
  }
  if (t === 'house' && !p.house){
    const offer = shuffle(HOUSES.slice()).slice(0, 3).sort((a, b) => a.p - b.p);
    const cards = offer.map(h => ({e:h.e, t:h.n, big:K(h.p), s:`Verkaufswert im Ruhestand: ${K(h.lo)} – ${K(h.hi)}`, c:h.c})).concat([{e:'🙅', t:'Lieber mieten', s:'Kein Haus kaufen.', c:'#8a8f9c'}]);
    const ai = () => { const lim = {easy:60000, normal:20000, hard:-80000}[p.type]; let b = 3; offer.forEach((h, i) => { if (p.cash - h.p > lim || (p.type === 'hard' && h.hi - h.p > 100000 && p.cash + 120000 > h.p)) b = i; }); return b; };
    const k = await chooseCards(p, '🏠 Ein eigenes Zuhause?', cards, ai(), `Dein Geld: ${K(p.cash)} – fehlt etwas, nimmst du automatisch einen Kredit auf.`);
    if (k < 3){
      p.house = offer[k]; money(p, -offer[k].p, `kauft ${offer[k].n} ${offer[k].e}`);
      const arc = perkHolder('architect', p); if (arc) transfer(p, arc, 15000, 'Architektenhonorar');
      if (!isAI(p)) Hub.achieve('leben', 'house', 'Eigenheim', 'Kaufe ein Haus in Lebensweg');
      if (p.type === 'hard' || (!isAI(p) ? false : Math.random() < .4)){ if (isAI(p)){ p.homeIns = true; money(p, -Math.round(p.house.p * .1), 'Hausversicherung'); } }
    }
  }
  if (t === 'night' && p.job){
    let want;
    if (isAI(p)) want = p.salary < 85000 && p.cash > (p.type === 'hard' ? 100000 : 160000);
    else want = (await ask(who(p) + '📚 Abendschule', `<p>Für <b>${K(100000)}</b> kannst du dich weiterbilden und einen neuen Beruf mit Hochschulabschluss wählen.</p><p>Dein jetziges Gehalt: <b>${K(p.salary)}</b></p>`, [['Nein danke', false], ['Weiterbilden', true, 'primary']])) === true;
    if (want){ money(p, -100000, 'Abendschule'); await chooseJob(p, UJOBS, '📚 Neuer Beruf'); }
  }
  if (t === 'retire') await retire(p);
}
async function retire(p){
  const order = S.players.filter(o => o.retired).length;
  const bonus = [4, 3, 2, 1][order] || 0;
  const richest = S.players.slice().sort((a, b) => b.cash - a.cash)[0] === p;
  const k = await chooseCards(p, '🌴 Wo verbringst du den Ruhestand?', [
    {e:'🏰', t:'Millionärsvilla', s:'Riskant: Wer hier am Ende das meiste Geld hat, bekommt 4 Lebensmomente extra – alle anderen gehen leer aus.', c:'#c45cff'},
    {e:'🌾', t:'Landhaus', s:'Sicher: Jeder hier bekommt 1 Lebensmoment.', c:'#2fbf71'}], richest || (p.type === 'hard' && Math.random() < .5) ? 0 : 1);
  p.retired = k === 0 ? 'villa' : 'land';
  log(`🌴 <b>${esc(p.name)}</b> geht als ${order + 1}. in den Ruhestand (${p.retired === 'villa' ? 'Millionärsvilla' : 'Landhaus'}).`, p);
  if (bonus) addLife(p, bonus, `Ruhestand als ${order + 1}.`);
  if (p.retired === 'land') addLife(p, 1, 'Landleben');
  if (p.house){
    const v = isAI(p) ? (await pause(300), await spinWheel()) : await waitWheel(`${who(p)}Verkaufe ${multiHuman() ? 'das' : 'dein'} ${p.house.n} – dreh das Rad (1–5: niedrig, 6–10: hoch)!`);
    const val = v <= 5 ? p.house.lo : p.house.hi; money(p, val, `verkauft ${p.house.n}`); p.soldHouse = val; p.house = null;
  }
  if (p.loans){ const pay = p.loans * 25000; p.cash -= pay; log(`🏦 <b>${esc(p.name)}</b> zahlt alle Kredite zurück (−${K(pay)}).`, p); p.loans = 0; if (p.cash < 0){ p.loans = Math.ceil(-p.cash / 25000); p.cash += p.loans * 25000; } }
  renderPlayers();
}

// =====================================================================
//  BEWEGUNG
// =====================================================================
function pathBetween(a, b){
  const A = SP[a], B = SP[b];
  const pts = [];
  const pushSeg = (segK, s0, s1) => { const seg = SEGS[segK]; const n = Math.max(2, Math.ceil(Math.abs(s1 - s0) / 12)); for (let k = 0; k <= n; k++){ const [x, y, ang] = atLen(seg, s0 + (s1 - s0) * k / n); pts.push({x, y, ang}); } };
  if (A.seg && A.seg === B.seg) pushSeg(A.seg, A.s, B.s);
  else {
    if (A.seg) pushSeg(A.seg, A.s, SEGS[A.seg].len); else pts.push({x:A.x, y:A.y, ang:A.ang});
    pushSeg(B.seg, 0, B.s);
  }
  return pts;
}
async function animateMove(p, a, b){
  const pts = pathBetween(a, b), dur = 360 / curSpeed();
  const t0 = performance.now();
  await new Promise(res => { const f = now => { const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; const i = Math.min(pts.length - 1, Math.floor(e * (pts.length - 1))); p.anim = pts[i]; if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  p.anim = null; p.pos = b;
  Hub.tone(520 + Math.random() * 60, .03, 'triangle', .025);
}
async function chooseFork(p, key){
  const fk = FORKS[key];
  S.forkHint = fk.opts.map(o => FIRST[o.seg]);
  let ai = 0;
  if (key === 'start') ai = Math.random() < {easy:.5, normal:.6, hard:.75}[p.type] ? 0 : 1;
  if (key === 'stadt') ai = Math.random() < (p.cash > 150000 ? .55 : .4) ? 1 : 0;
  if (key === 'seen'){ const lead = Math.max(...S.players.map(total)); ai = (total(p) < lead - 150000 || (p.type === 'easy' && Math.random() < .5)) ? 1 : 0; }
  const k = await chooseCards(p, fk.title, fk.opts.map(o => ({e:o.e, t:o.t, s:o.s, c:o.c})), ai);
  S.forkHint = null;
  return fk.opts[k].seg;
}
async function move(p, steps, g){
  for (let k = 0; k < steps; k++){
    const sp = SP[p.pos];
    let nxt = sp.next[0];
    if (!sp.next.length) break;
    if (p.pos === 0 && p.startSeg) nxt = FIRST[p.startSeg];
    else if (sp.next.length > 1){ const seg = await chooseFork(p, forkKey(p.pos)); if (g !== gen) return null; nxt = FIRST[seg]; }
    await animateMove(p, p.pos, nxt); if (g !== gen) return null;
    const t = SP[nxt].type;
    const mustStop = STOPS.has(t) && !(t === 'grad' && !p.student) && !(t === 'wed' && p.married) && !(t === 'house' && p.house) && !(t === 'night' && !p.job);
    if (mustStop) return t;
    if (t === 'pay' && k < steps - 1) await payday(p, false);
    if (t === 'retire') return t;
  }
  return null;
}

// =====================================================================
//  ZUG-ABLAUF
// =====================================================================
function turnBanner(p){
  return new Promise(res => {
    const b = document.createElement('div'); b.className = 'tbanner'; b.style.setProperty('--pc', p.col);
    b.innerHTML = `<div class="tb-in"><span class="tb-av">${p.av}</span><div><small>${p.job ? p.job.e + ' ' + esc(p.job.n) : p.student ? '🎓 Student' : 'Lebensweg'}</small><b>${esc(p.name)}</b><span>ist dran!</span></div></div>`;
    document.body.appendChild(b); Hub.tone(523, .1, 'triangle', .05); Hub.tone(784, .14, 'triangle', .05, .1);
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 350); }, 1300);
  });
}
async function turn(p, g){
  renderPlayers(); cam.free = false; syncTools();
  if (!isAI(p) && multiHuman()) await turnBanner(p);
  msg(`${p.av} <b>${esc(p.name)}</b> ist dran`);
  save();
  if (p.pos === 0 && !p.started){
    p.started = true;
    const seg = await chooseFork(p, 'start'); if (g !== gen) return;
    p.startSeg = seg;
    if (seg === 'studium'){ p.student = true; p.loans += 5; log(`🎓 <b>${esc(p.name)}</b> beginnt ein Studium (100 T Studienkredit).`, p); renderPlayers(); }
    else await chooseJob(p, JOBS, '💼 Wähle deinen ersten Job');
    if (g !== gen) return;
  }
  let v;
  if (isAI(p) && p.loans){ const keep = {easy:250000, normal:120000, hard:80000}[p.type]; let n = 0; while (p.loans && p.cash - 25000 > keep){ p.cash -= 25000; p.loans--; n++; } if (n){ log(`🏦 <b>${esc(p.name)}</b> tilgt ${n} Kredit${n > 1 ? 'e' : ''}.`, p); renderPlayers(); } }
  if (isAI(p)){ await pause(500); v = await spinWheel(); }
  else {
    for (;;){
      const extra = p.loans && p.cash >= 25000 ? [{l:'🏦 Kredit tilgen (25 T)', v:'loan'}] : [];
      const r = await waitWheel(multiHuman() ? `${p.av} <b style="color:${p.col}">${esc(p.name)}</b> ist dran – Leertaste oder Rad anklicken!` : `${p.av} Du bist dran – dreh am Glücksrad!`, extra);
      if (g !== gen) return;
      if (typeof r === 'number'){ v = r; break; }
      if (r.act === 'loan'){ p.cash -= 25000; p.loans--; log(`🏦 <b>${esc(p.name)}</b> tilgt einen Kredit.`, p); renderPlayers(); }
    }
  }
  if (g !== gen) return;
  msg(`${p.av} <b>${esc(p.name)}</b> dreht eine <b>${v}</b>`);
  log(`🎡 <b>${esc(p.name)}</b> dreht eine ${v}.`, p);
  const stop = await move(p, v, g); if (g !== gen) return;
  renderPlayers();
  if (stop) await stopAt(p, stop);
  else await landOn(p);
  if (g !== gen) return;
  renderPlayers();
  await pause(isAI(p) ? 600 : 300);
}
async function loop(){
  const g = ++gen;
  while (S && !S.over && g === gen){
    if (S.players.every(p => p.retired)) return finish();
    const p = S.players[S.cur];
    if (!p.retired) await turn(p, g);
    if (g !== gen) return;
    if (S.players.every(p => p.retired)) return finish();
    do { S.cur = (S.cur + 1) % S.players.length; } while (S.players[S.cur].retired);
  }
}
async function finish(){
  S.over = true; localStorage.removeItem('leben2_save'); acts([]); msg('');
  // Villa-Bonus
  const villa = S.players.filter(p => p.retired === 'villa');
  if (villa.length){ const top = villa.slice().sort((a, b) => b.cash - a.cash)[0]; addLife(top, 4, 'Reichster in der Millionärsvilla'); }
  renderPlayers(); cam.over = true; syncTools();
  const rank = S.players.slice().sort((a, b) => total(b) - total(a));
  const win = rank[0], hs = S.players.filter(p => !isAI(p));
  if (!isAI(win)){ Hub.sfx('ach'); if (hs.length === 1) Hub.achieve('leben', 'win', 'Ein erfülltes Leben', 'Gewinne eine Partie Lebensweg'); }
  else Hub.sfx('ok');
  if (hs.length) Hub.score('leben', Math.round(total(hs[0]) / 1000), {label:'Vermögen (T)', silent:true});
  const m = modal(!isAI(win) ? `🏆 ${win.name} hat das beste Leben!` : `${win.name} gewinnt`, `<p>Alle sind im Ruhestand – jetzt werden die Lebensmomente aufgedeckt!</p>
    <div class="endrank">${rank.map((p, k) => `<div style="border-left:5px solid ${p.col}"><span style="font-size:22px">${['🥇', '🥈', '🥉'][k] || (k + 1) + '.'}</span><span style="font-size:24px">${p.av}</span><span><b style="margin:0;font-size:15px">${esc(p.name)}</b><br><small>Geld ${K(p.cash)} · ⭐ ${p.life.length} = ${K(lifeSum(p))}${p.loans ? ` · Kredite −${K(p.loans * 25000)}` : ''} · ${p.retired === 'villa' ? '🏰' : '🌾'}</small></span><b>${K(total(p))}</b></div>`).join('')}</div>`, {wide:true});
  [['Zur Spielhalle', 'home', ''], ['Nochmal leben', 'new', 'primary']].forEach(([l, v, c]) => { const b = document.createElement('button'); b.className = 'h-btn ' + c; b.textContent = l; b.onclick = () => { m.close(); if (v === 'home') location.href = '../Launcher.html'; else openLobby(); }; m.row.appendChild(b); });
}

// =====================================================================
//  SPEICHERN / START
// =====================================================================
function save(){ if (S && !S.over){ const c = {...S, forkHint:null, players:S.players.map(p => ({...p, anim:null}))}; Hub.write('leben2_save', c); } }
function start(state){
  S = state; $('lobby').classList.add('hide'); $('log').innerHTML = '';
  cam.over = false; cam.free = false; const p = S.players[S.cur]; cam.x = cam.tx = SP[p.pos].x; cam.y = cam.ty = SP[p.pos].y; cam.z = cam.tz = .2; cam.tz = .9;
  renderPlayers(); syncTools(); Hub.sfx('launch');
  loop();
}
function newGame(){
  const seats = LB.seats.filter(s => s.on);
  if (seats.length < 2) return Hub.toast('Zu wenig Spieler', 'Mindestens zwei Plätze müssen besetzt sein.', 'alert');
  const players = seats.map((s, k) => ({id:k, name:(s.name || 'Spieler').slice(0, 16), type:s.type, av:AVATARS[s.av], col:CARCOL[s.col], pegCol:shade(CARCOL[s.col], .55),
    cash:LB.rules.start, loans:0, pos:0, started:false, job:null, salary:0, student:false, married:false, spouseCol:null, kids:0, pets:0, house:null, carIns:false, homeIns:false, stocks:[], life:[], retired:false}));
  shuffle(players);
  start({players, cur:0, rules:{...LB.rules, crazy:LB.rules.events === 'crazy'}, over:false, forkHint:null});
  log('🏁 Das Leben beginnt! Reihenfolge: ' + S.players.map(p => p.av).join(' → '));
}
function carPreview(cvs, col, av){ const c = cvs.getContext('2d'); c.clearRect(0, 0, cvs.width, cvs.height); drawCar(c, 110, 62, 0, col, [shade(col, .55)], 2); c.font = '28px "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(av, 200, 30); }
function openLobby(){
  gen++; S = null; acts([]); msg('');
  const L = $('lobby'); L.classList.remove('hide');
  const hasSave = !!Hub.read('leben2_save', null);
  const rule = (k, label, opts) => `<div class="rule"><span>${label}</span><select data-r="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(LB.rules[k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  L.innerHTML = `<div class="lb"><h1>LEBENSWEG</h1><div class="sub">Studium oder Job? Familie oder Abenteuer? Villa oder Landhaus? – Das Spiel des Lebens für 2–6 Spieler.</div>
    <div class="sec"><h3 style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">Spieler (Auto anklicken = Farbe wechseln)<button class="h-btn sm primary" id="lbParty">👥 Partyrunde übernehmen (${Hub.party.active().map(pp => esc(pp.name)).join(', ') || 'niemand'})</button></h3><div class="seats">${LB.seats.map((s, k) => `<div class="seat ${s.on ? '' : 'off'}" data-k="${k}"><canvas width="220" height="124" data-a="col"></canvas>
      <div class="avs">${AVATARS.map((a, i) => `<button data-a="av" data-i="${i}" class="${i === s.av ? 'on' : ''}">${a}</button>`).join('')}</div>
      <input data-a="name" value="${esc(s.name)}" maxlength="16">
      <select data-a="type"><option value="off" ${!s.on ? 'selected' : ''}>— frei —</option><option value="human" ${s.on && s.type === 'human' ? 'selected' : ''}>👤 Mensch</option><option value="easy" ${s.on && s.type === 'easy' ? 'selected' : ''}>🤖 KI leicht</option><option value="normal" ${s.on && s.type === 'normal' ? 'selected' : ''}>🤖 KI normal</option><option value="hard" ${s.on && s.type === 'hard' ? 'selected' : ''}>🤖 KI schwer</option></select></div>`).join('')}</div></div>
    <div class="sec"><h3>Regeln</h3><div class="rules">
      ${rule('start', '💰 Startgeld', [[10000, '10 T (Standard)'], [50000, '50 T'], [100000, '100 T']])}
      ${rule('lifeval', '⭐ Wert der Lebensmomente', [['random', 'Zufällig 50–250 T'], ['fixed', 'Fest 150 T']])}
      ${rule('events', '🎢 Ereignisse', [['normal', 'Normal'], ['crazy', 'Verrückt (doppelte Beträge)']])}
    </div></div>
    <div class="go">${hasSave ? '<button class="h-btn lg" id="lbResume" style="background:#fff;color:#1b2028">▶ Fortsetzen</button>' : ''}<button class="h-btn primary lg" id="lbStart">Leben starten</button></div></div>`;
  const persist = () => Hub.write('leben2_lobby', LB);
  L.querySelectorAll('.seat').forEach(el => {
    const k = +el.dataset.k, s = LB.seats[k];
    carPreview(el.querySelector('canvas'), CARCOL[s.col], AVATARS[s.av]);
    el.querySelector('canvas').onclick = () => { const used = LB.seats.filter((o, j) => j !== k && o.on).map(o => o.col); let c = s.col; do { c = (c + 1) % CARCOL.length; } while (used.includes(c) && c !== s.col); s.col = c; persist(); openLobby(); };
    el.querySelectorAll('[data-a=av]').forEach(b => b.onclick = () => { s.av = +b.dataset.i; persist(); openLobby(); });
    el.querySelector('[data-a=name]').oninput = e => { s.name = e.target.value; persist(); };
    el.querySelector('[data-a=type]').onchange = e => { const v = e.target.value; if (v === 'off') s.on = false; else { s.on = true; s.type = v; if (v === 'human' && AINAMES.includes(s.name)) s.name = Hub.settings.name || 'Du'; if (v !== 'human' && !AINAMES.includes(s.name)) s.name = AINAMES.find(n => !LB.seats.some(o => o.on && o.name === n)) || AINAMES[k]; } persist(); openLobby(); };
  });
  L.querySelectorAll('[data-r]').forEach(sel => sel.onchange = e => { const v = e.target.value; LB.rules[sel.dataset.r] = isNaN(+v) ? v : +v; persist(); });
  $('lbStart').onclick = newGame;
  $('lbParty').onclick = () => { if (partySeats()){ Hub.sfx('ok'); openLobby(); } else Hub.toast('Partyrunde leer', 'Lege im Partyraum fest, wer dabei ist.', 'user'); };
  if ($('lbResume')) $('lbResume').onclick = () => { const st = Hub.read('leben2_save', null); if (st) start(st); };
}
bar.on('help', () => ask('Lebensweg – Regeln', `<p>Drehe am <b>Glücksrad</b> (1–10) und fahre mit deinem Auto durchs Leben. An <b style="color:#e8343a">roten Stoppfeldern</b> musst du anhalten: Abschluss, Hochzeit, Hauskauf, Abendschule und Ruhestand.</p>
  <p>An <b>Abzweigungen</b> wählst du deinen Weg: Studium oder Job, Familie oder Abenteuer, sicher oder riskant.</p>
  <p><b style="color:#2fbf71">💰 Zahltag</b>: Vorbeifahren = Gehalt. Genau draufkommen = Gehalt <b>plus Gehaltserhöhung</b>. <b style="color:#ff7ab8">⭐ Lebensmomente</b> sind am Ende 50–250 T wert. Kinder, Haustiere, Hochzeit und Reisen bringen welche.</p>
  <p><b>📈 Aktien</b>: Dreht irgendwer deine Zahl, bekommst du 10 T. <b>🛡️ Versicherungen</b> schützen vor Schäden. <b>⚖️ Klagen</b> bringen 50 T vom Mitspieler. Viele <b>Berufe</b> haben Spezialfähigkeiten!</p>
  <p>Fehlt Geld, gibt es automatisch einen <b>Kredit</b> (20 T, Rückzahlung 25 T). Im Ruhestand wählst du zwischen <b>Millionärsvilla</b> (riskant) und <b>Landhaus</b> (sicher). Wer am Ende das meiste Vermögen hat, gewinnt!</p>
  <p style="font-size:13px;color:var(--text-2)">Karte ziehen = verschieben, Mausrad = zoomen. Oben rechts: Übersicht, Kamera folgen, Tempo.</p>`, [['Los geht’s', 0, 'primary']], {wide:true}));

resize(); buildWorld(); drawWheel(); syncTools();
cam.x = cam.tx = WW / 2; cam.y = cam.ty = WH / 2; cam.z = cam.tz = Math.min(W / WW, H / WH);
requestAnimationFrame(frame);
openLobby();
window.__leben = {get S(){ return S; }, SP, SEGS, total, spinWheel, cam};
})();
