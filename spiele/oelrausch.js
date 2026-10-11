/* =====================================================================
   ÖLRAUSCH – Spiellogik und Grafik
   ===================================================================== */
Hub.init('oel');
const hbar = Hub.bar({id:'oel', title:'Ölrausch', actions:['help', 'sound', 'full']});
hbar.on('help', () => openHow());
// Steuer-Elemente in die (sonst leere) Titelleiste verschieben, damit das HUD einzeilig bleibt
{ const act = hbar.el.querySelector('.h-actions'), grow = hbar.el.querySelector('.h-grow');
  ['menuBtn', 'saloonBtn'].forEach(id => document.getElementById(id).classList.add('h-btn', 'sm', 'ghost'));
  for (const id of ['sellSeg', 'speedSeg']) hbar.el.insertBefore(document.getElementById(id), act);
  const nav = document.getElementById('menuBtn').parentNode; nav.classList.add('navseg'); hbar.el.insertBefore(nav, grow); }
const $ = id => document.getElementById(id);
const I = Hub.icon;
document.querySelectorAll('[data-i]').forEach(e => e.outerHTML = I(e.dataset.i));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmt = n => Math.round(n).toLocaleString('de-DE');
const eur = n => fmt(n) + ' €';
function mulberry(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

// ---------- Welt ----------
const CELL = 8, COLS = 360, ROWS = 64;
const WORLD_W = COLS * CELL, UG_H = ROWS * CELL, SURF_Y = 200, WORLD_H = SURF_Y + UG_H;
const FACT_W = 240, PLOT_W = 200, NPLOTS = 12, TOWN_PLOT = 6;
const plotX0 = i => FACT_W + i * PLOT_W;
const TOWN_X = plotX0(TOWN_PLOT) + PLOT_W / 2;
const DOCK_L = FACT_W - 46, DOCK_R = WORLD_W - FACT_W + 46;
const YEAR_LEN = 240;
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const OIL_PER_CELL = 1.25, LOAD_RATE = 7;
const COST = {rig:900, wagon:700, dowser:250, scan:450, mole:350, pipe:4, tank:400, repair:120};
const idx = (x, y) => y * COLS + x;
const cellX = i => (i % COLS) * CELL + CELL / 2;
const cellY = i => SURF_Y + Math.floor(i / COLS) * CELL + CELL / 2;
function lineCells(x0, y0, x1, y1){
  const out = [], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0, guard = 0;
  while (guard++ < 2000){
    if (!(x === x0 && y === y0) && y >= 0 && y < ROWS && x >= 0 && x < COLS) out.push(idx(x, y));
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy){ err -= dy; x += sx; }
    if (e2 < dx){ err += dx; y += sy; }
  }
  return out;
}

// ---------- Städte ----------
const TOWNS = [
  {name:'Ölhausen',        x:120, y:560, txt:'Ein verschlafenes Nest mit flachen Ölquellen – perfekt zum Lernen.'},
  {name:'Teerbach',        x:230, y:470, txt:'Ein zweiter Ölbaron hat sich niedergelassen. Die Jagd beginnt.'},
  {name:'Pumpendorf',      x:360, y:540, txt:'Der Boden ist voller Felsen. Plane deine Rohre genau.', mod:'rocky'},
  {name:'Schwarzgold City',x:450, y:420, txt:'Tief unten warten riesige Ölblasen auf mutige Bohrer.', mod:'deep'},
  {name:'Bohrlingen',      x:560, y:500, txt:'Drei Rivalen, viel Land zu verteilen – sei schnell bei den Auktionen!'},
  {name:'Rauchtal',        x:640, y:380, txt:'Achtung: überall Gasblasen. Scannen ist Pflicht.', mod:'gassy'},
  {name:'Gasheim',         x:760, y:460, txt:'Die Raffinerien zahlen hier besonders gut.', mod:'boom'},
  {name:'Petrolia',        x:820, y:330, txt:'Ein Ölfeld wie aus dem Bilderbuch – aber die Konkurrenz ist gnadenlos.', mod:'rich'},
  {name:'Fassingen am See',x:700, y:240, txt:'Felsig, gasig und tief. Nur Profis kommen hier durch.', mod:'hard'},
  {name:'Goldgrube',       x:860, y:150, txt:'Die legendäre letzte Stadt. Wer hier gewinnt, ist der König des Öls.', mod:'rich'},
];
function townCfg(n){
  const base = TOWNS[n % TOWNS.length], loop = Math.floor(n / TOWNS.length);
  const c = {n, name: base.name + (loop ? ' ' + ['II','III','IV','V','VI','VII','VIII','IX'][Math.min(7, loop - 1)] : ''), txt:base.txt, mod:base.mod || '',
    oil:16 + Math.min(10, n), oilSize:Math.max(.75, 1 - n * .025), gas:Math.min(14, 2 + n), rock:Math.min(70, 18 + n * 5), minDepth:Math.min(24, 7 + n * 1.6),
    rivals:n === 0 ? 1 : n < 4 ? 2 : 3, skill:Math.min(1.45, .5 + n * .09), base:40 + n * 5, goal:Math.round(8000 * Math.pow(1.33, n) / 500) * 500, plotPrice:1100 + n * 380};
  if (c.mod === 'rocky') c.rock *= 1.6;
  if (c.mod === 'deep'){ c.minDepth += 10; c.oilSize *= 1.25; }
  if (c.mod === 'gassy') c.gas *= 2;
  if (c.mod === 'boom') c.base *= 1.25;
  if (c.mod === 'rich') c.oil = Math.round(c.oil * 1.3);
  if (c.mod === 'hard'){ c.rock *= 1.4; c.gas *= 1.5; c.minDepth += 6; }
  c.rock = Math.round(c.rock); c.gas = Math.round(c.gas);
  return c;
}
const MODTXT = {rocky:'Viele Felsen', deep:'Tiefe Quellen', gassy:'Gasfelder', boom:'Hohe Preise', rich:'Reiches Ölfeld', hard:'Extrem schwierig', '':'Ausgewogen'};
const RIVALS = [
  {id:'R1', name:'Schwarzgold AG', color:'#ff5d6c'},
  {id:'R2', name:'Petro-Brüder',   color:'#5aa9ff'},
  {id:'R3', name:'Gier & Söhne',   color:'#c084fc'},
];
const PLAYER_COLOR = '#3fd28b';

// ---------- Speicherstand ----------
const SAVE_KEY = 'oelrausch_v1';
const save = Object.assign({money:5000, up:{}, unlocked:0, stars:{}, best:{}, years:0, tut:false}, Hub.read(SAVE_KEY, {}));
const writeSave = () => Hub.write(SAVE_KEY, save);
const UPS = [
  {id:'horse',   icon:'zap',      name:'Schnellere Pferde',     max:5, cost:1500, desc:l => `Wagen fahren ${20 * l} % schneller`},
  {id:'cart',    icon:'folder',   name:'Größere Wagen',         max:5, cost:1800, desc:l => `Wagen laden ${40 * l} % mehr`},
  {id:'drill',   icon:'target',   name:'Turbo-Bohrkopf',        max:5, cost:1200, desc:l => `Bohren ${35 * l} % schneller`},
  {id:'pipe',    icon:'list',     name:'Billige Rohre',         max:4, cost:1400, desc:l => `Rohre ${15 * l} % günstiger`},
  {id:'pump',    icon:'flame',    name:'Stärkere Pumpen',       max:5, cost:2400, desc:l => `Pumpen ${30 * l} % schneller`},
  {id:'tank',    icon:'cpu',      name:'Größere Tanks',         max:4, cost:1400, desc:l => `Bohrturm-Tanks +${50 * l} %`},
  {id:'dowse',   icon:'sparkles', name:'Erfahrene Rutengänger', max:3, cost:1000, desc:l => `Rutengänger finden mehr und tiefer (Stufe ${l})`},
  {id:'scan',    icon:'search',   name:'Besseres Echolot',      max:3, cost:1400, desc:l => `Echolot-Radius +${30 * l} %`},
  {id:'trade',   icon:'coins',    name:'Händlergeschick',       max:3, cost:3800, desc:l => `Verkaufspreise +${10 * l} %`},
  {id:'diamond', icon:'star',     name:'Diamantbohrer',         max:1, cost:7500, desc:() => 'Bohrt langsam durch Felsen'},
  {id:'gas',     icon:'refresh',  name:'Gasventil',             max:1, cost:5500, desc:() => 'Gasblasen explodieren nicht mehr – das Gas wird verkauft'},
  {id:'capital', icon:'crown',    name:'Startkapital',          max:3, cost:3000, desc:l => `Jedes Jahr mit mindestens ${eur(5000 + 1500 * l)} starten`},
];
const upL = id => save.up[id] || 0;
const upCost = u => Math.round(u.cost * Math.pow(1.8, upL(u.id)) / 100) * 100;

// ---------- Sound ----------
const tone = Hub.tone;
let noiseBuf = null;
function noise(dur = .5, vol = .2, freq = 800){
  const a = Hub.audio(); if (!a) return;
  const V = vol * Hub.vol(); if (V < .001) return;
  try {
    if (!noiseBuf){ noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(V, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(); s.stop(a.currentTime + dur);
  } catch(e){}
}
let lastCash = 0, lastDrill = 0;
const SFX = {
  buy(){ tone(440, .08, 'triangle', .05); tone(660, .1, 'triangle', .05, .07); },
  cash(){ const n = performance.now(); if (n - lastCash < 150) return; lastCash = n; tone(1318, .07, 'square', .025); tone(1760, .16, 'square', .025, .07); },
  strike(){ [196, 247, 294, 392, 494].forEach((f, k) => tone(f, .28, 'triangle', .055, k * .08)); noise(.7, .05, 380); },
  boom(){ noise(1.4, .5, 520); tone(90, .7, 'sawtooth', .08, 0, 28); },
  ping(){ tone(1400, .7, 'sine', .05, 0, 300); tone(700, .9, 'sine', .03, .15, 200); },
  drill(){ const n = performance.now(); if (n - lastDrill < 110) return; lastDrill = n; tone(60 + Math.random() * 25, .07, 'square', .01); },
  bad(){ tone(330, .18, 'sawtooth', .035); tone(220, .3, 'sawtooth', .035, .15); },
  good(){ [523, 659, 784].forEach((f, k) => tone(f, .14, 'triangle', .045, k * .08)); },
  click(){ tone(760, .03, 'triangle', .03); },
  fanfare(){ [392, 523, 659, 784, 1047].forEach((f, k) => tone(f, .25, 'triangle', .055, k * .11)); },
};

// =====================================================================
//  ZUSTAND & EBENEN
// =====================================================================
const cv = $('cv'), ctx = cv.getContext('2d');
const groundC = mkCanvas(WORLD_W, UG_H), oilC = mkCanvas(WORLD_W, UG_H), maskC = mkCanvas(WORLD_W, UG_H), visC = mkCanvas(WORLD_W, UG_H);
const gX = groundC.getContext('2d'), oX = oilC.getContext('2d'), mX = maskC.getContext('2d'), vX = visC.getContext('2d');
let G = null, uid = 1, grid, pid, revealed, pockets;
let camX = 0, scale = 1, viewW = 1200, offX = 0;
let oilDirty = true, maskDirty = true, composeT = 0;
const mouse = {sx:0, sy:0, wx:0, wy:0, in:false};
let drag = null, aim = null;   // aim = {rig, from(Zelle|null), parent}

const owner = o => o === 'P' ? G.me : G.rivals.find(r => r.id === o);
const money = o => o === 'P' ? G.money : owner(o).money;
function pay(o, x){ if (money(o) < x) return false; if (o === 'P') G.money -= x; else owner(o).money -= x; return true; }
function gain(o, x){ const w = owner(o); w.earned += x; if (o === 'P'){ G.money += x; G.earned += x; } else w.money += x; }
const pipeCost = o => COST.pipe * (o === 'P' ? 1 - .15 * upL('pipe') : 1);
const drillSpeed = o => o === 'P' ? 7 * (1 + .35 * upL('drill')) : 4.2 * (.7 + .3 * G.cfg.skill);
const pumpRate = o => o === 'P' ? .9 * (1 + .3 * upL('pump')) : .75 + .12 * G.cfg.skill;
const rigCap = r => (r.owner === 'P' ? 30 * (1 + .5 * upL('tank')) : 30) + r.extra;
const wagonCap = o => o === 'P' ? 12 * (1 + .4 * upL('cart')) : 12 * (1 + .1 * G.n);
const wagonSpeed = o => (o === 'P' ? 110 * (1 + .2 * upL('horse')) : 95 * (1 + .04 * G.n)) * (G.rain > 0 ? .55 : 1);
const scanR = () => 11 * (1 + .3 * upL('scan'));

// =====================================================================
//  WELT ERZEUGEN
// =====================================================================
function genWorld(cfg, myPlot){
  const rng = mulberry((Date.now() ^ (cfg.n * 7919)) >>> 0);
  grid = new Uint8Array(COLS * ROWS); pid = new Int16Array(COLS * ROWS).fill(-1); revealed = new Uint8Array(COLS * ROWS);
  pockets = [];
  const blob = (cx, cy, r, st, cb) => {
    const parts = 2 + Math.floor(rng() * 3);
    for (let p = 0; p < parts; p++){
      const ox = cx + (rng() - .5) * r * 1.4, oy = cy + (rng() - .5) * r * .6, pr = r * (.55 + rng() * .45);
      for (let y = Math.floor(oy - pr); y <= oy + pr; y++) for (let x = Math.floor(ox - pr * st); x <= ox + pr * st; x++){
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const dx = (x - ox) / (pr * st), dy = (y - oy) / pr;
        if (dx * dx + dy * dy <= 1) cb(x, y);
      }
    }
  };
  const addPocket = (cx, cy, r, type) => {
    const p = {id:pockets.length, type, cells:[], oil:0, max:0, x0:1e9, x1:-1, y0:1e9, y1:-1, drawn:-1};
    blob(cx, cy, r, type === 'oil' ? 1.75 : 1.3, (x, y) => { const i = idx(x, y); if (grid[i]) return; grid[i] = type === 'oil' ? 2 : 3; pid[i] = p.id; p.cells.push(i); });
    if (p.cells.length < 6){ p.cells.forEach(i => { grid[i] = 0; pid[i] = -1; }); return null; }
    p.cells.sort((a, b) => b - a);
    p.cells.forEach(i => { const x = i % COLS, y = Math.floor(i / COLS); p.x0 = Math.min(p.x0, x); p.x1 = Math.max(p.x1, x); p.y0 = Math.min(p.y0, y); p.y1 = Math.max(p.y1, y); });
    if (type === 'oil') p.max = p.oil = p.cells.length * OIL_PER_CELL * (.8 + rng() * .5);
    pockets.push(p);
    return p;
  };
  const pc = Math.floor((plotX0(myPlot) + PLOT_W / 2) / CELL);
  const first = addPocket(pc + Math.floor((rng() - .5) * 10), 12 + Math.floor(rng() * 6), 4.4, 'oil');
  G.firstPocket = first;
  for (let k = 0; k < cfg.oil; k++){
    const big = rng() < .2;
    addPocket(Math.floor(rng() * COLS), Math.floor(cfg.minDepth + rng() * (ROWS - 4 - cfg.minDepth)), (3 + rng() * 4.2) * cfg.oilSize * (big ? 1.55 : 1), 'oil');
  }
  for (let k = 0; k < cfg.gas; k++) addPocket(Math.floor(rng() * COLS), Math.floor(8 + rng() * (ROWS - 10)), 2.4 + rng() * 2.6, 'gas');
  for (let k = 0; k < cfg.rock; k++) blob(Math.floor(rng() * COLS), Math.floor(5 + rng() * (ROWS - 5)), 1.6 + rng() * 4.2, 1.3, (x, y) => { const i = idx(x, y); if (!grid[i]) grid[i] = 1; });
  drawGround(rng);
  mX.clearRect(0, 0, WORLD_W, UG_H);
  for (let y = 0; y < 3; y++) for (let x = 0; x < COLS; x++) revealed[idx(x, y)] = 1;
  if (first){
    if (cfg.n === 0) first.cells.forEach(i => reveal(i % COLS, Math.floor(i / COLS), 1.8));
    else reveal(Math.round((first.x0 + first.x1) / 2), Math.round((first.y0 + first.y1) / 2), 3);
  }
  oilDirty = maskDirty = true;
}
function drawGround(rng){
  const c = gX;
  const stops = [[0, [150, 104, 62]], [.18, [126, 84, 50]], [.42, [101, 66, 40]], [.7, [78, 49, 30]], [1, [52, 33, 21]]];
  const col = t => { t = clamp(t, 0, 1); let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [a, ca] = stops[k], [b, cb] = stops[k + 1], f = (t - a) / (b - a); return ca.map((v, j) => v + (cb[j] - v) * f); };
  const ph = rng() * 10;
  for (let x = 0; x < WORLD_W; x += 4){
    const wave = Math.sin(x * .005 + ph) * 16 + Math.sin(x * .015 + ph * 2) * 6;
    for (let y = 0; y < UG_H; y += 4){
      const [r, g, b] = col((y + wave) / UG_H), n = (rng() - .5) * 9;
      c.fillStyle = `rgb(${r + n | 0},${g + n | 0},${b + n | 0})`; c.fillRect(x, y, 4, 4);
    }
  }
  for (let k = 0; k < 8; k++){
    const y0 = 34 + k * 62 + rng() * 18;
    c.strokeStyle = `rgba(0,0,0,${.08 + rng() * .08})`; c.lineWidth = 2 + rng() * 3; c.beginPath();
    for (let x = 0; x <= WORLD_W; x += 24) c.lineTo(x, y0 + Math.sin(x * .008 + k) * 9 + Math.sin(x * .03 + k * 3) * 3);
    c.stroke();
  }
  for (let k = 0; k < 1400; k++){
    c.fillStyle = rng() < .5 ? 'rgba(0,0,0,.2)' : 'rgba(255,225,180,.1)';
    c.beginPath(); c.ellipse(rng() * WORLD_W, rng() * UG_H, .8 + rng() * 3, .8 + rng() * 2, rng() * 3, 0, 7); c.fill();
  }
  c.strokeStyle = 'rgba(40,22,10,.45)'; c.lineCap = 'round';
  for (let k = 0; k < 120; k++){
    let x = rng() * WORLD_W, y = 0; c.lineWidth = .8 + rng() * 1.5; c.beginPath(); c.moveTo(x, y);
    for (let s = 0; s < 6; s++){ x += (rng() - .5) * 10; y += 3 + rng() * 6; c.lineTo(x, y); }
    c.stroke();
  }
  c.strokeStyle = 'rgba(235,220,190,.22)'; c.lineWidth = 2.2;
  for (let k = 0; k < 14; k++){
    const x = rng() * WORLD_W, y = 80 + rng() * (UG_H - 100), a = rng() * 3;
    c.save(); c.translate(x, y); c.rotate(a);
    if (rng() < .5){ c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); for (const s of [-9, 9]){ c.beginPath(); c.arc(s, -2, 2, 0, 7); c.arc(s, 2, 2, 0, 7); c.stroke(); } }
    else { c.beginPath(); for (let t = 0; t < 14; t += .3){ const r = t * .7; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); } c.stroke(); }
    c.restore();
  }
  const rocks = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 1) rocks.push(i);
  c.fillStyle = '#2b2a30';
  rocks.forEach(i => { c.beginPath(); c.arc((i % COLS) * CELL + 4, Math.floor(i / COLS) * CELL + 4, CELL * .82, 0, 7); c.fill(); });
  rocks.forEach(i => { const s = 104 + (rng() * 26 | 0); c.fillStyle = `rgb(${s},${s},${s + 8})`; c.beginPath(); c.arc((i % COLS) * CELL + 4, Math.floor(i / COLS) * CELL + 4, CELL * .66, 0, 7); c.fill(); });
  c.fillStyle = 'rgba(255,255,255,.16)';
  rocks.forEach(i => { if (rng() < .5){ c.beginPath(); c.arc((i % COLS) * CELL + 2.5, Math.floor(i / COLS) * CELL + 2.5, 1.6, 0, 7); c.fill(); } });
  const g = c.createLinearGradient(0, 0, 0, 14); g.addColorStop(0, 'rgba(40,24,12,.7)'); g.addColorStop(1, 'rgba(40,24,12,0)');
  c.fillStyle = g; c.fillRect(0, 0, WORLD_W, 14);
}
function reveal(cx, cy, r){
  const R = Math.ceil(r);
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++){
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) revealed[idx(x, y)] = 1;
  }
  const px = (cx + .5) * CELL, py = (cy + .5) * CELL, pr = (r + 1) * CELL;
  const g = mX.createRadialGradient(px, py, 0, px, py, pr);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.75, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  mX.fillStyle = g; mX.beginPath(); mX.arc(px, py, pr, 0, 7); mX.fill();
  maskDirty = true;
}
function redrawOil(){
  oX.clearRect(0, 0, WORLD_W, UG_H);
  const dot = (i, r) => { oX.beginPath(); oX.arc((i % COLS) * CELL + 4, Math.floor(i / COLS) * CELL + 4, r, 0, 7); oX.fill(); };
  for (const p of pockets){
    if (!p.cells.length) continue;
    const n = p.cells.length;
    if (p.type === 'gas'){
      oX.fillStyle = '#4f7a22'; p.cells.forEach(i => dot(i, CELL * .85));
      oX.fillStyle = '#9bdc52'; p.cells.forEach(i => dot(i, CELL * .66));
      oX.fillStyle = 'rgba(230,255,180,.55)';
      for (let k = 0; k < n; k += 5) dot(p.cells[k], 1.6);
      p.drawn = n; continue;
    }
    const filled = Math.ceil(p.oil / p.max * n);
    p.drawn = filled;
    oX.fillStyle = '#1e130b'; for (let k = filled; k < n; k++) dot(p.cells[k], CELL * .8);
    oX.fillStyle = '#06050a'; for (let k = 0; k < filled; k++) dot(p.cells[k], CELL * .82);
    oX.fillStyle = '#121019'; for (let k = 0; k < filled; k++) dot(p.cells[k], CELL * .55);
    if (filled){
      const top = Math.floor(p.cells[filled - 1] / COLS);
      oX.fillStyle = 'rgba(150,150,200,.55)';
      for (let k = 0; k < filled; k++){ const i = p.cells[k]; if (Math.floor(i / COLS) === top) oX.fillRect((i % COLS) * CELL - 1, top * CELL, CELL + 2, 2); }
    }
  }
  oilDirty = false;
}
function compose(){
  vX.globalCompositeOperation = 'source-over';
  vX.clearRect(0, 0, WORLD_W, UG_H);
  vX.drawImage(oilC, 0, 0);
  vX.globalCompositeOperation = 'destination-in';
  vX.drawImage(maskC, 0, 0);
  vX.globalCompositeOperation = 'source-over';
  maskDirty = false;
}

// =====================================================================
//  JAHR STARTEN
// =====================================================================
function startYear(n){
  const cfg = townCfg(n);
  const startMoney = Math.max(save.money, 5000 + 1500 * upL('capital'));
  G = {n, cfg, time:0, started:false, speed:1, money:startMoney, startMoney, earned:0, over:false,
    me:{id:'P', name:'Du', color:PLAYER_COLOR, earned:0},
    rivals:[], plots:[], rigs:[], wagons:[], dowsers:[], moles:[], scans:[], bandits:[], parts:[], floats:[], rings:[],
    sellTarget:'auto', rain:0, nextEvent:35, sel:null, tool:null, tut:(n === 0 && !save.tut) ? 1 : 0, tutT:0,
    market:null, stats:{fass:0, meters:0, trips:0, found:0}};
  for (let i = 0; i < NPLOTS; i++) G.plots.push({i, x0:plotX0(i), x1:plotX0(i) + PLOT_W, owner:i === TOWN_PLOT ? 'town' : null, price:Math.round(cfg.plotPrice * rnd(.8, 1.35) / 50) * 50});
  const myPlot = pick([4, 5, 7, 8]);
  G.plots[myPlot].owner = 'P';
  genWorld(cfg, myPlot);
  for (let k = 0; k < cfg.rivals; k++){
    const r = Object.assign({}, RIVALS[k], {money:3600 + n * 1700, earned:0, think:rnd(2, 5), wagonsMax:2 + Math.min(3, Math.floor(n / 2))});
    G.rivals.push(r);
    const free = G.plots.filter(p => !p.owner && Math.abs(p.i - myPlot) > 1);
    const p = pick(free.length ? free : G.plots.filter(p => !p.owner));
    if (p){ p.owner = r.id; buildRig(r.id, p.x0 + rnd(50, 150), true); }
    if (n >= 3){ const p2 = pick(G.plots.filter(p => !p.owner)); if (p2) p2.owner = r.id; }
    addWagon(r.id, true);
  }
  const mk = () => ({p:cfg.base * rnd(.85, 1.15), ph:rnd(0, 6.3), ph2:rnd(0, 6.3), per:rnd(45, 85), per2:rnd(12, 24), boom:0, hist:[], ht:0});
  G.market = {L:mk(), R:mk()};
  for (let k = 0; k < 60; k++) marketTick(1, true);
  resize();
  camX = clamp(plotX0(myPlot) + PLOT_W / 2 - viewW / 2, 0, maxCam());
  $('townName').textContent = cfg.name;
  $('townLbl').textContent = `Stadt ${n + 1} · Jahr ${save.years + 1}`;
  hideMenu();
  setSpeed(1); setTool(null); aim = null;
  feed(`Willkommen in ${cfg.name}! Ziel: ${eur(cfg.goal)} verdienen.`, 'gold', 'flame', 6000);
  showTut();
  $('wait').classList.add('on');
  renderSel(); updateToolPrices();
}

// =====================================================================
//  OBJEKTE
// =====================================================================
function buildRig(o, x, free){
  if (!free && !pay(o, COST.rig)) return null;
  const r = {id:uid++, owner:o, x, cx:clamp(Math.floor(x / CELL), 0, COLS - 1), tank:0, extra:0, branches:[], leak:null, rate:0, claim:0, anim:0, build:free ? 1 : 0};
  G.rigs.push(r);
  for (let k = 0; k < 18; k++) G.parts.push({x:x + rnd(-18, 18), y:SURF_Y - 2, vx:rnd(-40, 40), vy:rnd(-70, -10), life:1, col:'#b08a5a', s:3});
  if (o === 'P'){
    SFX.buy(); floatText(x, SURF_Y - 100, `−${eur(COST.rig)}`, '#ff8a8a');
    if (!G.started){ G.started = true; $('wait').classList.remove('on'); feed('Das Jahr hat begonnen!', 'gold', 'clock'); }
  }
  return r;
}
function startBranch(rig, fromCell, tx, ty, parent){
  const sx = fromCell == null ? rig.cx : fromCell % COLS, sy = fromCell == null ? -1 : Math.floor(fromCell / COLS);
  const path = lineCells(sx, sy, tx, ty);
  if (!path.length) return null;
  const b = {path, done:0, prog:0, state:'drill', pocket:-1, parent, from:fromCell, gush:0,
    sx: fromCell == null ? rig.x : cellX(fromCell), sy: fromCell == null ? SURF_Y : cellY(fromCell)};
  rig.branches.push(b);
  return b;
}
function removeBranch(rig, b){
  rig.branches = rig.branches.filter(x => x !== b);
  rig.branches.filter(x => x.parent === b).forEach(x => removeBranch(rig, x));
}
function drillStep(rig, b, dt){
  const o = rig.owner, next = b.path[b.done];
  if (next === undefined){ b.state = 'dry'; return; }
  const rock = grid[next] === 1;
  b.prog += dt * drillSpeed(o) / (rock ? 4 : 1);
  if (o === 'P') SFX.drill();
  if (Math.random() < dt * 10) G.parts.push({x:cellX(next), y:cellY(next), vx:rnd(-25, 25), vy:rnd(-25, 5), life:.6, col:'#a07850', s:2});
  while (b.prog >= 1 && b.state === 'drill'){
    const i = b.path[b.done];
    if (i === undefined){ b.state = 'dry'; break; }
    const isRock = grid[i] === 1;
    if (isRock && !(o === 'P' && upL('diamond'))){
      b.state = 'stop'; b.prog = 0;
      if (o === 'P'){ feed('Felsen! Hier kommt der Bohrer nicht durch.', 'bad', 'x'); SFX.bad(); }
      break;
    }
    const cost = pipeCost(o) * (isRock ? 3 : 1);
    if (!pay(o, cost)){ b.state = 'stop'; b.prog = 0; if (o === 'P'){ feed('Kein Geld mehr für Rohre – bohr später vom roten Punkt weiter.', 'bad', 'coins'); SFX.bad(); } break; }
    b.prog -= 1; b.done++;
    if (o === 'P'){ G.stats.meters += 3; reveal(i % COLS, Math.floor(i / COLS), 2.4); }
    if (grid[i] === 2 && pockets[pid[i]].oil > .05){
      b.state = 'pump'; b.pocket = pid[i];
      if (o === 'P'){
        reveal(i % COLS, Math.floor(i / COLS), 5);
        G.stats.found++;
        bigText('ÖL GEFUNDEN!'); SFX.strike(); shake(7);
        for (let k = 0; k < 40; k++) G.parts.push({x:rig.x + rnd(-4, 4), y:SURF_Y - 92, vx:rnd(-70, 70), vy:rnd(-200, -80), life:1.5, col:'#0b0a10', s:4, grav:true});
        Hub.achieve('oel', 'first_oil', 'Schwarzes Gold', 'Finde deine erste Ölquelle');
      }
      break;
    }
    if (grid[i] === 3){ hitGas(rig, b, pid[i], i); break; }
    if (b.done >= b.path.length){ b.state = 'dry'; if (o === 'P') feed('Hier ist kein Öl. Klick auf das Rohr und bohr in eine andere Richtung.', '', 'info'); break; }
  }
}
function hitGas(rig, b, gp, cell){
  const p = pockets[gp];
  const cx = Math.round((p.x0 + p.x1) / 2), cy = Math.round((p.y0 + p.y1) / 2);
  p.cells.forEach(i => { grid[i] = 0; pid[i] = -1; }); p.cells = []; oilDirty = true;
  const ex = cellX(cell), ey = cellY(cell);
  if (rig.owner === 'P') reveal(cx, cy, 5);
  if (rig.owner === 'P' && upL('gas')){
    const bonus = 300 + G.n * 120; gain('P', bonus);
    feed(`Gas sicher abgelassen und verkauft: +${eur(bonus)}`, 'good', 'refresh'); SFX.good(); floatText(ex, ey, `+${eur(bonus)}`, '#9ef0c4');
    b.state = b.done >= b.path.length ? 'dry' : 'drill';
    return;
  }
  for (let k = 0; k < 70; k++){ const a = rnd(0, 6.3), s = rnd(40, 260); G.parts.push({x:ex, y:ey, vx:Math.cos(a) * s, vy:Math.sin(a) * s, life:rnd(.6, 1.4), col:pick(['#ffe066', '#ff9a2a', '#ff4a20', '#555']), s:rnd(3, 7)}); }
  G.rings.push({x:ex, y:ey, t:0, max:90, col:'255,150,40'});
  removeBranch(rig, b);
  if (rig.owner === 'P'){ bigText('KAWUMM!'); feed('Gasexplosion! Das Rohr ist zerstört.', 'bad', 'flame', 5000); SFX.boom(); shake(18); Hub.achieve('oel', 'boom', 'Kawumm!', 'Bohr in eine Gasblase'); }
}
function addWagon(o, free){
  if (!free && !pay(o, COST.wagon)) return null;
  const w = {id:uid++, owner:o, x:TOWN_X + rnd(-30, 30), dir:1, state:'idle', load:0, target:null, claimAmt:0, side:null, t:0, override:null, wheel:0, lane:uid % 3, step:0};
  G.wagons.push(w);
  if (o === 'P'){ SFX.buy(); feed('Neuer Pferdewagen im Einsatz!', 'good', 'check'); if (G.wagons.filter(x => x.owner === 'P').length >= 8) Hub.achieve('oel', 'wagons', 'Fuhrunternehmen', 'Besitze 8 Pferdewagen gleichzeitig'); }
  return w;
}

// =====================================================================
//  WAGEN-LOGIK
// =====================================================================
function releaseClaim(w){ if (w.target && w.claimAmt) w.target.claim = Math.max(0, w.target.claim - w.claimAmt); w.claimAmt = 0; }
function pickRig(w){
  const sp = wagonSpeed(w.owner), cap = wagonCap(w.owner);
  let best = null, bs = 0;
  for (const r of G.rigs){
    if (r.owner !== w.owner) continue;
    const dist = Math.abs(r.x - w.x);
    const avail = Math.min(rigCap(r), r.tank + r.rate * dist / sp) - r.claim;
    if (avail < Math.min(3, cap * .3)) continue;
    const s = Math.min(avail, cap - w.load) / (1 + dist / 800);
    if (s > bs){ bs = s; best = r; }
  }
  return best;
}
function pickSide(w){
  const f = w.override || (w.owner === 'P' ? G.sellTarget : 'auto');
  if (f !== 'auto') return f;
  const sL = G.market.L.p * (1 - Math.abs(w.x - DOCK_L) / WORLD_W * .2), sR = G.market.R.p * (1 - Math.abs(w.x - DOCK_R) / WORLD_W * .2);
  return sL >= sR ? 'L' : 'R';
}
function updWagon(w, dt){
  const sp = wagonSpeed(w.owner), cap = wagonCap(w.owner);
  const moveTo = x => {
    const dx = x - w.x;
    if (Math.abs(dx) < 3) return true;
    w.dir = Math.sign(dx); w.moving = true;
    const st = Math.min(Math.abs(dx), sp * dt);
    w.x += w.dir * st; w.wheel += st / 6; w.step += st;
    return false;
  };
  w.moving = false;
  switch (w.state){
    case 'idle': {
      const r = w.load < cap * .95 ? pickRig(w) : null;
      if (r){ w.target = r; w.claimAmt = cap - w.load; r.claim += w.claimAmt; w.state = 'toRig'; }
      else if (w.load > .05){ w.side = pickSide(w); w.state = 'toFactory'; }
      else moveTo(TOWN_X + ((w.id % 7) - 3) * 16);
      break;
    }
    case 'toRig':
      if (!G.rigs.includes(w.target)){ w.claimAmt = 0; w.target = null; w.state = 'idle'; break; }
      if (moveTo(w.target.x + 22)){ w.state = 'loading'; w.t = 0; }
      break;
    case 'loading': {
      const r = w.target;
      if (!G.rigs.includes(r)){ w.claimAmt = 0; w.state = 'idle'; break; }
      const amt = Math.min(LOAD_RATE * dt, cap - w.load, r.tank);
      r.tank -= amt; w.load += amt; w.t += dt;
      if (w.load >= cap - .01 || (r.tank < .05 && w.t > .5 && r.rate < .3)){
        releaseClaim(w); w.target = null; w.t = 0;
        if (w.load >= cap * .6 || !pickRig(w)){ w.side = pickSide(w); w.state = w.load > .05 ? 'toFactory' : 'idle'; } else w.state = 'idle';
      }
      break;
    }
    case 'toFactory':
      if (moveTo(w.side === 'L' ? DOCK_L : DOCK_R)){ w.state = 'selling'; w.t = 0; }
      break;
    case 'selling':
      w.t += dt;
      if (w.t > .8){
        const m = G.market[w.side], bonus = w.owner === 'P' ? 1 + .1 * upL('trade') : 1;
        const rev = w.load * m.p * bonus;
        m.p = Math.max(G.cfg.base * .3, m.p - w.load * G.cfg.base * .0045);
        gain(w.owner, rev);
        if (w.owner === 'P'){ SFX.cash(); G.stats.fass += w.load; G.stats.trips++; floatText(w.x, SURF_Y - 60, `+${eur(rev)}`, '#ffd34d'); }
        else floatText(w.x, SURF_Y - 60, `+${eur(rev)}`, owner(w.owner).color);
        w.load = 0; w.state = 'idle'; w.t = 0; w.override = null;
      }
      break;
  }
}

// =====================================================================
//  MARKT
// =====================================================================
function marketTick(dt, warm){
  const t = warm ? G.market.L.hist.length - 60 : G.time;
  for (const k of ['L', 'R']){
    const m = G.market[k], base = G.cfg.base;
    let target = base * (1 + .32 * Math.sin(t / m.per * 6.283 + m.ph) + .1 * Math.sin(t / m.per2 * 6.283 + m.ph2));
    if (m.boom > 0){ target *= 1.5; m.boom -= dt; }
    m.p += (target - m.p) * Math.min(1, .22 * dt) + (Math.random() - .5) * base * .012 * Math.sqrt(dt * 10);
    m.p = clamp(m.p, base * .3, base * 2.6);
    m.ht += dt;
    if (m.ht >= 1 || warm){ m.ht = 0; m.hist.push(m.p); if (m.hist.length > 60) m.hist.shift(); }
  }
}

// =====================================================================
//  RIVALEN-KI
// =====================================================================
function rivalThink(r){
  const mine = G.rigs.filter(g => g.owner === r.id);
  for (const p of G.plots.filter(p => p.owner === r.id)){
    const here = mine.filter(g => g.x >= p.x0 && g.x < p.x1);
    if (here.length < 2 && r.money > COST.rig * 1.5){
      const x = p.x0 + rnd(30, 170);
      if (G.rigs.every(g => Math.abs(g.x - x) > 46)){ buildRig(r.id, x); return; }
    }
  }
  for (const g of mine){
    if (g.branches.some(b => b.state === 'drill')) continue;
    if (g.branches.filter(b => b.state === 'pump').length >= 2) continue;
    const cands = pockets.filter(p => p.type === 'oil' && p.oil > p.max * .12 && !g.branches.some(b => b.pocket === p.id && b.state === 'pump'))
      .map(p => ({p, d:Math.hypot((p.x0 + p.x1) / 2 - g.cx, (p.y0 + p.y1) / 2)})).sort((a, b) => a.d - b.d).slice(0, 4);
    for (const {p, d} of cands){
      if (d > 32 + 30 * G.cfg.skill) continue;
      let best = null, bd = 1e9;
      for (const i of p.cells){ const dd = Math.hypot(i % COLS - g.cx, Math.floor(i / COLS)); if (dd < bd){ bd = dd; best = i; } }
      const path = lineCells(g.cx, -1, best % COLS, Math.floor(best / COLS));
      let ok = true;
      for (const i of path){ if (grid[i] === 2 && pockets[pid[i]].oil > 0) break; if (grid[i] === 1 || grid[i] === 3){ ok = false; break; } }
      if (ok && r.money > path.length * pipeCost(r.id) * .6){ startBranch(g, null, best % COLS, Math.floor(best / COLS), null); return; }
    }
  }
  const wag = G.wagons.filter(w => w.owner === r.id).length;
  if (wag < r.wagonsMax && r.money > COST.wagon * 2 && mine.some(g => g.tank > 15)){ addWagon(r.id); return; }
  const free = G.plots.filter(p => !p.owner);
  if (free.length && Math.random() < .1 * G.cfg.skill){
    const p = pick(free);
    if (r.money > p.price * 1.6){ r.money -= p.price; p.owner = r.id; feed(`${r.name} hat Grundstück ${p.i + 1} gekauft!`, 'bad', 'flame'); }
  }
}

// =====================================================================
//  EREIGNISSE
// =====================================================================
const myPumpingBranches = () => G.rigs.filter(r => r.owner === 'P' && !r.leak).flatMap(r => r.branches.filter(b => b.state === 'pump' && b.done > 3).map(b => [r, b]));
const EVENTS = [
  {w:3, run(){ const s = pick(['L', 'R']); G.market[s].boom = 30; feed(`Ölknappheit im ${s === 'L' ? 'Westen' : 'Osten'}! Preis dort 30 s lang ×1,5`, 'good', 'chart', 6000); SFX.good(); }},
  {w:2, run(){ G.rain = 30; feed('Unwetter! Die Wagen sind 30 s lang langsamer.', 'bad', 'info', 5000); noise(1.5, .06, 900); }},
  {w:2, ok:() => myPumpingBranches().length > 0, run(){
    const [r, b] = pick(myPumpingBranches()); const k = Math.max(1, Math.floor(b.done * rnd(.3, .8)));
    r.leak = {b, cell:b.path[k - 1]}; feed('Leck in einer Leitung! Klick auf den Tropfen, um es zu reparieren.', 'bad', 'x', 6000); SFX.bad(); }},
  {w:2, ok:() => G.wagons.some(w => w.owner === 'P' && w.load > 1), run(){
    const w = pick(G.wagons.filter(w => w.owner === 'P' && w.load > 1)), side = Math.random() < .5 ? -1 : 1;
    G.bandits.push({x:clamp(w.x + side * 380, 30, WORLD_W - 30), w, state:'chase', t:0, dir:-side});
    feed('Banditen! Klick schnell auf den Reiter, bevor er dein Öl klaut!', 'bad', 'target', 6000); SFX.bad(); }},
  {w:2, run(){
    const ps = pockets.filter(p => p.type === 'oil' && p.oil > 5 && p.cells.some(i => !revealed[i]));
    for (let k = 0; k < 3 && ps.length; k++){ const p = ps.splice(Math.floor(Math.random() * ps.length), 1)[0]; reveal(Math.round((p.x0 + p.x1) / 2), Math.round((p.y0 + p.y1) / 2), 4.5); }
    shake(12); noise(1, .14, 180); feed('Erdbeben! Neue Ölquellen sind sichtbar geworden.', 'good', 'sparkles', 5000); }},
  {w:2, ok:() => myPumpingBranches().length > 0, run(){
    const [r] = pick(myPumpingBranches()); r.branches.filter(b => b.state === 'pump').forEach(b => b.gush = 20);
    bigText('ÖLFONTÄNE!'); feed('Ölfontäne! Ein Bohrturm pumpt 20 s lang dreifach.', 'good', 'flame', 5000); SFX.strike(); }},
  {w:1, run(){ G.market.L.p *= .72; G.market.R.p *= .72; feed('Ölschwemme! Alle Preise sind gefallen.', 'bad', 'chart', 5000); }},
  {w:1, run(){ const g = 200 + G.n * 100; gain('P', g); feed(`Der Bürgermeister schenkt dir ${eur(g)} für die neuen Arbeitsplätze.`, 'good', 'coins', 5000); SFX.cash(); }},
];
function triggerEvent(){
  const pool = EVENTS.filter(e => !e.ok || e.ok());
  let r = Math.random() * pool.reduce((a, e) => a + e.w, 0);
  (pool.find(e => (r -= e.w) < 0) || pool[0]).run();
}

// =====================================================================
//  UPDATE
// =====================================================================
let shakeAmt = 0;
const shake = a => shakeAmt = Math.max(shakeAmt, a);
function update(dt){
  if (G.started) G.time += dt;
  marketTick(dt);
  if (G.rain > 0) G.rain -= dt;
  for (const r of G.rigs){
    r.rate = 0; r.anim += dt;
    if (r.build < 1) r.build = Math.min(1, r.build + dt * 1.6);
    for (const b of [...r.branches]){
      if (b.state === 'drill') drillStep(r, b, dt);
      else if (b.state === 'pump'){
        const p = pockets[b.pocket];
        if (p.oil <= .01){ b.state = 'dry'; if (r.owner === 'P') feed('Eine Ölquelle ist leer gepumpt.', '', 'info'); continue; }
        if (b.gush > 0) b.gush -= dt;
        const room = rigCap(r) - r.tank;
        const amt = Math.min(pumpRate(r.owner) * (b.gush > 0 ? 3 : 1) * dt, p.oil, Math.max(0, room));
        p.oil -= amt; r.tank += amt; r.rate += amt / dt;
        if (Math.ceil(p.oil / p.max * p.cells.length) !== p.drawn) oilDirty = true;
        if (b.gush > 0 && Math.random() < dt * 22) G.parts.push({x:r.x, y:SURF_Y - 94, vx:rnd(-50, 50), vy:rnd(-170, -90), life:1.3, col:'#0b0a10', s:4, grav:true});
      }
    }
    if (r.leak){
      if (!r.branches.includes(r.leak.b)) r.leak = null;
      else { r.tank = Math.max(0, r.tank - .8 * dt); if (Math.random() < dt * 8) G.parts.push({x:cellX(r.leak.cell) + rnd(-3, 3), y:cellY(r.leak.cell), vx:rnd(-8, 8), vy:rnd(5, 25), life:1, col:'#0b0a10', s:3, grav:true}); }
    }
  }
  for (const w of G.wagons) updWagon(w, dt);
  for (const b of G.bandits){
    b.t += dt;
    if (b.state === 'chase'){
      if (!G.wagons.includes(b.w) || b.w.load <= 0){ b.state = 'flee'; continue; }
      const dx = b.w.x - b.x; b.dir = Math.sign(dx) || 1; b.x += b.dir * Math.min(Math.abs(dx), 80 * dt);
      if (Math.abs(dx) < 14){ const lost = b.w.load; b.w.load = 0; b.w.state = 'idle'; b.state = 'flee'; feed(`Die Banditen haben ${fmt(lost)} Fass Öl geklaut!`, 'bad', 'x'); SFX.bad(); }
    } else b.x -= (b.dir || 1) * 170 * dt;
  }
  G.bandits = G.bandits.filter(b => b.x > -80 && b.x < WORLD_W + 80 && b.t < 45);
  for (const d of G.dowsers){
    d.life -= dt; d.x += d.dir * 24 * dt; d.walk += dt;
    if (Math.abs(d.x - d.x0) > 85) d.dir *= -1;
    d.ping -= dt; if (d.found > 0) d.found -= dt;
    if (d.ping <= 0){
      d.ping = 1.3;
      const depth = 26 + 12 * upL('dowse'), cx = Math.floor(d.x / CELL), cands = [];
      for (let y = 3; y < Math.min(ROWS, depth); y++) for (let x = cx - 6; x <= cx + 6; x++){
        if (x < 0 || x >= COLS) continue;
        const i = idx(x, y); if (grid[i] === 2 && pockets[pid[i]].oil > 0 && !revealed[i]) cands.push(i);
      }
      if (cands.length && Math.random() < .5 + .15 * upL('dowse')){
        const i = pick(cands); reveal(i % COLS, Math.floor(i / COLS), 3.6); d.found = 1.6;
        G.rings.push({x:cellX(i), y:cellY(i), t:0, max:40, col:'255,210,120'});
        tone(880, .1, 'sine', .05); tone(1320, .15, 'sine', .05, .1);
      } else reveal(cx + Math.floor(rnd(-5, 6)), Math.floor(rnd(3, depth)), 2);
    }
  }
  G.dowsers = G.dowsers.filter(d => d.life > 0);
  for (const m of G.moles){
    m.life -= dt; m.a += rnd(-2.6, 2.6) * dt;
    const sp = 3.6 * dt, nx = m.x + Math.cos(m.a) * sp, ny = m.y + Math.sin(m.a) * sp;
    const i = idx(clamp(Math.floor(nx), 0, COLS - 1), clamp(Math.floor(ny), 0, ROWS - 1));
    if (nx < 1 || nx > COLS - 2 || ny < 2 || ny > ROWS - 2 || grid[i] === 1) m.a += Math.PI * rnd(.6, 1.4);
    else { m.x = nx; m.y = ny; }
    m.rt -= dt; if (m.rt <= 0){ m.rt = .14; reveal(Math.floor(m.x), Math.floor(m.y), 2.6); }
  }
  G.moles = G.moles.filter(m => m.life > 0);
  for (const s of G.scans){ s.t += dt; if (!s.done && s.t > .7){ s.done = true; reveal(s.cx, s.cy, s.r); } }
  G.scans = G.scans.filter(s => s.t < 1.5);
  if (G.started) for (const r of G.rivals){ r.think -= dt; if (r.think <= 0){ r.think = rnd(3, 7) / G.cfg.skill; rivalThink(r); } }
  if (G.started){ G.nextEvent -= dt; if (G.nextEvent <= 0){ G.nextEvent = rnd(32, 55); triggerEvent(); } }
  for (const p of G.parts){ p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.grav) p.vy += 320 * dt; else p.vy *= .97; }
  G.parts = G.parts.filter(p => p.life > 0);
  if (G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
  for (const f of G.floats){ f.t += dt; f.y -= 28 * dt; }
  G.floats = G.floats.filter(f => f.t < 1.7);
  for (const r of G.rings) r.t += dt;
  G.rings = G.rings.filter(r => r.t < 1);
  if (Math.random() < dt * 4) for (const x of [96, WORLD_W - 96]) G.parts.push({x:x + rnd(-3, 3), y:SURF_Y - 150, vx:rnd(6, 16), vy:rnd(-26, -16), life:3.2, col:'smoke', s:7});
  tutTick(dt);
  if (G.started && G.time >= YEAR_LEN) endYear();
}

// =====================================================================
//  ZEICHNEN
// =====================================================================
const far = [], mid = [];
{ const r = mulberry(42); for (let x = 0; x <= WORLD_W * .5 + 400; x += 50) far.push(SURF_Y - 60 - Math.abs(Math.sin(x * .006)) * 60 - r() * 18);
  for (let x = 0; x <= WORLD_W * .75 + 400; x += 60) mid.push(r() < .25 ? SURF_Y - 46 - r() * 30 : SURF_Y - 18 - r() * 14); }
const clouds = Array.from({length:10}, () => ({x:Math.random() * WORLD_W, y:rnd(20, 100), s:rnd(.7, 1.5), v:rnd(4, 11)}));
function season(){ const m = Math.min(11, Math.floor((G ? G.time : 0) / YEAR_LEN * 12)); return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn'; }
const maxCam = () => Math.max(0, WORLD_W - viewW);
function resize(){
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = Math.max(.5, h / WORLD_H);
  viewW = w / scale;
  offX = viewW > WORLD_W ? (viewW - WORLD_W) / 2 : 0;
  camX = clamp(camX, 0, maxCam());
}
addEventListener('resize', resize);
const SKY = {spring:['#4c9fe0', '#cfe9f7'], summer:['#3a8fd8', '#ffe6b0'], autumn:['#c46a3a', '#ffcf8a'], winter:['#7c9cc0', '#e6eef6']};
function draw(){
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0c0806'; ctx.fillRect(0, 0, W, H);
  if (!G) return;
  const sea = season(), now = performance.now();
  const sx = shakeAmt ? rnd(-shakeAmt, shakeAmt) : 0, sy = shakeAmt ? rnd(-shakeAmt, shakeAmt) : 0;
  shakeAmt = Math.max(0, shakeAmt * .9 - .2);
  const skyH = SURF_Y * scale;
  const [t1, t2] = G.rain > 0 ? ['#4a525c', '#9aa2aa'] : SKY[sea];
  const g = ctx.createLinearGradient(0, 0, 0, skyH); g.addColorStop(0, t1); g.addColorStop(1, t2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, skyH + 2);
  ctx.save(); ctx.translate(sx, sy); ctx.scale(scale, scale); ctx.translate(offX, 0);
  const sunX = viewW * .78, sunY = 58;
  const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 110); sg.addColorStop(0, 'rgba(255,245,200,.85)'); sg.addColorStop(.25, 'rgba(255,230,160,.35)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = sg; ctx.fillRect(sunX - 110, sunY - 110, 220, 220);
  ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(-camX * .5, 0);
  ctx.fillStyle = sea === 'winter' ? '#a8b6c8' : sea === 'autumn' ? '#a8664a' : '#9a7a66'; ctx.globalAlpha = .7;
  ctx.beginPath(); ctx.moveTo(0, SURF_Y); far.forEach((y, k) => ctx.lineTo(k * 50, y)); ctx.lineTo(far.length * 50, SURF_Y); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  ctx.save(); ctx.translate(-camX * .25, 0);
  ctx.fillStyle = G.rain > 0 ? 'rgba(80,86,94,.9)' : 'rgba(255,255,255,.9)';
  for (const c of clouds){
    c.x += c.v * .016; if (c.x > WORLD_W) c.x = -120;
    const s = c.s * 18; ctx.beginPath(); ctx.arc(c.x, c.y, s, 0, 7); ctx.arc(c.x + s * 1.1, c.y + 5, s * .8, 0, 7); ctx.arc(c.x - s, c.y + 6, s * .7, 0, 7); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.translate(-camX * .75, 0);
  ctx.fillStyle = sea === 'winter' ? '#8a94a4' : '#7a4630';
  ctx.beginPath(); ctx.moveTo(0, SURF_Y); mid.forEach((y, k) => ctx.lineTo(k * 60, y)); ctx.lineTo(mid.length * 60, SURF_Y); ctx.fill();
  ctx.restore();

  ctx.translate(-camX, 0);
  const vx0 = Math.max(0, Math.floor(camX - 30)), vx1 = Math.min(WORLD_W, Math.ceil(camX + viewW + 30));
  ctx.drawImage(groundC, vx0, 0, vx1 - vx0, UG_H, vx0, SURF_Y, vx1 - vx0, UG_H);
  ctx.globalAlpha = .07; ctx.drawImage(maskC, vx0, 0, vx1 - vx0, UG_H, vx0, SURF_Y, vx1 - vx0, UG_H); ctx.globalAlpha = 1;
  ctx.drawImage(visC, vx0, 0, vx1 - vx0, UG_H, vx0, SURF_Y, vx1 - vx0, UG_H);
  // Rohre
  for (const r of G.rigs){
    const col = r.owner === 'P' ? PLAYER_COLOR : owner(r.owner).color;
    for (const b of r.branches){
      if (!b.done && b.state !== 'drill') continue;
      ctx.beginPath(); ctx.moveTo(b.sx, b.sy);
      for (let k = 0; k < b.done; k++) ctx.lineTo(cellX(b.path[k]), cellY(b.path[k]));
      let hx = b.done ? cellX(b.path[b.done - 1]) : b.sx, hy = b.done ? cellY(b.path[b.done - 1]) : b.sy;
      if (b.state === 'drill' && b.path[b.done] !== undefined){ const nx = cellX(b.path[b.done]), ny = cellY(b.path[b.done]), f = Math.min(1, b.prog); hx += (nx - hx) * f; hy += (ny - hy) * f; ctx.lineTo(hx, hy); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = '#8f949c'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#d6dae0'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = col; ctx.globalAlpha = .9; ctx.lineWidth = 1.2; ctx.setLineDash([2, 10]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (b.state === 'pump'){ ctx.setLineDash([3, 8]); ctx.lineDashOffset = now / (b.gush > 0 ? 12 : 40); ctx.strokeStyle = '#06050a'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.setLineDash([]); }
      if (b.from != null){ ctx.fillStyle = '#5a5f66'; ctx.beginPath(); ctx.arc(b.sx, b.sy, 4, 0, 7); ctx.fill(); }
      if (b.state === 'drill'){
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(now / 50);
        ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); for (let k = 0; k < 6; k++){ const a = k / 6 * 6.283, q = k % 2 ? 3 : 6; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.fill(); ctx.restore();
      }
      if (b.state === 'stop' && r.owner === 'P'){ ctx.fillStyle = '#ff5d6c'; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    if (r.leak && r.owner === 'P'){
      const lx = cellX(r.leak.cell), ly = cellY(r.leak.cell), bb = Math.sin(now / 160) * 3;
      ctx.fillStyle = 'rgba(255,93,108,.25)'; ctx.beginPath(); ctx.arc(lx, ly, 16 + bb, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b0a10'; ctx.beginPath(); ctx.moveTo(lx, ly - 12); ctx.quadraticCurveTo(lx + 8, ly, lx, ly + 4); ctx.quadraticCurveTo(lx - 8, ly, lx, ly - 12); ctx.fill();
      ctx.strokeStyle = '#ff8a95'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  for (const m of G.moles){
    const x = (m.x + .5) * CELL, y = SURF_Y + (m.y + .5) * CELL;
    ctx.save(); ctx.translate(x, y); ctx.rotate(m.a);
    ctx.fillStyle = '#4a3428'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 6.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9aa8'; ctx.beginPath(); ctx.arc(10, 0, 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8d8c8'; ctx.fillRect(4, -5, 3, 2); ctx.fillRect(4, 3, 3, 2);
    ctx.restore();
  }
  for (const s of G.scans){
    const p = Math.min(1, s.t / .7), x = (s.cx + .5) * CELL, y = SURF_Y + (s.cy + .5) * CELL;
    for (let k = 0; k < 3; k++){ const q = clamp(p - k * .15, 0, 1); if (!q) continue; ctx.strokeStyle = `rgba(110,220,255,${(1 - q) * .9})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, q * (s.r + 1) * CELL, 0, 7); ctx.stroke(); }
  }
  for (const r of G.rings){ ctx.strokeStyle = `rgba(${r.col},${1 - r.t})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.t * r.max, 0, 7); ctx.stroke(); }
  // Oberfläche
  const grass = {winter:'#e8eef4', autumn:'#b98a35', spring:'#7cc350', summer:'#8fb43c'}[sea];
  ctx.fillStyle = '#5b3c22'; ctx.fillRect(vx0, SURF_Y - 4, vx1 - vx0, 6);
  ctx.fillStyle = grass; ctx.fillRect(vx0, SURF_Y - 8, vx1 - vx0, 5);
  ctx.fillStyle = '#c9a874'; ctx.globalAlpha = .55; ctx.fillRect(vx0, SURF_Y - 6, vx1 - vx0, 2); ctx.globalAlpha = 1;
  for (const p of G.plots) if (!(p.x1 < vx0 || p.x0 > vx1)) drawPlot(p);
  drawTown(); drawRefinery('L'); drawRefinery('R');
  for (const r of G.rigs) if (r.x > vx0 - 60 && r.x < vx1 + 60) drawRig(r);
  for (const w of G.wagons) if (w.x > vx0 - 60 && w.x < vx1 + 60) drawWagon(w);
  for (const d of G.dowsers) drawDowser(d);
  for (const b of G.bandits) drawBandit(b);
  for (const p of G.parts){
    if (p.col === 'smoke'){ ctx.fillStyle = `rgba(110,104,98,${p.life / 3.2 * .45})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (2.2 - p.life / 3.2), 0, 7); ctx.fill(); }
    else { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); ctx.globalAlpha = 1; }
  }
  if (aim) drawPreview();
  if (G.tool === 'rig' && mouse.in){ const ok = canBuildRig(mouse.wx); ctx.globalAlpha = .55; drawDerrick(mouse.wx, ok ? PLAYER_COLOR : '#ff5d6c', 1); ctx.globalAlpha = 1; }
  if (G.tool === 'scan' && mouse.in && mouse.wy > SURF_Y){ ctx.strokeStyle = 'rgba(110,220,255,.8)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mouse.wx, mouse.wy, scanR() * CELL, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  if (G.tool === 'dowser' && mouse.in && mouse.wy < SURF_Y + 12){ ctx.fillStyle = 'rgba(255,207,90,.12)'; ctx.fillRect(mouse.wx - 90, SURF_Y, 180, (26 + 12 * upL('dowse')) * CELL); }
  if (G.tool === 'mole' && mouse.in && mouse.wy > SURF_Y){ ctx.strokeStyle = 'rgba(255,200,150,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mouse.wx, mouse.wy, 14, 0, 7); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.font = '700 15px Bahnschrift, Segoe UI, sans-serif';
  for (const f of G.floats){ ctx.globalAlpha = Math.max(0, 1 - f.t / 1.7); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(f.txt, f.x + 1, f.y + 1.5); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y); }
  ctx.globalAlpha = 1;
  drawTutTarget(now);
  ctx.restore();
  if (G.rain > 0){
    ctx.strokeStyle = 'rgba(190,210,235,.45)'; ctx.lineWidth = 1; ctx.beginPath();
    const t = now / 4; for (let k = 0; k < 200; k++){ const x = (k * 97 + t * 1.3) % W, y = (k * 57 + t * 3) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 13); } ctx.stroke();
  } else if (sea === 'winter'){
    ctx.fillStyle = 'rgba(255,255,255,.85)'; const t = now / 30;
    for (let k = 0; k < 90; k++){ const x = (k * 131 + Math.sin(t / 30 + k) * 20) % W, y = (k * 53 + t * (.6 + (k % 3) * .3)) % (skyH + 20); ctx.fillRect(x, y, 2, 2); }
  }
}
function drawPlot(p){
  const b = SURF_Y - 4;
  if (p.owner === 'town') return;
  const col = p.owner === 'P' ? PLAYER_COLOR : p.owner ? owner(p.owner).color : null;
  if (mouse.in && !aim && mouse.wx >= p.x0 && mouse.wx < p.x1 && mouse.wy < SURF_Y + 8){ ctx.fillStyle = 'rgba(255,240,200,.07)'; ctx.fillRect(p.x0, 0, PLOT_W, SURF_Y); }
  if (col){ ctx.fillStyle = col; ctx.globalAlpha = .7; ctx.fillRect(p.x0 + 3, SURF_Y - 1, PLOT_W - 6, 3); ctx.globalAlpha = 1; }
  ctx.fillStyle = '#6a4626';
  ctx.fillRect(p.x0, b - 20, 4, 20);
  ctx.fillRect(p.x0, b - 15, 26, 2.5); ctx.fillRect(p.x0, b - 8, 26, 2.5); ctx.fillRect(p.x0 + 24, b - 18, 3, 18);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.font = '700 10px Bahnschrift, Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(p.i + 1, p.x0 + 31, b - 6);
  if (col){
    ctx.fillStyle = '#3a2614'; ctx.fillRect(p.x0 + 8, b - 54, 2.5, 54);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p.x0 + 10.5, b - 54); ctx.quadraticCurveTo(p.x0 + 22, b - 50 + Math.sin(performance.now() / 300 + p.i) * 2, p.x0 + 32, b - 48); ctx.lineTo(p.x0 + 10.5, b - 41); ctx.fill();
  } else {
    const cx = (p.x0 + p.x1) / 2;
    ctx.fillStyle = '#5b3d22'; ctx.fillRect(cx - 2, b - 34, 4, 34);
    ctx.fillStyle = '#e9cf98'; ctx.strokeStyle = '#5b3d22'; ctx.lineWidth = 2.5;
    rr(ctx, cx - 46, b - 72, 92, 38, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a3410'; ctx.textAlign = 'center'; ctx.font = '700 10px Bahnschrift, Segoe UI'; ctx.fillText('ZU VERKAUFEN', cx, b - 58);
    ctx.font = '700 14px Bahnschrift, Segoe UI'; ctx.fillText(eur(p.price), cx, b - 42);
  }
}
function drawDerrick(x, col, bl){
  const base = SURF_Y - 3, h = 92 * bl;
  ctx.fillStyle = '#4a3220'; ctx.fillRect(x - 20, base - 6, 40, 6);
  ctx.strokeStyle = '#3b2716'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 16, base - 6); ctx.lineTo(x - 3, base - h); ctx.lineTo(x + 3, base - h); ctx.lineTo(x + 16, base - 6); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let k = 1; k < 6; k++){
    const y0 = base - 6 - (h - 6) * (k - 1) / 6, y1 = base - 6 - (h - 6) * k / 6, w0 = 16 - 13 * (k - 1) / 6, w1 = 16 - 13 * k / 6;
    ctx.beginPath(); ctx.moveTo(x - w0, y0); ctx.lineTo(x + w1, y1); ctx.moveTo(x + w0, y0); ctx.lineTo(x - w1, y1); ctx.moveTo(x - w1, y1); ctx.lineTo(x + w1, y1); ctx.stroke();
  }
  ctx.fillStyle = '#3b2716'; ctx.fillRect(x - 6, base - h - 4, 12, 5);
  ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, base - h - 4); ctx.lineTo(x, base - h - 20); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, base - h - 20); ctx.quadraticCurveTo(x + 9, base - h - 19 + Math.sin(performance.now() / 260 + x) * 2, x + 16, base - h - 15); ctx.lineTo(x, base - h - 11); ctx.fill();
}
function drawRig(r){
  const col = r.owner === 'P' ? PLAYER_COLOR : owner(r.owner).color, base = SURF_Y - 3;
  if (G.sel === r || (aim && aim.rig === r)){ const gl = ctx.createRadialGradient(r.x + 8, base - 40, 4, r.x + 8, base - 40, 70); gl.addColorStop(0, 'rgba(255,220,120,.28)'); gl.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gl; ctx.fillRect(r.x - 70, base - 120, 160, 130); }
  const pumping = r.rate > .01, a = pumping ? Math.sin(r.anim * 5) * .32 : 0;
  ctx.save(); ctx.translate(r.x - 34, base - 22);
  ctx.fillStyle = '#4a3220'; ctx.beginPath(); ctx.moveTo(-7, 22); ctx.lineTo(0, 0); ctx.lineTo(7, 22); ctx.fill();
  ctx.rotate(a); ctx.fillStyle = '#2c2f36'; ctx.fillRect(-17, -3, 34, 5);
  ctx.fillStyle = '#3b3f48'; ctx.beginPath(); ctx.moveTo(-17, -6); ctx.quadraticCurveTo(-25, 0, -17, 9); ctx.lineTo(-14, 3); ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(12, -4, 6, 7);
  ctx.restore();
  ctx.strokeStyle = '#2c2f36'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x - 51, base - 22 - Math.sin(a) * 17); ctx.lineTo(r.x - 51, base); ctx.stroke();
  drawDerrick(r.x, col, r.build);
  const cap = rigCap(r), f = clamp(r.tank / cap, 0, 1), tx = r.x + 20, th = 36, tw = 22;
  ctx.fillStyle = '#6f747c'; rr(ctx, tx, base - th, tw, th, 4); ctx.fill();
  ctx.fillStyle = '#0b0a10'; ctx.fillRect(tx + 3, base - 3 - (th - 6) * f, tw - 6, (th - 6) * f);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(tx + 2, base - th + 2, 3, th - 4);
  ctx.strokeStyle = '#3b3f48'; ctx.lineWidth = 1.5; rr(ctx, tx, base - th, tw, th, 4); ctx.stroke();
  if (f > .97){ ctx.fillStyle = '#ff5d6c'; ctx.font = '700 10px Bahnschrift, Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('VOLL', tx + tw / 2, base - th - 5); }
}
function drawHorse(x, y, dir, t, moving, dark){
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const c1 = dark ? '#1a1410' : '#7a4a2a', c2 = dark ? '#0e0a08' : '#5a3418';
  const ph = moving ? t : 0;
  ctx.strokeStyle = c2; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (const [lx, o] of [[-9, 0], [-5, Math.PI], [8, Math.PI * .5], [12, Math.PI * 1.5]]){ const sw = Math.sin(ph * .35 + o) * 4.5; ctx.beginPath(); ctx.moveTo(lx, -12); ctx.lineTo(lx + sw * .6, -6); ctx.lineTo(lx + sw, 0); ctx.stroke(); }
  ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(1, -15, 14, 6.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9, -19); ctx.lineTo(15, -30); ctx.lineTo(20, -28); ctx.lineTo(15, -14); ctx.fill();
  ctx.beginPath(); ctx.ellipse(21, -28, 6, 3.3, .5, 0, 7); ctx.fill();
  ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(10, -21); ctx.lineTo(14, -31); ctx.lineTo(12, -21); ctx.fill();
  ctx.strokeStyle = c2; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-13, -17); ctx.quadraticCurveTo(-20, -14 + Math.sin(ph * .3) * 2, -18, -6); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(21, -29, 1, 0, 7); ctx.fill();
  ctx.restore();
}
function drawWagon(w){
  const col = w.owner === 'P' ? PLAYER_COLOR : owner(w.owner).color;
  const y = SURF_Y - 5 - w.lane * 2, x = w.x;
  if (G.sel === w){ ctx.fillStyle = 'rgba(255,220,120,.22)'; ctx.beginPath(); ctx.ellipse(x, y - 14, 46, 22, 0, 0, 7); ctx.fill(); }
  const bx = x - w.dir * 18;
  ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + w.dir * 13, y - 10); ctx.lineTo(x + w.dir * 4, y - 14); ctx.stroke();
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(bx - 14, y - 19, 28, 11);
  ctx.fillStyle = '#5a3418'; ctx.fillRect(bx - 14, y - 12, 28, 3);
  ctx.fillStyle = col; ctx.fillRect(bx - 14, y - 19, 28, 2.5);
  const f = w.load / wagonCap(w.owner), nb = Math.ceil(f * 3);
  for (let k = 0; k < nb; k++){
    const fx = bx - 9 + k * 9;
    ctx.fillStyle = '#4a2c14'; rr(ctx, fx - 3.5, y - 30, 7, 11, 2); ctx.fill();
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(fx - 3.5, y - 27, 7, 1.4); ctx.fillRect(fx - 3.5, y - 22, 7, 1.4);
  }
  for (const dx of [-9, 9]){
    ctx.save(); ctx.translate(bx + dx, y - 3); ctx.rotate(w.wheel * w.dir);
    ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++){ ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.lineTo(5.5, 0); ctx.stroke(); }
    ctx.restore();
  }
  drawHorse(x + w.dir * 8, y + 2, w.dir, w.step, w.moving, false);
  if (w.state === 'loading' || w.state === 'selling'){
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx - 14, y - 40, 28, 5);
    ctx.fillStyle = w.state === 'selling' ? '#ffcf5a' : '#8a8fb0'; ctx.fillRect(bx - 14, y - 40, 28 * (w.state === 'selling' ? Math.min(1, w.t / .8) : f), 5);
  }
}
function drawDowser(d){
  const x = d.x, y = SURF_Y - 6, st = Math.sin(d.walk * 8);
  ctx.save(); ctx.translate(x, y); ctx.scale(d.dir, 1);
  ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(st * 4, 0); ctx.moveTo(0, -12); ctx.lineTo(-st * 4, 0); ctx.stroke();
  ctx.fillStyle = '#5a7a9a'; ctx.fillRect(-3, -24, 6, 13);
  ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.arc(0, -28, 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a2c14'; ctx.fillRect(-7, -32, 14, 2.5); ctx.fillRect(-4, -36, 8, 4);
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.8; const wob = Math.sin(performance.now() / 90) * (d.found > 0 ? 4 : 1.5);
  ctx.beginPath(); ctx.moveTo(2, -18); ctx.lineTo(11, -12 + wob); ctx.moveTo(2, -16); ctx.lineTo(10, -9 + wob); ctx.moveTo(10.5, -10.5 + wob); ctx.lineTo(17, -7 + wob); ctx.stroke();
  ctx.restore();
  if (d.found > 0){ ctx.fillStyle = '#ffcf5a'; ctx.font = '800 18px Bahnschrift, Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 44 - Math.sin(performance.now() / 120) * 3); }
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 13, y - 48, 26, 3); ctx.fillStyle = '#c084fc'; ctx.fillRect(x - 13, y - 48, 26 * d.life / 50, 3);
}
function drawBandit(b){
  const y = SURF_Y - 4;
  drawHorse(b.x, y, b.dir, b.t * 220, true, true);
  ctx.save(); ctx.translate(b.x + b.dir, y - 22);
  ctx.fillStyle = '#1a1410'; ctx.fillRect(-3, -14, 7, 12);
  ctx.fillStyle = '#d8b48a'; ctx.beginPath(); ctx.arc(0, -18, 3.8, 0, 7); ctx.fill();
  ctx.fillStyle = '#c0242c'; ctx.fillRect(-4, -17, 8, 3);
  ctx.fillStyle = '#0e0a08'; ctx.fillRect(-7, -22, 14, 2.5); ctx.fillRect(-4, -26, 8, 4);
  ctx.restore();
  if (b.state === 'chase'){
    const p = .6 + .4 * Math.sin(performance.now() / 120);
    ctx.strokeStyle = `rgba(255,93,108,${p})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, y - 22, 28, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ff5d6c'; ctx.font = '800 12px Bahnschrift, Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('KLICK!', b.x, y - 56);
  }
}
function drawTown(){
  const x0 = plotX0(TOWN_PLOT), b = SURF_Y - 4;
  if (x0 + PLOT_W < camX - 30 || x0 > camX + viewW + 30) return;
  ctx.fillStyle = '#8e5a2e'; ctx.fillRect(x0 + 10, b - 64, 82, 64);
  ctx.fillStyle = '#6e4220'; ctx.fillRect(x0 + 4, b - 78, 94, 16);
  ctx.fillStyle = '#5a3418'; for (let y = b - 60; y < b; y += 8) ctx.fillRect(x0 + 10, y, 82, 1.2);
  ctx.fillStyle = '#ffd36b'; ctx.font = '700 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('SALOON', x0 + 51, b - 66);
  ctx.fillStyle = '#3a2410'; ctx.fillRect(x0 + 40, b - 30, 22, 30);
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x0 + 42, b - 24, 8, 14); ctx.fillRect(x0 + 52, b - 24, 8, 14);
  ctx.fillStyle = '#ffe1a0'; ctx.fillRect(x0 + 17, b - 50, 14, 12); ctx.fillRect(x0 + 71, b - 50, 14, 12);
  ctx.fillStyle = '#5a3418'; ctx.fillRect(x0 + 8, b - 34, 86, 4);
  ctx.fillStyle = '#a0522d'; ctx.fillRect(x0 + 110, b - 46, 70, 46);
  ctx.fillStyle = '#7a3b1d'; ctx.beginPath(); ctx.moveTo(x0 + 104, b - 46); ctx.lineTo(x0 + 145, b - 70); ctx.lineTo(x0 + 186, b - 46); ctx.fill();
  ctx.strokeStyle = '#f2e6d4'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 128, b - 34, 34, 34);
  ctx.beginPath(); ctx.moveTo(x0 + 128, b - 34); ctx.lineTo(x0 + 162, b); ctx.moveTo(x0 + 162, b - 34); ctx.lineTo(x0 + 128, b); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '700 9px Bahnschrift, Segoe UI'; ctx.fillText('WAGEN', x0 + 145, b - 50);
  ctx.fillStyle = '#5a3c22'; ctx.fillRect(x0 + 187, b - 40, 3, 40); ctx.fillRect(x0 + 199, b - 40, 3, 40);
  ctx.fillStyle = '#7a5434'; ctx.fillRect(x0 + 183, b - 58, 23, 20);
}
function drawRefinery(side){
  const L = side === 'L', x0 = L ? 0 : WORLD_W - FACT_W, b = SURF_Y - 4;
  if (x0 + FACT_W < camX - 30 || x0 > camX + viewW + 30) return;
  const m = G.market[side], best = m.p >= G.market[L ? 'R' : 'L'].p;
  const ox = L ? x0 + 20 : x0 + 40;
  for (const [tx, tr] of [[ox + 10, 26], [ox + 66, 20]]){ ctx.fillStyle = '#9aa0a8'; ctx.fillRect(tx, b - 44, tr * 2, 44); ctx.beginPath(); ctx.ellipse(tx + tr, b - 44, tr, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(tx + tr * 1.3, b - 44, tr * .7, 44); }
  ctx.fillStyle = '#7a4a3a'; ctx.fillRect(ox + 100, b - 80, 100, 80);
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1; for (let y = b - 80; y < b; y += 8){ ctx.beginPath(); ctx.moveTo(ox + 100, y); ctx.lineTo(ox + 200, y); ctx.stroke(); }
  ctx.fillStyle = '#5a3326'; ctx.beginPath(); ctx.moveTo(ox + 96, b - 80); ctx.lineTo(ox + 125, b - 96); ctx.lineTo(ox + 150, b - 80); ctx.lineTo(ox + 175, b - 96); ctx.lineTo(ox + 204, b - 80); ctx.fill();
  ctx.fillStyle = '#ffe1a0'; for (let k = 0; k < 4; k++) ctx.fillRect(ox + 108 + k * 23, b - 62, 12, 12);
  ctx.fillStyle = '#3a2a24'; ctx.fillRect(ox + 136, b - 30, 30, 30);
  ctx.fillStyle = '#5a3326'; ctx.fillRect(L ? 86 : WORLD_W - 106, b - 146, 20, 70);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(L ? 86 : WORLD_W - 106, b - 146, 20, 6);
  ctx.strokeStyle = '#6f747c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ox + 62, b - 30); ctx.lineTo(ox + 100, b - 30); ctx.stroke();
  const sx = ox + 150, sy = b - 150;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(sx - 1, sy + 40, 3, 52);
  ctx.fillStyle = best ? '#1d6a42' : '#5a2a2a'; ctx.strokeStyle = best ? '#3fd28b' : '#2a1414'; ctx.lineWidth = 2;
  rr(ctx, sx - 60, sy, 120, 42, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '700 10px Bahnschrift, Segoe UI'; ctx.fillText(L ? 'RAFFINERIE WEST' : 'RAFFINERIE OST', sx, sy + 14);
  ctx.font = '700 17px Bahnschrift, Segoe UI'; ctx.fillText(`${fmt(m.p)} €/Fass`, sx, sy + 34);
  if (m.boom > 0){ ctx.font = '700 11px Bahnschrift, Segoe UI'; ctx.fillStyle = '#ffcf5a'; ctx.fillText('★ PREISBOOM ★', sx, sy - 6); }
  if (G.sellTarget === side){ ctx.font = '700 11px Bahnschrift, Segoe UI'; ctx.fillStyle = '#9ef0c4'; ctx.fillText('ALLE WAGEN HIERHIN', sx, sy - (m.boom > 0 ? 20 : 6)); }
}
function drawPreview(){
  const pv = plan();
  if (!pv) return;
  const ug = mouse.wy > SURF_Y;
  ctx.setLineDash([7, 6]); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.strokeStyle = !ug ? 'rgba(255,255,255,.35)' : pv.blocked ? '#ff5d6c' : pv.oil ? '#3fd28b' : '#ffe08a';
  ctx.beginPath(); ctx.moveTo(pv.sx, pv.sy); pv.cells.forEach(i => ctx.lineTo(cellX(i), cellY(i))); if (!ug) ctx.lineTo(mouse.wx, mouse.wy); ctx.stroke(); ctx.setLineDash([]);
  if (!ug) return;
  const last = pv.cells[pv.cells.length - 1], lx = last != null ? cellX(last) : pv.sx, ly = last != null ? cellY(last) : pv.sy;
  ctx.fillStyle = pv.oil ? '#3fd28b' : pv.blocked ? '#ff5d6c' : '#ffe08a'; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fill();
  const txt = `${eur(pv.cost)} · ${pv.cells.length * 3} m${pv.blocked ? ' · Felsen!' : ''}${pv.gas ? ' · GAS!' : ''}${pv.oil ? ' · Öl!' : ''}`;
  ctx.font = '700 12px Bahnschrift, Segoe UI'; ctx.textAlign = 'center';
  const tw = ctx.measureText(txt).width + 16;
  ctx.fillStyle = 'rgba(14,10,7,.88)'; rr(ctx, lx - tw / 2, ly + 12, tw, 22, 6); ctx.fill();
  ctx.fillStyle = pv.cost > G.money ? '#ff8a95' : '#fff'; ctx.fillText(txt, lx, ly + 27);
}

// =====================================================================
//  EINGABE
// =====================================================================
function plan(){
  if (!aim) return null;
  let tx = clamp(Math.floor(mouse.wx / CELL), 0, COLS - 1), ty = clamp(Math.floor((mouse.wy - SURF_Y) / CELL), 0, ROWS - 1);
  // Einrasten: liegt sichtbares Öl ganz in der Nähe, wird das Ziel dorthin gezogen
  let snap = null, sd = 1e9;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++){
    const x = tx + dx, y = ty + dy;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
    const i = idx(x, y), d = dx * dx + dy * dy;
    if (d < sd && revealed[i] && grid[i] === 2 && pockets[pid[i]].oil > 0){ sd = d; snap = i; }
  }
  if (snap != null){ tx = snap % COLS; ty = Math.floor(snap / COLS); }
  const sx = aim.from == null ? aim.rig.cx : aim.from % COLS, sy = aim.from == null ? -1 : Math.floor(aim.from / COLS);
  const cells = lineCells(sx, sy, tx, ty), out = [];
  let blocked = false, gas = false, oil = false, cost = 0;
  for (const i of cells){
    if (grid[i] === 1 && !upL('diamond')){ blocked = true; break; }
    out.push(i); cost += pipeCost('P') * (grid[i] === 1 ? 3 : 1);
    if (revealed[i] && grid[i] === 3) gas = true;
    if (revealed[i] && grid[i] === 2 && pockets[pid[i]].oil > 0){ oil = true; break; }
  }
  return {cells:out, cost, blocked, gas, oil, sx:aim.from == null ? aim.rig.x : cellX(aim.from), sy:aim.from == null ? SURF_Y : cellY(aim.from)};
}
function canBuildRig(x){
  const p = G.plots.find(p => x >= p.x0 + 18 && x < p.x1 - 18);
  return !!p && p.owner === 'P' && G.rigs.every(r => Math.abs(r.x - x) > 50) && G.money >= COST.rig;
}
const hitRig = (wx, wy) => G.rigs.find(r => wx > r.x - 52 && wx < r.x + 44 && wy > SURF_Y - 110 && wy < SURF_Y + 6);
const hitWagon = (wx, wy) => G.wagons.find(w => Math.abs(wx - w.x) < 34 && wy > SURF_Y - 42 && wy < SURF_Y + 4);
function hitPipe(wx, wy){
  if (wy < SURF_Y) return null;
  let best = null, bd = 1.6 * CELL;
  for (const r of G.rigs){
    if (r.owner !== 'P') continue;
    for (const b of r.branches) for (let k = 0; k < b.done; k++){
      const i = b.path[k], d = Math.hypot(cellX(i) - wx, cellY(i) - wy);
      if (d < bd){ bd = d; best = {rig:r, branch:b, cell:i}; }
    }
  }
  return best;
}
const hitLeak = (wx, wy) => G.rigs.find(r => r.owner === 'P' && r.leak && Math.hypot(cellX(r.leak.cell) - wx, cellY(r.leak.cell) - wy) < 20);
function toWorld(e){
  const rc = cv.getBoundingClientRect();
  mouse.sx = e.clientX - rc.left; mouse.sy = e.clientY - rc.top;
  mouse.wx = mouse.sx / scale - offX + camX; mouse.wy = mouse.sy / scale;
}
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (!G || G.over) return;
  Hub.audio(); toWorld(e); cv.setPointerCapture(e.pointerId);
  const start = {x:mouse.sx, y:mouse.sy, cam:camX};
  if (e.button === 2){ if (aim || G.tool){ aim = null; setTool(null); return; } drag = {kind:'cam', ...start}; return; }
  if (e.button === 1){ drag = {kind:'cam', ...start}; return; }
  if (!G.tool && !aim){
    if (hitLeak(mouse.wx, mouse.wy)){ drag = {kind:'click', ...start}; return; }
    const r = hitRig(mouse.wx, mouse.wy);
    if (r && r.owner === 'P'){ drag = {kind:'rig', rig:r, ...start}; return; }
    const hp = hitPipe(mouse.wx, mouse.wy);
    if (hp){ drag = {kind:'pipe', hp, ...start}; return; }
  }
  drag = {kind:'click', ...start};
});
cv.addEventListener('pointermove', e => {
  if (!G) return;
  toWorld(e); mouse.in = true;
  if (drag){
    if (Math.hypot(mouse.sx - drag.x, mouse.sy - drag.y) > 7) drag.moved = true;
    if (drag.moved && (drag.kind === 'rig' || drag.kind === 'pipe') && !aim)
      aim = drag.kind === 'rig' ? {rig:drag.rig, from:null, parent:null, dragged:true} : {rig:drag.hp.rig, from:drag.hp.cell, parent:drag.hp.branch, dragged:true};
    if (drag.kind === 'cam' || (drag.kind === 'click' && drag.moved)){ drag.kind = 'cam'; camX = clamp(drag.cam - (mouse.sx - drag.x) / scale, 0, maxCam()); }
  }
  updateTip();
});
cv.addEventListener('pointerleave', () => { mouse.in = false; $('tip').style.display = 'none'; });
cv.addEventListener('pointerup', e => {
  if (!G || !drag) return;
  toWorld(e);
  const d = drag; drag = null;
  if (d.kind === 'cam') return;
  if ((d.kind === 'rig' || d.kind === 'pipe') && aim && aim.dragged){ if (mouse.wy > SURF_Y) fireAim(); else aim = null; return; }
  if (d.kind === 'rig'){ select(d.rig); aim = {rig:d.rig, from:null, parent:null}; SFX.click(); return; }
  if (d.kind === 'pipe'){ aim = {rig:d.hp.rig, from:d.hp.cell, parent:d.hp.branch}; select(d.hp.rig); SFX.click(); return; }
  if (!d.moved) handleClick();
});
cv.addEventListener('wheel', e => {
  if (!G) return; e.preventDefault();
  camX = clamp(camX + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / scale, 0, maxCam());
}, {passive:false});
function fireAim(){
  const pv = plan(), a = aim; aim = null;
  if (!pv || !pv.cells.length) return;
  if (G.money < pipeCost('P')){ feed('Zu wenig Geld für Rohre.', 'bad', 'coins'); return; }
  if (pv.gas) feed('Achtung: Da vorne ist Gas!', 'bad', 'flame');
  const last = pv.cells[pv.cells.length - 1];
  const b = startBranch(a.rig, a.from, last % COLS, Math.floor(last / COLS), a.parent);
  if (b){ SFX.click(); if (a.parent && a.parent.state === 'stop') a.parent.state = 'dry'; }
}
let e_shift = false;
function handleClick(){
  const {wx, wy} = mouse;
  if (aim){ if (wy > SURF_Y) fireAim(); else aim = null; return; }
  const bd = G.bandits.find(b => b.state === 'chase' && Math.abs(b.x - wx) < 30 && wy > SURF_Y - 60 && wy < SURF_Y + 6);
  if (bd){ bd.state = 'flee'; const g = 100 + G.n * 40; gain('P', g); feed(`Bandit vertrieben! Kopfgeld: +${eur(g)}`, 'good', 'target'); SFX.good(); floatText(bd.x, SURF_Y - 60, `+${eur(g)}`, '#ffd34d'); Hub.achieve('oel', 'bandit', 'Sheriff', 'Vertreibe einen Banditen'); return; }
  const lr = hitLeak(wx, wy); if (lr){ repair(lr); return; }
  const t = G.tool;
  if (t === 'rig'){
    if (canBuildRig(wx)){ const r = buildRig('P', wx); if (r){ select(r); if (!e_shift) setTool(null); } }
    else if (G.money < COST.rig) feed(`Ein Bohrturm kostet ${eur(COST.rig)}.`, 'bad', 'coins');
    else feed('Nur auf deinem grünen Land – mit Abstand zu anderen Türmen.', 'bad', 'info');
    return;
  }
  if (t === 'dowser'){
    if (wy > SURF_Y + 12){ feed('Der Rutengänger läuft oben – klick auf die Oberfläche.', '', 'info'); return; }
    if (!pay('P', COST.dowser)){ feed('Nicht genug Geld.', 'bad', 'coins'); return; }
    G.dowsers.push({x:wx, x0:wx, dir:1, life:50, ping:.4, found:0, walk:0}); SFX.buy(); if (!e_shift) setTool(null); return;
  }
  if (t === 'scan'){
    if (wy < SURF_Y){ feed('Klick unter die Erde, wo gescannt werden soll.', '', 'info'); return; }
    if (!pay('P', COST.scan)){ feed('Nicht genug Geld.', 'bad', 'coins'); return; }
    G.scans.push({cx:Math.floor(wx / CELL), cy:Math.floor((wy - SURF_Y) / CELL), r:scanR(), t:0}); SFX.ping(); if (!e_shift) setTool(null); return;
  }
  if (t === 'mole'){
    if (wy < SURF_Y){ feed('Klick unter die Erde, wo der Maulwurf graben soll.', '', 'info'); return; }
    if (!pay('P', COST.mole)){ feed('Nicht genug Geld.', 'bad', 'coins'); return; }
    G.moles.push({x:wx / CELL, y:(wy - SURF_Y) / CELL, a:rnd(0, 6.3), life:25, rt:0}); SFX.buy(); if (!e_shift) setTool(null); return;
  }
  const w = hitWagon(wx, wy); if (w){ select(w); SFX.click(); return; }
  const r = hitRig(wx, wy); if (r){ select(r); return; }
  const p = G.plots.find(p => wx >= p.x0 && wx < p.x1);
  if (p && wy < SURF_Y + 8){
    if (!p.owner){ openAuction(p); return; }
    if (p.owner === 'P'){
      if (canBuildRig(wx)){ const r2 = buildRig('P', wx); if (r2) select(r2); }
      else if (G.money < COST.rig) feed(`Ein Bohrturm kostet ${eur(COST.rig)}.`, 'bad', 'coins');
      else feed('Zu nah an einem anderen Turm oder am Rand.', '', 'info');
      return;
    }
    if (p.owner === 'town'){ openSaloon(); return; }
  }
  if (wy < SURF_Y + 8 && (wx < FACT_W || wx > WORLD_W - FACT_W)){ const s = wx < FACT_W ? 'L' : 'R'; setSell(G.sellTarget === s ? 'auto' : s); return; }
  select(null);
}
const keys = {};
addEventListener('keydown', e => {
  e_shift = e.shiftKey;
  if (!G || anyOverlay()) return;
  const k = e.key.toLowerCase();
  if (k === ' '){ e.preventDefault(); setSpeed(G.speed ? 0 : (G.lastSpeed || 1)); }
  if (k === '1' || k === '2' || k === '3') setSpeed(+k);
  if (k === 'escape'){ setTool(null); select(null); aim = null; drag = null; }
  if (k === 'b') setTool('rig');
  if (k === 'r') setTool('dowser');
  if (k === 'e') setTool('scan');
  if (k === 'm') setTool('mole');
  if (k === 'w' && !e.repeat) buyWagon();
  keys[k] = true;
});
addEventListener('keyup', e => { e_shift = e.shiftKey; keys[e.key.toLowerCase()] = false; });
function updateTip(){
  const t = $('tip');
  if (!G || anyOverlay() || !mouse.in){ t.style.display = 'none'; return; }
  const {wx, wy} = mouse;
  let txt = '';
  if (aim) txt = wy > SURF_Y ? '<b>Klicken</b> = hierhin bohren · <b>Rechtsklick</b> = abbrechen' : 'Zeig in den Boden, wohin gebohrt werden soll';
  else if (G.tool === 'rig') txt = canBuildRig(wx) ? `<b>Klicken</b>: Bohrturm bauen (${eur(COST.rig)})` : 'Nur auf deinem <b>grünen</b> Land möglich';
  else if (G.tool === 'scan') txt = wy > SURF_Y ? `<b>Klicken</b>: Echolot-Scan (${eur(COST.scan)})` : 'Unter die Erde zeigen';
  else if (G.tool === 'mole') txt = wy > SURF_Y ? `<b>Klicken</b>: Maulwurf losschicken (${eur(COST.mole)})` : 'Unter die Erde zeigen';
  else if (G.tool === 'dowser') txt = wy < SURF_Y + 12 ? `<b>Klicken</b>: Rutengänger einsetzen (${eur(COST.dowser)})` : 'Auf die Oberfläche zeigen';
  else {
    const r = hitRig(wx, wy), w = hitWagon(wx, wy);
    if (hitLeak(wx, wy)) txt = `<b>Klicken</b>: Leck reparieren (${eur(COST.repair)})`;
    else if (r && r.owner === 'P') txt = `Tank: <b>${fmt(r.tank)}/${fmt(rigCap(r))} Fass</b><br><b>Klicken</b>, dann in den Boden klicken = bohren`;
    else if (r) txt = `Bohrturm von ${owner(r.owner).name} · ${fmt(r.tank)} Fass`;
    else if (w) txt = w.owner === 'P' ? `Dein Wagen · <b>${fmt(w.load)}/${fmt(wagonCap('P'))} Fass</b>` : `Wagen von ${owner(w.owner).name}`;
    else if (hitPipe(wx, wy)) txt = '<b>Klicken</b> = von hier abzweigen';
    else if (wy > SURF_Y){
      const cx = Math.floor(wx / CELL), cy = Math.floor((wy - SURF_Y) / CELL);
      if (cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS){
        const i = idx(cx, cy);
        if (grid[i] === 1) txt = 'Felsen – der Bohrer kommt nicht durch';
        else if (!revealed[i]) txt = `Unerforscht · Tiefe ${cy * 3} m`;
        else if (grid[i] === 2) txt = pockets[pid[i]].oil > 0 ? `Öl: ca. <b>${fmt(pockets[pid[i]].oil)} Fass</b>` : 'Leere Ölblase';
        else if (grid[i] === 3) txt = '<b>Gasblase</b> – explodiert beim Anbohren!';
        else txt = `Erde · Tiefe ${cy * 3} m`;
      }
    } else {
      const p = G.plots.find(p => wx >= p.x0 && wx < p.x1);
      if (p && !p.owner) txt = `Grundstück ${p.i + 1} zu verkaufen – <b>Klicken</b> für Auktion`;
      else if (p && p.owner === 'P') txt = `Dein Land – <b>Klicken</b> = Bohrturm bauen (${eur(COST.rig)})`;
      else if (p && p.owner === 'town') txt = '<b>Klicken</b>: Saloon betreten (Upgrades)';
      else if (p && p.owner) txt = `Land von ${owner(p.owner).name}`;
      else if (wx < FACT_W) txt = `Raffinerie West: <b>${fmt(G.market.L.p)} €/Fass</b><br>Klicken = alle Wagen hierhin`;
      else if (wx > WORLD_W - FACT_W) txt = `Raffinerie Ost: <b>${fmt(G.market.R.p)} €/Fass</b><br>Klicken = alle Wagen hierhin`;
    }
  }
  if (!txt){ t.style.display = 'none'; return; }
  t.innerHTML = txt; t.style.display = 'block';
  t.style.left = Math.min(mouse.sx + 18, cv.clientWidth - t.offsetWidth - 8) + 'px';
  t.style.top = Math.max(6, mouse.sy - t.offsetHeight - 12) + 'px';
}
function floatText(x, y, txt, col){ G.floats.push({x, y, txt, col, t:0}); }
function repair(r){
  if (!pay('P', COST.repair)){ feed('Nicht genug Geld zum Reparieren.', 'bad', 'coins'); return; }
  r.leak = null; SFX.good(); feed(`Leck repariert (−${eur(COST.repair)})`, 'good', 'check'); renderSel();
}
function buyWagon(){
  if (!G || G.over) return;
  if (G.wagons.filter(w => w.owner === 'P').length >= 14){ feed('Mehr Wagen passen nicht auf die Straße.', '', 'info'); return; }
  if (!addWagon('P')) feed(`Ein Pferdewagen kostet ${eur(COST.wagon)}.`, 'bad', 'coins');
}

// =====================================================================
//  AUSWAHL-PANEL, WERKZEUGE, HUD
// =====================================================================
function select(o){ G.sel = o; renderSel(); }
function renderSel(){
  const box = $('sel'); if (!G) return;
  const o = G.sel;
  if (!o || (!G.rigs.includes(o) && !G.wagons.includes(o))){
    G.sel = null;
    const w = G.wagons.filter(w => w.owner === 'P').length, r = G.rigs.filter(r => r.owner === 'P').length, pump = G.rigs.filter(r => r.owner === 'P').reduce((a, r) => a + r.rate, 0);
    box.innerHTML = `<span class="t">Deine Firma</span><span>${r} Bohrtürme</span><span>${w} Wagen</span><span>${pump.toFixed(1).replace('.', ',')} Fass/s</span><span class="muted">Turm anklicken → in den Boden klicken = bohren</span>`;
    return;
  }
  if (G.rigs.includes(o)){
    const mine = o.owner === 'P', pumping = o.branches.filter(b => b.state === 'pump').length, f = clamp(o.tank / rigCap(o), 0, 1);
    box.innerHTML = `<span class="t">Bohrturm${mine ? '' : ' · ' + owner(o.owner).name}</span>
      <span>Tank <b id="sTank">${fmt(o.tank)}</b>/${fmt(rigCap(o))}</span><span class="gauge"><i id="sGauge" style="width:${f * 100}%"></i></span><span>${pumping} Pumpe(n)</span>
      ${mine ? `<button class="h-btn sm oil" id="sDrill">${I('down')}Neues Rohr</button><button class="h-btn sm" id="sTankUp">Tank +20 · ${eur(COST.tank)}</button>
      ${o.leak ? `<button class="h-btn sm danger" id="sRep">Leck reparieren · ${eur(COST.repair)}</button>` : ''}<button class="h-btn sm ghost" id="sDel">${I('trash')}Abreißen</button>` : ''}`;
    if (mine){
      $('sDrill').onclick = () => { aim = {rig:o, from:null, parent:null}; feed('Klick jetzt in den Boden, wohin gebohrt werden soll.', '', 'info'); };
      $('sTankUp').onclick = () => { if (pay('P', COST.tank)){ o.extra += 20; SFX.buy(); renderSel(); } else feed('Nicht genug Geld.', 'bad', 'coins'); };
      if (o.leak) $('sRep').onclick = () => repair(o);
      $('sDel').onclick = async () => {
        const ok = await dlg({title:'Bohrturm abreißen?', html:`<p>Du bekommst ${eur(COST.rig * .3)} zurück. Alle Rohre dieses Turms gehen verloren.</p>`, buttons:[{label:'Abbrechen', value:false}, {label:'Abreißen', value:true, cls:'danger'}]});
        if (!ok) return;
        G.rigs = G.rigs.filter(r => r !== o); G.money += COST.rig * .3;
        G.wagons.forEach(w => { if (w.target === o){ w.target = null; w.claimAmt = 0; w.state = 'idle'; } });
        select(null);
      };
    }
  } else {
    const w = o, mine = w.owner === 'P';
    const st = {idle:'wartet auf Arbeit', toRig:'fährt zum Bohrturm', loading:'lädt Öl', toFactory:`fährt nach ${w.side === 'L' ? 'West' : 'Ost'}`, selling:'verkauft'}[w.state];
    box.innerHTML = `<span class="t">Pferdewagen${mine ? '' : ' · ' + owner(w.owner).name}</span><span>Ladung <b>${fmt(w.load)}</b>/${fmt(wagonCap(w.owner))} Fass</span><span class="muted">${st}</span>
      ${mine ? `<span class="muted">Diese Fahrt:</span><div class="seg"><button data-o="" class="${!w.override ? 'on' : ''}">Auto</button><button data-o="L" class="${w.override === 'L' ? 'on' : ''}">West</button><button data-o="R" class="${w.override === 'R' ? 'on' : ''}">Ost</button></div>` : ''}`;
    box.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { w.override = b.dataset.o || null; if (w.state === 'toFactory') w.side = pickSide(w); renderSel(); });
  }
}
function setTool(t){
  if (!G) return;
  G.tool = (t && G.tool === t) ? null : t;
  if (G.tool) aim = null;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', b.dataset.tool === G.tool));
  cv.style.cursor = G.tool ? 'copy' : 'default';
}
$('tools').onclick = e => {
  const b = e.target.closest('.tool'); if (!b || !G) return;
  Hub.audio();
  if (b.dataset.tool === 'wagon') return buyWagon();
  setTool(b.dataset.tool);
};
function updateToolPrices(){
  document.querySelectorAll('.tool small[data-c]').forEach(s => { const c = COST[s.dataset.c]; s.textContent = eur(c); s.parentNode.classList.toggle('poor', !!G && G.money < c); });
}
function setSpeed(v){
  if (!G) return;
  if (G.speed) G.lastSpeed = G.speed;
  G.speed = v;
  document.querySelectorAll('#speedSeg button').forEach(b => b.classList.toggle('on', +b.dataset.v === v));
}
function setSell(s){
  G.sellTarget = s;
  document.querySelectorAll('#sellSeg button').forEach(x => x.classList.toggle('on', x.dataset.s === s));
  G.wagons.filter(w => w.owner === 'P' && w.state === 'toFactory').forEach(w => w.side = pickSide(w));
  feed(s === 'auto' ? 'Wagen verkaufen automatisch zum besten Preis.' : `Alle Wagen fahren jetzt nach ${s === 'L' ? 'West' : 'Ost'}.`, '', 'info', 2500);
}
$('speedSeg').onclick = e => { const b = e.target.closest('button'); if (b) setSpeed(+b.dataset.v); };
$('sellSeg').onclick = e => { const b = e.target.closest('button[data-s]'); if (b && G) setSell(b.dataset.s); };
$('menuBtn').onclick = () => openMenu();
$('saloonBtn').onclick = () => openSaloon();
let hudT = 0;
function hud(dt){
  if (!G) return;
  hudT -= dt; if (hudT > 0) return; hudT = .1;
  const m = Math.min(11, Math.floor(G.time / YEAR_LEN * 12));
  $('monthTxt').textContent = G.started ? `${MONTHS[m]} · noch ${Math.ceil(YEAR_LEN - G.time)} s` : 'Wartet auf ersten Bohrturm';
  $('yearBar').style.width = G.time / YEAR_LEN * 100 + '%';
  $('moneyTxt').textContent = eur(G.money);
  const goal = G.cfg.goal, st = G.earned >= goal * 2 ? 3 : G.earned >= goal * 1.5 ? 2 : G.earned >= goal ? 1 : 0;
  $('goalBar').style.width = Math.min(1, G.earned / (goal * 2)) * 100 + '%';
  $('starsTxt').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
  $('goalTxt').textContent = `${eur(G.earned)} von ${eur(goal)}`;
  for (const [k, el] of [['L', 'pL'], ['R', 'pR']]){
    const mk = G.market[k], h = mk.hist, tr = h.length > 6 ? mk.p - h[h.length - 6] : 0;
    $(el + 'v').textContent = `${fmt(mk.p)} €`;
    $(el + 't').textContent = tr > .5 ? '▲' : tr < -.5 ? '▼' : '•';
    $(el + 't').style.color = tr > .5 ? '#6be3a1' : tr < -.5 ? '#ff8a95' : '#a48a70';
    $(el).classList.toggle('best', k === 'L' ? mk.p >= G.market.R.p : mk.p > G.market.L.p);
    spark($(el + 's'), h);
  }
  updateToolPrices();
  if (G.sel && G.sel.tank !== undefined){ const sT = $('sTank'), sg = $('sGauge'); if (sT) sT.textContent = fmt(G.sel.tank); if (sg) sg.style.width = clamp(G.sel.tank / rigCap(G.sel), 0, 1) * 100 + '%'; }
  drawMini();
}
function spark(c, h){
  const x = c.getContext('2d'), W = c.width, H = c.height;
  x.clearRect(0, 0, W, H);
  if (h.length < 2) return;
  const lo = Math.min(...h), hi = Math.max(...h), sp = hi - lo || 1;
  const up = h[h.length - 1] >= h[Math.max(0, h.length - 10)];
  x.beginPath(); h.forEach((v, k) => { const px = k / (h.length - 1) * W, py = H - 5 - (v - lo) / sp * (H - 10); k ? x.lineTo(px, py) : x.moveTo(px, py); });
  x.strokeStyle = up ? '#3fd28b' : '#ff5d6c'; x.lineWidth = 3.5; x.lineJoin = 'round'; x.stroke();
  x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fillStyle = up ? 'rgba(63,210,139,.14)' : 'rgba(255,93,108,.14)'; x.fill();
}
function drawMini(){
  const c = $('mini'), x = c.getContext('2d'), W = c.width, H = c.height, sx = W / WORLD_W, sy = H / WORLD_H;
  x.fillStyle = '#6aa8d8'; x.fillRect(0, 0, W, SURF_Y * sy);
  x.drawImage(groundC, 0, SURF_Y * sy, W, UG_H * sy);
  x.drawImage(visC, 0, SURF_Y * sy, W, UG_H * sy);
  for (const p of G.plots){ x.fillStyle = p.owner === 'P' ? PLAYER_COLOR : p.owner === 'town' ? '#ffd36b' : p.owner ? owner(p.owner).color : '#8a7a6a'; x.fillRect(p.x0 * sx + 1, SURF_Y * sy - 5, PLOT_W * sx - 2, 5); }
  for (const r of G.rigs){
    x.fillStyle = x.strokeStyle = r.owner === 'P' ? PLAYER_COLOR : owner(r.owner).color; x.fillRect(r.x * sx - 2, SURF_Y * sy - 16, 4, 11);
    x.lineWidth = 1.5; for (const b of r.branches){ if (!b.done) continue; x.beginPath(); x.moveTo(b.sx * sx, b.sy * sy); const e = b.path[b.done - 1]; x.lineTo(cellX(e) * sx, cellY(e) * sy); x.stroke(); }
  }
  for (const w of G.wagons){ x.fillStyle = w.owner === 'P' ? '#fff' : owner(w.owner).color; x.fillRect(w.x * sx - 3, SURF_Y * sy - 9, 6, 4); }
  x.strokeStyle = '#ffcf5a'; x.lineWidth = 3; x.strokeRect(camX * sx, 2, Math.min(W, viewW * sx), H - 4);
}
$('mini').addEventListener('pointerdown', e => {
  if (!G) return;
  const go = ev => { const rc = $('mini').getBoundingClientRect(); camX = clamp((ev.clientX - rc.left) / rc.width * WORLD_W - viewW / 2, 0, maxCam()); };
  go(e); const mv = ev => go(ev), up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
});
function feed(txt, kind = '', ic = 'info', ms = 4200){
  const b = document.createElement('div'); b.className = 'fd ' + kind;
  b.innerHTML = `<span class="fi">${I(ic)}</span><span></span>`; b.lastChild.textContent = txt;
  $('feed').appendChild(b);
  setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 400); }, ms);
  while ($('feed').children.length > 4) $('feed').firstChild.remove();
}
function bigText(t){ const b = $('big'); b.textContent = t; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }

// =====================================================================
//  OVERLAYS: Auktion, Saloon, Anleitung, Ergebnis, Karte
// =====================================================================
let ovCount = 0;
const anyOverlay = () => ovCount > 0 || $('menu').classList.contains('on');
async function dlg(o){ ovCount++; $('tip').style.display = 'none'; try { return await Hub.dialog(o); } finally { ovCount--; } }
function overlayBox(inner, width){
  ovCount++; $('tip').style.display = 'none';
  const ov = document.createElement('div'); ov.className = 'h-overlay';
  ov.innerHTML = `<div class="h-dialog" style="${width ? `width:min(${width}px,100%)` : ''}">${inner}</div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
  return {ov, close(){ ov.classList.remove('on'); setTimeout(() => ov.remove(), 220); ovCount--; }};
}
function openAuction(p){
  const bidders = G.rivals.filter(r => r.money > p.price * .9), rival = bidders.length ? pick(bidders) : null;
  const rMax = rival ? Math.min(rival.money * .8, p.price * rnd(.9, 1.9)) : 0;
  const step = Math.max(50, Math.round(p.price * .12 / 50) * 50);
  let cur = p.price, leader = null, busy = false;
  const box = overlayBox(`<h2>Landauktion · Grundstück ${p.i + 1}</h2><div id="aB" style="text-align:center"></div><div class="h-row" id="aR" style="justify-content:center"></div>`);
  const ov = box.ov;
  const render = msg => {
    const next = leader ? cur + step : cur;
    ov.querySelector('#aB').innerHTML = `<p>Was liegt darunter? Niemand weiß es genau …</p><div class="auc">${eur(cur)}</div>
      <p>${leader === 'P' ? '<b style="color:#3fd28b">Du</b> bietest am meisten.' : leader ? `<b style="color:${rival.color}">${rival.name}</b> bietet am meisten!` : 'Noch kein Gebot.'}</p>
      <p style="min-height:22px;color:#ffcf5a">${msg || ''}</p><p style="font-size:13px">Deine Kasse: <b>${eur(G.money)}</b></p>`;
    const row = ov.querySelector('#aR'); row.innerHTML = '';
    const bid = document.createElement('button'); bid.className = 'h-btn oil lg'; bid.textContent = `Bieten: ${eur(next)}`; bid.disabled = busy || G.money < next;
    bid.onclick = () => {
      if (busy || G.money < next) return;
      cur = next; leader = 'P'; busy = true; SFX.click(); render(rival ? `${rival.name} überlegt …` : '');
      setTimeout(() => {
        if (!ov.isConnected) return;
        if (rival && rMax >= cur + step){ cur += step; leader = rival.id; busy = false; tone(300, .1, 'square', .04); render(`${rival.name} erhöht!`); }
        else { busy = false; if (!pay('P', cur)){ box.close(); return; } p.owner = 'P'; SFX.fanfare(); box.close(); feed(`Grundstück ${p.i + 1} gehört jetzt dir! (${eur(cur)})`, 'good', 'check', 5000); Hub.achieve('oel', 'auction', 'Landhai', 'Gewinne eine Landauktion'); }
      }, rival ? 900 : 300);
    };
    const quit = document.createElement('button'); quit.className = 'h-btn lg'; quit.textContent = leader && leader !== 'P' ? 'Aussteigen' : 'Abbrechen';
    quit.onclick = () => { if (busy) return; if (leader && leader !== 'P'){ rival.money -= cur; p.owner = rival.id; feed(`${rival.name} hat Grundstück ${p.i + 1} ersteigert.`, 'bad', 'flame'); } box.close(); };
    row.append(quit, bid);
  };
  render();
}
function openSaloon(after){
  const inYear = G && !G.over && !$('menu').classList.contains('on');
  const getM = () => inYear ? G.money : save.money;
  const box = overlayBox(`<h2>Saloon „Zum Goldenen Fass“</h2><p>Dauerhafte Verbesserungen für alle Städte. Kasse: <b style="color:#ffcf5a" id="sM"></b></p><div class="ups" id="sU"></div><div class="h-row"><button class="h-btn oil lg" id="sX">Fertig</button></div>`, 940);
  const ov = box.ov;
  const render = () => {
    ov.querySelector('#sM').textContent = eur(getM());
    ov.querySelector('#sU').innerHTML = UPS.map(u => {
      const l = upL(u.id), maxed = l >= u.max, c = upCost(u);
      return `<div class="upg"><div class="ui">${I(u.icon)}</div><div class="ut"><b>${u.name}</b><small>${u.desc(Math.max(1, maxed ? l : l + 1))}</small>
        <div class="pips">${Array.from({length:u.max}, (_, k) => `<i class="${k < l ? 'on' : ''}"></i>`).join('')}</div></div>
        ${maxed ? '<b style="color:#3fd28b;font-size:13px">MAX</b>' : `<button class="h-btn sm ${getM() >= c ? 'oil' : ''}" data-up="${u.id}" ${getM() >= c ? '' : 'disabled'}>${eur(c)}</button>`}</div>`;
    }).join('');
    ov.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
      const u = UPS.find(x => x.id === b.dataset.up), c = upCost(u);
      if (getM() < c) return;
      if (inYear) G.money -= c;
      save.money = Math.max(0, save.money - c);
      save.up[u.id] = upL(u.id) + 1; writeSave(); SFX.fanfare(); render();
    });
  };
  render();
  ov.querySelector('#sX').onclick = () => { box.close(); if (after) after(); else if ($('menu').classList.contains('on')) renderMenu(); };
}
function openHow(){
  dlg({title:'So wird gespielt', html:`<ol class="howto">
    <li><b>Bohrturm bauen:</b> Klick auf dein <span style="color:#3fd28b">grünes Land</span> (oder Werkzeug „Bohrturm“, Taste B). Das Jahr startet mit deinem ersten Turm.</li>
    <li><b>Bohren:</b> Klick auf deinen Turm und dann <b>in den Boden</b> – oder zieh mit gedrückter Maus. Von jedem Rohr kannst du abzweigen.</li>
    <li><b>Öl finden:</b> Schwarze Blasen sind Öl. <b>Rutengänger</b>, <b>Echolot</b> und <b>Maulwurf</b> decken den Boden auf. Grüne Gasblasen explodieren, graue Felsen stoppen den Bohrer.</li>
    <li><b>Transport:</b> <b>Pferdewagen</b> (Taste W) holen das Öl und verkaufen es an der Raffinerie mit dem besseren Preis.</li>
    <li><b>Markt:</b> Die Preise in West und Ost schwanken. Viel Verkauf an einer Stelle drückt den Preis! Klick auf eine Raffinerie, um alle Wagen dorthin zu schicken.</li>
    <li><b>Land:</b> Klick auf ein „Zu verkaufen“-Schild und gewinne die Auktion gegen die Konkurrenz.</li>
    <li><b>Ziel:</b> Verdiene das Jahresziel für Sterne und schalte neue Städte frei. Im <b>Saloon</b> kaufst du dauerhafte Upgrades.</li></ol>
    <p>Kamera: Mausrad, <kbd>A</kbd> <kbd>D</kbd>, Pfeiltasten, Übersichtskarte oder rechte Maustaste ziehen. <kbd>Leertaste</kbd> Pause · <kbd>1</kbd>–<kbd>3</kbd> Tempo · <kbd>Esc</kbd> abbrechen · <kbd>Shift</kbd> beim Platzieren = Werkzeug behalten.</p>`,
    buttons:[{label:'Verstanden', primary:true}]});
}
const starSvg = on => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? '#ffcf5a' : '#3a2e24'}" stroke="${on ? '#fff3c4' : '#4a3a2a'}" stroke-width="1"/></svg>`;
function endYear(){
  if (G.over) return;
  G.over = true; aim = null; setTool(null);
  const avg = (G.market.L.p + G.market.R.p) / 2;
  const rest = G.rigs.filter(r => r.owner === 'P').reduce((a, r) => a + r.tank, 0) + G.wagons.filter(w => w.owner === 'P').reduce((a, w) => a + w.load, 0);
  const restVal = rest * avg * .5;
  G.money += restVal; G.earned += restVal; G.me.earned += restVal;
  const goal = G.cfg.goal, earned = G.earned, st = earned >= goal * 2 ? 3 : earned >= goal * 1.5 ? 2 : earned >= goal ? 1 : 0;
  const newTown = st >= 1 && save.unlocked <= G.n;
  save.stars[G.n] = Math.max(save.stars[G.n] || 0, st); save.best[G.n] = Math.max(save.best[G.n] || 0, earned);
  if (st >= 1) save.unlocked = Math.max(save.unlocked, G.n + 1);
  save.money = G.money; save.years++;
  if (G.tut) save.tut = true;
  writeSave();
  Hub.score('oel', Math.round(earned), {label:'Bestes Jahr (€)', silent:true});
  if (st >= 1) Hub.achieve('oel', 'first_year', 'Erstes Ölrausch-Jahr', 'Schließe ein Jahr erfolgreich ab');
  if (st === 3) Hub.achieve('oel', 'three', 'Ölbaron', 'Hol 3 Sterne in einer Stadt');
  if (save.unlocked >= 5) Hub.achieve('oel', 'town5', 'Wanderer', 'Schalte die fünfte Stadt frei');
  if (G.money >= 100000) Hub.achieve('oel', 'rich', 'Steinreich', 'Hab 100.000 € in der Kasse');
  const all = [G.me, ...G.rivals].sort((a, b) => b.earned - a.earned), place = all.indexOf(G.me) + 1;
  if (place === 1 && G.rivals.length) Hub.achieve('oel', 'top', 'Nummer 1', 'Verdiene in einer Stadt mehr als alle Rivalen');
  st ? SFX.fanfare() : SFX.bad();
  const nextT = townCfg(G.n + 1);
  const buttons = [{label:'Saloon', value:'saloon'}, {label:'Nochmal', value:'retry'}, {label:'Karte', value:'map'}];
  if (st) buttons.push({label:`Weiter nach ${nextT.name}`, value:'next', cls:'oil'});
  dlg({title: st ? `Jahr geschafft in ${G.cfg.name}!` : 'Ziel verfehlt …', center:true, dismiss:false, buttons,
    html:`<div class="bigstars">${[1, 2, 3].map(k => `<span class="s" style="animation-delay:${k * .18}s">${starSvg(k <= st)}</span>`).join('')}</div>
      <div class="res"><span>Verdient</span><span>${eur(earned)}</span><span>Ziel ★ / ★★ / ★★★</span><span>${eur(goal)} / ${eur(goal * 1.5)} / ${eur(goal * 2)}</span>
        <span>Fass verkauft</span><span>${fmt(G.stats.fass)}</span><span>Gebohrte Meter</span><span>${fmt(G.stats.meters)} m</span><span>Ölquellen gefunden</span><span>${G.stats.found}</span>
        <span>Restöl (${fmt(rest)} Fass) verkauft</span><span>${eur(restVal)}</span><span>Firmenkasse</span><span style="color:#ffcf5a">${eur(G.money)}</span></div>
      <h3 style="margin:6px 0">${place === 1 ? 'Du bist die Nummer 1 der Stadt!' : `Platz ${place} von ${all.length}`}</h3>
      <div class="rank">${all.map(o => `<div style="border-color:${o.color}"><span>${o.id === 'P' ? 'Deine Firma' : o.name}</span><b>${eur(o.earned)}</b></div>`).join('')}</div>
      ${newTown ? `<p style="color:#ffcf5a">Neue Stadt freigeschaltet: <b>${nextT.name}</b></p>` : st ? '' : '<p>Tipp: Kauf im Saloon Upgrades und probier es nochmal!</p>'}`}).then(v => {
    if (v === 'next') startYear(G.n + 1);
    else if (v === 'retry') startYear(G.n);
    else if (v === 'saloon') openSaloon(() => openMenu());
    else openMenu();
  });
}

// ---------- Kampagnenkarte ----------
let selTown = null;
function openMenu(){ $('menu').classList.add('on'); $('tip').style.display = 'none'; if (selTown == null) selTown = Math.min(save.unlocked, 999); renderMenu(); }
function hideMenu(){ $('menu').classList.remove('on'); }
function renderMenu(){
  const page = Math.floor(Math.max(selTown, 0) / TOWNS.length) * TOWNS.length;
  const nodes = TOWNS.map((t, k) => ({...t, n:page + k}));
  const path = 'M' + nodes.map(t => `${t.x} ${t.y}`).join(' L');
  const r = mulberry(7 + page);
  let dunes = ''; for (let k = 0; k < 16; k++){ const x = r() * 1000, y = 120 + r() * 560, w = 80 + r() * 160; dunes += `<path d="M${x - w} ${y} Q ${x} ${y - 30 - r() * 30} ${x + w} ${y}" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="3"/>`; }
  let cacti = ''; for (let k = 0; k < 22; k++){ const x = r() * 1000, y = 140 + r() * 540, s = .6 + r() * .7; cacti += `<g transform="translate(${x} ${y}) scale(${s})" fill="#3d5a2a" opacity=".7"><rect x="-3" y="-22" width="6" height="22" rx="3"/><rect x="-11" y="-16" width="5" height="10" rx="2.5"/><rect x="-11" y="-8" width="10" height="4" rx="2"/><rect x="6" y="-19" width="5" height="10" rx="2.5"/><rect x="1" y="-11" width="10" height="4" rx="2"/></g>`; }
  let mesas = ''; for (const [x, y, w, h] of [[80, 120, 160, 50], [420, 90, 220, 60], [880, 70, 150, 50], [300, 640, 180, 40], [940, 600, 120, 40]]) mesas += `<path d="M${x - w / 2} ${y} L${x - w / 2 + 20} ${y - h} L${x + w / 2 - 20} ${y - h} L${x + w / 2} ${y}Z" fill="#8a4a26" opacity=".55"/>`;
  const pager = (page > 0 ? `<g class="node" data-page="${page - TOWNS.length}" transform="translate(60 650)"><circle r="22" fill="#3a1c06"/><path d="M5 -9 L-5 0 L5 9" fill="none" stroke="#fff" stroke-width="3"/></g>` : '')
    + (save.unlocked >= page + TOWNS.length ? `<g class="node" data-page="${page + TOWNS.length}" transform="translate(940 650)"><circle r="22" fill="#3a1c06"/><path d="M-5 -9 L5 0 L-5 9" fill="none" stroke="#fff" stroke-width="3"/></g>` : '');
  $('map').innerHTML = `<defs><radialGradient id="mg" cx="45%" cy="55%" r="75%"><stop offset="0" stop-color="#e8a868"/><stop offset=".6" stop-color="#c47a40"/><stop offset="1" stop-color="#6a3416"/></radialGradient>
      <filter id="mn"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0"/></filter></defs>
    <rect width="1000" height="700" fill="url(#mg)"/><rect width="1000" height="700" filter="url(#mn)"/>${dunes}${mesas}${cacti}
    <path d="${path}" fill="none" stroke="#5a2e12" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>
    <path d="${path}" fill="none" stroke="#fff3d6" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" stroke-linejoin="round"/>
    ${nodes.map(t => {
      const locked = t.n > save.unlocked, s = save.stars[t.n] || 0, sel = t.n === selTown, cur = t.n === save.unlocked;
      return `<g class="node" data-n="${t.n}" transform="translate(${t.x} ${t.y})" opacity="${locked ? .55 : 1}">
        ${cur ? '<circle r="30" fill="none" stroke="#fff" stroke-width="2" opacity=".7"><animate attributeName="r" values="22;34;22" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0;.8" dur="2s" repeatCount="indefinite"/></circle>' : ''}
        <circle class="nr" r="${sel ? 22 : 18}" fill="${locked ? '#5a4a3a' : s ? '#ffb04a' : '#fff3d6'}" stroke="${sel ? '#fff' : '#3a1c06'}" stroke-width="${sel ? 5 : 3}"/>
        ${locked ? '<path d="M-6 -2 h12 v10 h-12z M-4 -2 v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="#2a1a0e" stroke-width="2.2"/>' : `<text y="6" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="16" fill="#3a1c06">${t.n + 1}</text>`}
        <text y="44" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="17" fill="#fff" stroke="#3a1c06" stroke-width="4" paint-order="stroke">${townCfg(t.n).name}</text>
        <text y="64" text-anchor="middle" font-size="15" fill="#ffcf5a" stroke="#3a1c06" stroke-width="3" paint-order="stroke">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</text></g>`;
    }).join('')}${pager}`;
  $('map').querySelectorAll('.node').forEach(n => n.onclick = () => { selTown = n.dataset.page != null ? +n.dataset.page : +n.dataset.n; Hub.sfx('click'); renderMenu(); });
  const c = townCfg(selTown), locked = selTown > save.unlocked, s = save.stars[selTown] || 0;
  $('mKasse').textContent = eur(G && !G.over ? G.money : save.money);
  $('brief').innerHTML = `<div class="stars">${[1, 2, 3].map(k => k <= s ? '★' : '<span class="off">★</span>').join('')}</div><h3>${c.name}</h3><p>${c.txt}</p>
    <div class="facts"><div><small>Jahresziel</small><b>${eur(c.goal)}</b></div><div><small>Rivalen</small><b>${c.rivals}</b></div>
      <div><small>Ölpreis</small><b>≈ ${fmt(c.base)} €/Fass</b></div><div><small>Besonderheit</small><b>${MODTXT[c.mod]}</b></div>
      <div><small>Bestes Jahr</small><b>${save.best[selTown] ? eur(save.best[selTown]) : '–'}</b></div><div><small>Für 3 Sterne</small><b>${eur(c.goal * 2)}</b></div></div>`;
  const cont = G && !G.over && G.n === selTown;
  $('mPlay').innerHTML = `${I('play')}${locked ? 'Noch gesperrt' : cont && G.started ? 'Weiterspielen' : 'Jahr starten'}`;
  $('mPlay').disabled = locked;
  $('mPlay').onclick = async () => {
    if (cont){ hideMenu(); return; }
    if (G && !G.over && G.started){
      const ok = await dlg({title:'Laufendes Jahr abbrechen?', html:'<p>Dein aktuelles Jahr geht verloren. Die Kasse wird auf den Stand vom Jahresanfang zurückgesetzt.</p>', buttons:[{label:'Nein', value:false}, {label:'Ja, neue Stadt', value:true, cls:'danger'}]});
      if (!ok) return;
    }
    startYear(selTown);
  };
}
$('mSaloon').onclick = () => openSaloon();
$('mHow').onclick = () => openHow();

// =====================================================================
//  TUTORIAL
// =====================================================================
const TUT = [null,
  'Willkommen in Ölhausen! Das <b>grüne Grundstück</b> gehört dir. <b>Klick auf dein Land</b>, um dort einen Bohrturm zu bauen.',
  'Klasse! Jetzt <b>klick auf deinen Bohrturm</b> und danach <b>in den Boden</b> – genau auf die schwarze Ölblase.',
  'Öl fließt in den Tank! Kauf jetzt unten einen <b>Pferdewagen</b> (Taste W). Er bringt das Öl zur Raffinerie.',
  'Super! Die Wagen verkaufen automatisch zum <b>besten Preis</b> (oben West/Ost). Mehr Öl findest du mit <b>Rutengänger</b>, <b>Echolot</b> und <b>Maulwurf</b>.',
];
function showTut(){
  const t = $('tut');
  if (!G || !G.tut){ t.classList.remove('on'); return; }
  t.innerHTML = `<span class="step">Schritt ${G.tut}/4</span><span class="tx">${TUT[G.tut]}</span><button class="h-btn sm ghost" id="tutSkip">Überspringen</button>`;
  t.classList.add('on');
  $('tutSkip').onclick = () => { G.tut = 0; save.tut = true; writeSave(); showTut(); };
}
function tutTick(dt){
  if (!G.tut) return;
  const mine = G.rigs.filter(r => r.owner === 'P');
  let n = G.tut;
  if (n === 1 && mine.length) n = 2;
  if (n === 2 && mine.some(r => r.branches.some(b => b.state === 'pump'))) n = 3;
  if (n === 3 && G.wagons.some(w => w.owner === 'P')) n = 4;
  if (n === 4){ G.tutT += dt; if (G.tutT > 16){ G.tut = 0; save.tut = true; writeSave(); showTut(); return; } }
  if (n !== G.tut){ G.tut = n; SFX.good(); showTut(); }
}
function drawTutTarget(now){
  if (!G.tut) return;
  let x = null, y = null;
  if (G.tut === 1){ const p = G.plots.find(p => p.owner === 'P'); x = (p.x0 + p.x1) / 2; y = SURF_Y - 40; }
  if (G.tut === 2){
    const r = G.rigs.find(r => r.owner === 'P'), p = G.firstPocket;
    if (r && !aim){ x = r.x; y = SURF_Y - 50; }
    else if (p && p.cells.length){ const i = p.cells[Math.floor(p.cells.length / 2)]; x = cellX(i); y = cellY(i); }
  }
  if (x === null) return;
  const p = (now / 900) % 1;
  ctx.strokeStyle = `rgba(185,164,255,${1 - p})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 18 + p * 30, 0, 7); ctx.stroke();
  ctx.fillStyle = '#b9a4ff'; const bob = Math.sin(now / 200) * 5;
  ctx.beginPath(); ctx.moveTo(x, y - 30 + bob); ctx.lineTo(x - 10, y - 46 + bob); ctx.lineTo(x + 10, y - 46 + bob); ctx.fill();
}

// =====================================================================
//  HAUPTSCHLEIFE
// =====================================================================
let last = performance.now();
function frame(now){
  const rdt = Math.min(.05, (now - last) / 1000); last = now;
  if (G && !G.over && !anyOverlay()){
    for (let k = 0; k < G.speed; k++) update(rdt);
    const kv = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0);
    if (kv) camX = clamp(camX + kv * 800 * rdt, 0, maxCam());
    if (aim && mouse.in){
      if (mouse.sx < 40) camX = clamp(camX - 600 * rdt, 0, maxCam());
      if (mouse.sx > cv.clientWidth - 40) camX = clamp(camX + 600 * rdt, 0, maxCam());
      mouse.wx = mouse.sx / scale - offX + camX;
    }
  }
  composeT -= rdt;
  if ((oilDirty || maskDirty) && composeT <= 0){ if (oilDirty) redrawOil(); compose(); composeT = .08; }
  draw();
  hud(rdt);
  requestAnimationFrame(frame);
}
setInterval(() => { if (G && !G.over && !anyOverlay() && (!G.sel || G.wagons.includes(G.sel))) renderSel(); }, 700);
resize();
startYear(Math.min(save.unlocked, 999));
openMenu();
requestAnimationFrame(frame);
