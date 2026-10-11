/* =====================================================================
   Spielhalle – Slot-Engine (Spielgeld)
   Unterstützt: Gewinnlinien oder 243 Wege, Wild, Scatter, Freispiele,
   Buch-Feature (expandierendes Symbol), Zwillingswalzen, Glücksrad,
   Risikospiel (Rot/Schwarz), Autospin, Turbo.
   ===================================================================== */
window.HubSlot = function(cfg){
  const R = cfg.reels || 5, ROWS = cfg.rows || 3, S = 150, PAD = 20;
  const CW = R * S + PAD * 2, CH = ROWS * S + PAD * 2;
  const th = Object.assign({bg:'#120a24', frame:'#d9a520', accent:'#ffd23f', text:'#fff', glow:'rgba(255,210,63,.5)', panel:'rgba(0,0,0,.45)'}, cfg.theme || {});
  const SYM = cfg.symbols, KEYS = Object.keys(SYM);
  const wildKey = KEYS.find(k => SYM[k].wild), scatKey = KEYS.find(k => SYM[k].scatter);
  const lines = cfg.lines || [];

  // ---------- Layout ----------
  const css = document.createElement('style');
  css.textContent = `
  html,body{height:100%;overflow:hidden}
  body{display:flex;flex-direction:column;background:${th.bg}}
  .sl-wrap{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:10px}
  .sl-title{font-family:var(--font-display);font-size:clamp(26px,4vh,44px);font-weight:700;letter-spacing:4px;color:${th.accent};text-shadow:0 0 24px ${th.glow},0 3px 0 rgba(0,0,0,.4)}
  .sl-mach{position:relative;padding:14px;border-radius:26px;background:${th.frameBg || `linear-gradient(180deg,${th.frame},#5a3a08)`};box-shadow:0 30px 80px rgba(0,0,0,.7),inset 0 2px 0 rgba(255,255,255,.35)}
  .sl-mach canvas{display:block;border-radius:16px;height:min(56vh,${CH}px);max-width:92vw;object-fit:contain;background:#000}
  .sl-info{position:absolute;left:50%;bottom:-18px;transform:translateX(-50%);padding:6px 22px;border-radius:999px;background:#000;border:2px solid ${th.frame};font-family:var(--font-display);font-weight:600;font-size:17px;color:${th.accent};white-space:nowrap;min-width:260px;text-align:center}
  .sl-fs{position:absolute;left:50%;top:-16px;transform:translateX(-50%);padding:5px 18px;border-radius:999px;background:linear-gradient(90deg,#ff3d8b,#ff9a2e);color:#fff;font-weight:800;letter-spacing:1px;font-size:14px;display:none;box-shadow:0 0 20px rgba(255,61,139,.6)}
  .sl-ctrl{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;margin-top:16px;padding:10px 16px;border-radius:18px;background:${th.panel};border:1px solid rgba(255,255,255,.1)}
  .sl-box{min-width:110px;text-align:center;font-family:var(--font-display)}
  .sl-box small{display:block;font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.55);font-weight:700}
  .sl-box b{font-size:22px;color:#fff}
  .sl-spin{width:86px;height:86px;border-radius:50%;border:0;cursor:pointer;font-family:var(--font-display);font-weight:800;font-size:16px;letter-spacing:1px;color:#2a1c00;
    background:radial-gradient(circle at 40% 35%,#fff6b0,${th.accent} 45%,#b07a00);box-shadow:0 6px 0 #6a4800,0 10px 30px ${th.glow};transition:transform .1s}
  .sl-spin:active{transform:translateY(4px);box-shadow:0 2px 0 #6a4800}
  .sl-spin:disabled{filter:grayscale(.6) brightness(.7);cursor:default}
  .sl-spin.auto{background:radial-gradient(circle at 40% 35%,#c8ffd8,#3fd28b 45%,#118a4a);box-shadow:0 6px 0 #0a5a2e,0 10px 30px rgba(63,210,139,.5)}
  .sl-ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);z-index:20;text-align:center}
  .sl-ov.on{display:flex}
  .sl-ov h2{margin:0;font-family:var(--font-display);font-size:54px;color:${th.accent};text-shadow:0 0 30px ${th.glow}}
  .sl-ov p{color:#fff;font-size:18px;margin:0}
  .sl-big{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:15;flex-direction:column}
  .sl-big b{font-family:var(--font-display);font-size:clamp(40px,8vh,84px);color:${th.accent};text-shadow:0 0 40px ${th.glow},0 6px 0 rgba(0,0,0,.5);opacity:0;transform:scale(.5)}
  .sl-big span{font-family:var(--font-display);font-size:clamp(30px,6vh,60px);color:#fff;opacity:0}
  .sl-big.on b,.sl-big.on span{animation:slb 2.6s ease forwards}
  @keyframes slb{12%{opacity:1;transform:scale(1.12)}25%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(1.1)}}
  .gcard{width:120px;height:170px;border-radius:12px;background:repeating-linear-gradient(45deg,#8b1d2c 0 6px,#a8243a 6px 12px);border:5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:70px;font-family:'Segoe UI Symbol';box-shadow:0 10px 30px rgba(0,0,0,.6)}
  .gcard.f{background:#fff}
  .ghist{display:flex;gap:6px;font-size:22px;font-family:'Segoe UI Symbol'}
  .wheel{width:min(420px,70vh);height:min(420px,70vh)}
  .ptab{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .ptab div{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.04);border-radius:10px;padding:6px}
  .ptab canvas{width:54px;height:54px;border-radius:8px}
  .ptab small{color:var(--text-2);font-size:12px;line-height:1.5}`;
  document.head.appendChild(css);
  const wrap = document.createElement('div'); wrap.className = 'sl-wrap';
  wrap.innerHTML = `<div class="sl-title">${cfg.logoText || cfg.title}</div>
    <div class="sl-mach"><div class="sl-fs" id="slFs"></div><canvas id="slCv" width="${CW}" height="${CH}"></canvas><div class="sl-info" id="slInfo">Viel Glück!</div></div>
    <div class="sl-ctrl">
      <div class="sl-box"><small>CHIPS</small><b id="slBal">0</b></div>
      <button class="h-btn icon" id="slMinus">−</button><div class="sl-box"><small>EINSATZ</small><b id="slBet">0</b></div><button class="h-btn icon" id="slPlus">+</button>
      <button class="sl-spin" id="slSpin">DREHEN</button>
      <div class="sl-box"><small>GEWINN</small><b id="slWin">0</b></div>
      <button class="h-btn" id="slAuto">Auto</button><button class="h-btn" id="slTurbo">Turbo</button>${cfg.gamble ? '<button class="h-btn" id="slGamble" disabled>Risiko</button>' : ''}<button class="h-btn ghost" id="slPay">Gewinntabelle</button>
    </div>
    <div class="sl-big" id="slBig"><b></b><span></span></div>
    <div class="sl-ov" id="slOv"></div>`;
  document.body.appendChild(wrap);
  const $ = id => document.getElementById(id), cv = $('slCv'), ctx = cv.getContext('2d');

  // ---------- Symbole vorrendern ----------
  const art = {};
  function renderSym(k, size = S){
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), s = SYM[k], m = size * .06;
    const pg = g.createLinearGradient(0, 0, 0, size); pg.addColorStop(0, s.plate ? s.plate[0] : 'rgba(255,255,255,.06)'); pg.addColorStop(1, s.plate ? s.plate[1] : 'rgba(255,255,255,.01)');
    g.fillStyle = pg; g.beginPath(); g.roundRect ? g.roundRect(m, m, size - 2 * m, size - 2 * m, size * .12) : g.rect(m, m, size - 2 * m, size - 2 * m); g.fill();
    if (s.draw) s.draw(g, size);
    else if (s.txt){
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${s.weight || 800} ${size * (s.fs || .52)}px ${s.font || 'Bahnschrift, Segoe UI'}`;
      const tg = g.createLinearGradient(0, size * .25, 0, size * .75); tg.addColorStop(0, s.col[0]); tg.addColorStop(1, s.col[1]);
      g.lineWidth = size * .05; g.strokeStyle = s.stroke || 'rgba(0,0,0,.7)'; g.strokeText(s.txt, size / 2, size * .54);
      g.fillStyle = tg; g.fillText(s.txt, size / 2, size * .54);
      g.globalAlpha = .35; g.fillStyle = '#fff'; g.font = `${s.weight || 800} ${size * (s.fs || .52)}px ${s.font || 'Bahnschrift, Segoe UI'}`; g.save(); g.beginPath(); g.rect(0, 0, size, size * .47); g.clip(); g.fillText(s.txt, size / 2, size * .54); g.restore(); g.globalAlpha = 1;
    } else {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${size * (s.fs || .6)}px "Segoe UI Emoji"`;
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = size * .08; g.shadowOffsetY = size * .03;
      g.fillText(s.emoji, size / 2, size * .55);
    }
    if (s.label){ g.shadowBlur = 0; g.font = `800 ${size * .13}px Bahnschrift`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(s.label, size / 2, size * .88); g.fillStyle = th.accent; g.fillText(s.label, size / 2, size * .88); }
    return c;
  }
  KEYS.forEach(k => art[k] = renderSym(k));

  // ---------- Zustand ----------
  const bets = cfg.bets || [10, 20, 50, 100, 200, 500];
  let betIdx = Math.min(bets.length - 1, Hub.read(cfg.id + '_bet', 1));
  let curFree = false, grid = [], reelState = [], spinning = false, auto = false, turbo = false, freeSpins = 0, fsTotal = 0, fsWin = 0, special = null, lastWin = 0, wins = [], winT = 0, gambleable = 0, expanded = [], twins = [], t = 0, parts = [];
  const randKey = (r) => { const strip = cfg.strips[r]; return strip[Math.floor(Math.random() * strip.length)]; };
  for (let r = 0; r < R; r++){ grid.push([]); for (let y = 0; y < ROWS; y++) grid[r].push(randKey(r)); reelState.push({off:0, spinning:false, strip:[], speed:0}); }

  function updUI(){
    $('slBal').textContent = Hub.chips.fmt(Hub.chips.get()); $('slBet').textContent = Hub.chips.fmt(bets[betIdx]); $('slWin').textContent = Hub.chips.fmt(lastWin);
    $('slSpin').disabled = spinning && !auto; $('slSpin').classList.toggle('auto', auto); $('slSpin').textContent = auto ? 'STOPP' : freeSpins > 0 ? 'FREI' : 'DREHEN';
    $('slTurbo').classList.toggle('primary', turbo); $('slMinus').disabled = $('slPlus').disabled = spinning || freeSpins > 0;
    if ($('slGamble')) $('slGamble').disabled = !(gambleable > 0 && !spinning && !auto && freeSpins === 0);
    const fs = $('slFs'); fs.style.display = freeSpins > 0 || fsTotal > 0 && spinning ? 'block' : 'none'; fs.textContent = `FREISPIELE: ${freeSpins} · GEWONNEN ${Hub.chips.fmt(fsWin)}`;
    if (cfg.onUI) cfg.onUI({bet:bets[betIdx]});
  }
  const info = t2 => $('slInfo').textContent = t2;

  // ---------- Auswertung ----------
  function evalLines(g, bet){
    const lb = bet / lines.length, out = [];
    lines.forEach((ln, li) => {
      const syms = ln.map((row, r) => g[r][row]);
      let base = syms.find(s => s !== wildKey && !(SYM[s].scatter && !SYM[s].wild)) ;
      if (cfg.feature === 'book') base = syms.find(s => s !== wildKey);
      const evalFor = b => { let n = 0; for (const s of syms){ if (s === b || (s === wildKey && !(SYM[b] && SYM[b].scatter && !SYM[b].wild))) n++; else break; } return n; };
      let best = null;
      const cands = new Set([base, wildKey].filter(Boolean));
      cands.forEach(b => { if (!SYM[b].pays || (SYM[b].scatter && !SYM[b].linePays)) return; const n = b === wildKey ? (() => { let k = 0; for (const s of syms){ if (s === wildKey) k++; else break; } return k; })() : evalFor(b); const p = SYM[b].pays[n]; if (p && (!best || p * lb > best.win)) best = {sym:b, n, win:p * lb}; });
      if (best) out.push({line:li, sym:best.sym, pos:ln.slice(0, best.n).map((row, r) => [r, row]), win:best.win});
    });
    return out;
  }
  function evalWays(g, bet){
    const unit = bet / (cfg.waysDiv || 25), out = [];
    KEYS.forEach(k => {
      if (SYM[k].scatter || k === wildKey || !SYM[k].pays) return;
      let ways = 1, n = 0; const pos = [];
      for (let r = 0; r < R; r++){
        const hits = []; for (let y = 0; y < ROWS; y++) if (g[r][y] === k || g[r][y] === wildKey) hits.push([r, y]);
        if (!hits.length) break; ways *= hits.length; n++; pos.push(...hits);
      }
      const p = SYM[k].pays[n];
      if (p){ if (pos.every(([r, y]) => g[r][y] === wildKey)) return; out.push({sym:k, pos, win:p * unit * ways, ways, n}); }
    });
    return out;
  }
  function scatters(g){ const pos = []; if (!scatKey) return pos; g.forEach((col, r) => col.forEach((s, y) => { if (s === scatKey) pos.push([r, y]); })); return pos; }
  function evaluate(bet){
    let ws = cfg.ways ? evalWays(grid, bet) : evalLines(grid, bet);
    const sc = scatters(grid), sp = scatKey && SYM[scatKey].scatterPays;
    if (sp && sp[sc.length]) ws.push({sym:scatKey, pos:sc, win:sp[sc.length] * bet, scatter:true});
    // Buch: expandierendes Spezialsymbol in den Freispielen
    expanded = [];
    if (cfg.feature === 'book' && curFree && special){
      const reels = []; grid.forEach((col, r) => { if (col.includes(special)) reels.push(r); });
      const minN = Math.min(...Object.keys(SYM[special].pays).map(Number));
      if (reels.length >= minN){
        expanded = reels;
        const lb = bet / lines.length, win = SYM[special].pays[reels.length] * lb * lines.length;
        ws.push({sym:special, pos:reels.flatMap(r => [0, 1, 2].map(y => [r, y])), win, expand:true});
      }
    }
    return ws;
  }

  // ---------- Drehen ----------
  function genGrid(){
    const g = [];
    for (let r = 0; r < R; r++){ const col = []; for (let y = 0; y < ROWS; y++){ let k = randKey(r); if (SYM[k].scatter && col.includes(k)) k = randKey(r); col.push(k); } g.push(col); }
    twins = [];
    if (cfg.feature === 'twin'){
      // Zwillingswalzen: 2 (manchmal 3–5) nebeneinanderliegende identische Walzen
      const roll = Math.random(); let n = roll < .015 ? 5 : roll < .05 ? 4 : roll < .16 ? 3 : 2;
      if (curFree) n = Math.max(n, roll < .3 ? 4 : 3);
      const start = Math.floor(Math.random() * (R - n + 1));
      for (let r = start; r < start + n; r++){ g[r] = g[start].slice(); twins.push(r); }
    }
    return g;
  }
  async function spin(){
    if (spinning) return;
    const bet = bets[betIdx], free = freeSpins > 0;
    if (!free){
      if (Hub.chips.get() < bet){ auto = false; updUI(); broke(); return; }
      Hub.chips.add(-bet);
    } else { freeSpins--; }
    curFree = free;
    spinning = true; wins = []; lastWin = 0; gambleable = 0; expanded = []; updUI(); info(free ? 'Freispiel …' : 'Viel Glück!');
    const target = genGrid();
    const scBefore = [];
    const base = turbo ? .35 : .75, gap = turbo ? .12 : .28;
    reelState.forEach((rs, r) => { rs.spinning = true; rs.speed = 0; rs.off = 0; rs.stopAt = t + base + r * gap; rs.target = target[r]; rs.strip = Array.from({length:4}, () => randKey(r)); rs.ant = false; });
    // Spannung: zwei Scatter auf den ersten Walzen -> restliche verlangsamen
    let scCount = 0;
    for (let r = 0; r < R; r++){
      if (scCount >= 2 && cfg.anticipation !== false){ for (let q = r; q < R; q++){ reelState[q].stopAt += 1.1 * (q - r + 1) * (turbo ? .5 : 1); reelState[q].ant = true; } break; }
      scCount += target[r].filter(s => s === scatKey).length;
    }
    Hub.tone(220, .08, 'triangle', .03);
    await new Promise(res => { const chk = () => { if (reelState.every(rs => !rs.spinning)) res(); else setTimeout(chk, 30); }; chk(); });
    grid = target;
    const bet2 = free ? fsBet : bet;
    wins = evaluate(bet2);
    let total = wins.reduce((a, w) => a + w.win, 0);
    total = Math.round(total);
    if (expanded.length){ await expandAnim(); }
    if (total > 0){
      lastWin = total; Hub.chips.add(total); if (free) fsWin += total;
      winT = 0; showWin(total, bet2);
      if (!free) gambleable = total;
    } else info(free ? `Noch ${freeSpins} Freispiele` : 'Leider nichts – nochmal!');
    if (cfg.onWin) cfg.onWin(total, bet2, wins);
    // Feature-Auslöser
    const sc = scatters(grid).length;
    if (cfg.feature === 'book' && sc >= 3){ await triggerBook(sc); }
    if (cfg.feature === 'wheel' && sc >= 3){ await wheel(bet2); }
    if (cfg.feature === 'twin' && sc >= 3 && cfg.twinFree){ await triggerFree(cfg.twinFree, bet2, 'Freispiele!'); }
    spinning = false;
    if (fsTotal && freeSpins === 0){ fsTotal = 0; special = null; await endFree(); }
    updUI();
    Hub.score(cfg.id, Hub.chips.get(), {label:'Chips', silent:true});
    if (lastWin >= bet2 * 50) Hub.achieve(cfg.id, 'mega', 'Mega-Gewinn', `Gewinne mindestens das 50-fache des Einsatzes in ${cfg.title}`);
    if (lastWin > 0) Hub.achieve(cfg.id, 'win', 'Erster Treffer', `Erziele einen Gewinn in ${cfg.title}`);
    if (Hub.chips.get() >= 25000) Hub.achieve(cfg.id, 'rich', 'Chip-Millionär (fast)', 'Besitze 25 000 Chips');
    if (auto || freeSpins > 0){ await new Promise(r => setTimeout(r, total > 0 ? (turbo ? 700 : 1500) : (turbo ? 150 : 350))); if (auto || freeSpins > 0) spin(); }
  }
  let fsBet = 0;
  async function triggerBook(sc){
    const keys = KEYS.filter(k => !SYM[k].scatter && !SYM[k].wild);
    const add = cfg.freeSpins || 10;
    if (!fsTotal){ fsBet = bets[betIdx]; fsWin = 0; }
    freeSpins += add; fsTotal += add;
    Hub.sfx('ach'); auto = false;
    if (!special){
      // Spezialsymbol per Buch-Animation wählen
      const ov = $('slOv'); ov.classList.add('on');
      ov.innerHTML = `<h2>${add} FREISPIELE!</h2><p>Das Buch wählt dein Spezialsymbol …</p><canvas id="slPick" width="220" height="220" style="width:220px;height:220px;border-radius:20px;box-shadow:0 0 40px ${th.glow}"></canvas>`;
      const pc = $('slPick').getContext('2d'); special = keys[Math.floor(Math.random() * keys.length)];
      for (let k = 0; k < 22; k++){ const key = k < 21 ? keys[k % keys.length] : special; pc.clearRect(0, 0, 220, 220); pc.drawImage(art[key], 0, 0, 220, 220); Hub.tone(500 + k * 30, .04, 'square', .03); await new Promise(r => setTimeout(r, 60 + k * 9)); }
      Hub.tone(880, .3, 'triangle', .05); Hub.tone(1320, .4, 'triangle', .05, .15);
      ov.insertAdjacentHTML('beforeend', `<p><b>${SYM[special].name}</b> expandiert über die ganze Walze!</p>`);
      await new Promise(r => setTimeout(r, 1800)); ov.classList.remove('on');
    } else { info(`+${add} Freispiele!`); await new Promise(r => setTimeout(r, 1200)); }
    Hub.achieve(cfg.id, 'free', 'Freispiele!', `Löse Freispiele in ${cfg.title} aus`);
  }
  async function triggerFree(n, bet, title){
    if (!fsTotal){ fsBet = bet; fsWin = 0; }
    freeSpins += n; fsTotal += n; auto = false; Hub.sfx('ach');
    const ov = $('slOv'); ov.classList.add('on'); ov.innerHTML = `<h2>${title}</h2><p>${n} Freispiele mit Zwillingswalzen!</p>`;
    await new Promise(r => setTimeout(r, 1800)); ov.classList.remove('on');
    Hub.achieve(cfg.id, 'free', 'Freispiele!', `Löse Freispiele in ${cfg.title} aus`);
  }
  async function endFree(){
    const ov = $('slOv'); ov.classList.add('on');
    ov.innerHTML = `<h2>FREISPIELE BEENDET</h2><p>Gesamtgewinn: <b style="color:${th.accent}">${Hub.chips.fmt(fsWin)}</b> Chips</p>`;
    Hub.sfx(fsWin > 0 ? 'ach' : 'ok'); await new Promise(r => setTimeout(r, 2400)); ov.classList.remove('on');
  }
  async function expandAnim(){
    Hub.tone(300, .5, 'sawtooth', .03, 0, 900);
    for (let k = 0; k <= 12; k++){ expAnim = k / 12; await new Promise(r => setTimeout(r, 40)); }
  }
  let expAnim = 0;
  async function wheel(bet){
    const segs = cfg.wheelSegs || [5, 10, 20, 8, 50, 12, 15, 100, 6, 25];
    const ov = $('slOv'); ov.classList.add('on');
    ov.innerHTML = `<h2>GLÜCKSRAD!</h2><canvas class="wheel" id="slWheel" width="420" height="420"></canvas><p id="slWheelTxt">Das Rad dreht sich …</p>`;
    const wc = $('slWheel').getContext('2d'), N = segs.length, pick = Math.floor(Math.random() * N);
    const cols = ['#ff4d6d', '#ffc53d', '#3fd28b', '#4f9dff', '#c77bff', '#ff8a3d'];
    const drawW = a => {
      wc.clearRect(0, 0, 420, 420); wc.save(); wc.translate(210, 210);
      for (let i = 0; i < N; i++){ wc.save(); wc.rotate(a + i * 2 * Math.PI / N); wc.fillStyle = cols[i % cols.length]; wc.beginPath(); wc.moveTo(0, 0); wc.arc(0, 0, 196, -Math.PI / N, Math.PI / N); wc.fill();
        wc.fillStyle = '#fff'; wc.font = '800 26px Bahnschrift'; wc.textAlign = 'right'; wc.textBaseline = 'middle'; wc.strokeStyle = 'rgba(0,0,0,.5)'; wc.lineWidth = 4; wc.strokeText('×' + segs[i], 182, 0); wc.fillText('×' + segs[i], 182, 0); wc.restore(); }
      wc.restore(); wc.fillStyle = '#fff'; wc.beginPath(); wc.arc(210, 210, 26, 0, 7); wc.fill();
      wc.fillStyle = th.accent; wc.beginPath(); wc.moveTo(400, 210); wc.lineTo(420, 196); wc.lineTo(420, 224); wc.fill();
      wc.beginPath(); wc.moveTo(392, 210); wc.lineTo(418, 192); wc.lineTo(418, 228); wc.closePath(); wc.fill();
    };
    const finalA = -pick * 2 * Math.PI / N + 2 * Math.PI * 6, dur = 4200, t0 = performance.now();
    await new Promise(res => { const f = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); drawW(finalA * e); if (Math.floor(k * 60) !== Math.floor((k - .016) * 60)) Hub.tone(900, .015, 'square', .02); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    const win = segs[pick] * bet; Hub.chips.add(win); lastWin += win;
    $('slWheelTxt').innerHTML = `<b style="color:${th.accent};font-size:28px">×${segs[pick]} = ${Hub.chips.fmt(win)} Chips!</b>`;
    Hub.sfx('ach'); Hub.achieve(cfg.id, 'wheel', 'Glücksrad', 'Drehe das Glücksrad');
    await new Promise(r => setTimeout(r, 2200)); ov.classList.remove('on'); updUI();
  }
  function showWin(total, bet){
    const x = total / bet;
    if (x >= 15){
      const b = $('slBig'); b.querySelector('b').textContent = x >= 100 ? 'EPISCHER GEWINN!' : x >= 40 ? 'MEGA GEWINN!' : 'GROSSER GEWINN!';
      b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
      const sp = b.querySelector('span'); let k = 0; const steps = 40;
      const iv = setInterval(() => { k++; sp.textContent = Hub.chips.fmt(total * k / steps); if (k >= steps) clearInterval(iv); }, 30);
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => Hub.tone(f, .25, 'triangle', .05, i * .1));
      for (let k2 = 0; k2 < 120; k2++) parts.push({x:CW / 2, y:CH / 2, vx:(Math.random() - .5) * 900, vy:-Math.random() * 900, t:2, r:4 + Math.random() * 5});
    } else { [660, 880, 1100].forEach((f, i) => Hub.tone(f, .1, 'triangle', .04, i * .07)); }
    info(`Gewinn: ${Hub.chips.fmt(total)} Chips`);
  }

  // ---------- Zeichnen ----------
  const LCOL = ['#ff4d6d', '#ffc53d', '#3fd28b', '#4f9dff', '#c77bff', '#ff8a3d', '#3fe6ff', '#ff9ad6', '#9cff6b', '#fff'];
  function draw(dt){
    t += dt;
    ctx.fillStyle = th.reelBg || '#0b0712'; ctx.fillRect(0, 0, CW, CH);
    if (cfg.drawBg) cfg.drawBg(ctx, CW, CH, t);
    for (let r = 0; r < R; r++){
      const x = PAD + r * S, rs = reelState[r];
      ctx.save(); ctx.beginPath(); ctx.rect(x, PAD, S, ROWS * S); ctx.clip();
      ctx.fillStyle = r % 2 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.045)'; ctx.fillRect(x, PAD, S, ROWS * S);
      if (twins.includes(r) && !rs.spinning){ ctx.fillStyle = `rgba(255,210,63,${.12 + Math.sin(t * 5) * .05})`; ctx.fillRect(x, PAD, S, ROWS * S); }
      if (rs.spinning){
        const sp = rs.ant ? 2400 : 3600;
        rs.speed = Math.min(sp, rs.speed + dt * 14000);
        rs.off += rs.speed * dt;
        while (rs.off >= S){ rs.off -= S; rs.strip.unshift(randKey(r)); rs.strip.length = 5; }
        if (t >= rs.stopAt){
          rs.spinning = false; grid[r] = rs.target; rs.bounce = 1;
          Hub.tone(rs.ant ? 140 : 110, .08, 'square', .04);
          if (rs.target.includes(scatKey)) Hub.tone(980 + r * 120, .12, 'triangle', .05);
        }
        ctx.filter = 'blur(1.5px)';
        for (let y = -1; y < ROWS; y++){ const k = rs.strip[y + 1]; if (k) ctx.drawImage(art[k], x, PAD + y * S + rs.off); }
        ctx.filter = 'none';
        if (rs.ant){ ctx.strokeStyle = `rgba(255,210,63,${.5 + Math.sin(t * 12) * .4})`; ctx.lineWidth = 6; ctx.strokeRect(x + 3, PAD + 3, S - 6, ROWS * S - 6); }
      } else {
        const bo = rs.bounce ? Math.sin(rs.bounce * Math.PI) * 14 * rs.bounce : 0; if (rs.bounce) rs.bounce = Math.max(0, rs.bounce - dt * 4);
        if (expanded.includes(r)){
          for (let y = 0; y < ROWS; y++) ctx.drawImage(art[grid[r][y]], x, PAD + y * S);
          const h = ROWS * S * expAnim; ctx.save(); ctx.beginPath(); ctx.rect(x, PAD + (ROWS * S - h) / 2, S, h); ctx.clip();
          const eg = ctx.createLinearGradient(0, PAD, 0, PAD + ROWS * S); eg.addColorStop(0, 'rgba(255,210,63,.45)'); eg.addColorStop(.5, 'rgba(120,70,0,.5)'); eg.addColorStop(1, 'rgba(255,210,63,.45)');
          ctx.fillStyle = '#000'; ctx.fillRect(x, PAD, S, ROWS * S); ctx.fillStyle = eg; ctx.fillRect(x, PAD, S, ROWS * S);
          const pl = 1 + Math.sin(t * 6) * .04;
          for (let y = 0; y < ROWS; y++) ctx.drawImage(art[special], x + S * (1 - pl) / 2, PAD + y * S + S * (1 - pl) / 2, S * pl, S * pl);
          ctx.restore(); ctx.strokeStyle = th.accent; ctx.lineWidth = 4; ctx.strokeRect(x + 2, PAD + 2, S - 4, ROWS * S - 4);
        } else {
          for (let y = 0; y < ROWS; y++){
            const k = grid[r][y], inWin = wins.length && wins[winIdx()] && wins[winIdx()].pos.some(([a, b]) => a === r && b === y);
            const pulse = inWin ? 1 + Math.sin(t * 8) * .05 : 1;
            ctx.globalAlpha = wins.length && !inWin && !spinningAny() ? .45 : 1;
            ctx.drawImage(art[k], x + S * (1 - pulse) / 2, PAD + y * S + bo + S * (1 - pulse) / 2, S * pulse, S * pulse);
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.restore();
      // Walzentrenner
      ctx.fillStyle = 'rgba(0,0,0,.6)'; if (r) ctx.fillRect(x - 1, PAD, 2, ROWS * S);
    }
    // Gewinnlinie / Rahmen
    if (wins.length && !spinningAny()){
      const w = wins[winIdx()];
      ctx.strokeStyle = w.scatter ? th.accent : LCOL[(w.line || 0) % LCOL.length]; ctx.lineWidth = 5; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14;
      w.pos.forEach(([r, y]) => { ctx.strokeRect(PAD + r * S + 6, PAD + y * S + 6, S - 12, S - 12); });
      if (w.line != null && !w.expand){ ctx.beginPath(); lines[w.line].forEach((y, r) => { const px = PAD + r * S + S / 2, py = PAD + y * S + S / 2; r ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.lineWidth = 3; ctx.globalAlpha = .7; ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,.75)'; const tx = `${SYM[w.sym].name}${w.ways ? ` · ${w.ways} Wege` : ''}${w.line != null ? ` · Linie ${w.line + 1}` : ''}: ${Hub.chips.fmt(w.win)}`;
      ctx.font = '700 22px Bahnschrift'; const tw = ctx.measureText(tx).width + 30; ctx.fillRect(CW / 2 - tw / 2, CH - 46, tw, 34);
      ctx.fillStyle = th.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tx, CW / 2, CH - 29);
    }
    // Rahmen-Glanz
    const fg = ctx.createLinearGradient(0, 0, 0, CH); fg.addColorStop(0, 'rgba(0,0,0,.55)'); fg.addColorStop(.1, 'rgba(0,0,0,0)'); fg.addColorStop(.9, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, CW, CH);
    // Münzen
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt; ctx.fillStyle = th.accent; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.sin(t * 9 + p.r)), 0, 0, 7); ctx.fill(); });
    parts = parts.filter(p => p.t > 0 && p.y < CH + 20);
  }
  const spinningAny = () => reelState.some(r => r.spinning);
  const winIdx = () => Math.floor(winT / 1.4) % Math.max(1, wins.length);
  let lastT = 0;
  function loop(now){ const dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now; winT += dt; draw(dt); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);

  // ---------- Risiko ----------
  async function gamble(){
    if (!(gambleable > 0) || spinning) return;
    let stake = gambleable, round = 0; gambleable = 0; updUI();
    const ov = $('slOv'); ov.classList.add('on');
    const hist = [];
    const render = (msg2, face) => {
      ov.innerHTML = `<h2>RISIKO</h2><p>Einsatz: <b style="color:${th.accent}">${Hub.chips.fmt(stake)}</b> · Gewinn bei Treffer: <b style="color:${th.accent}">${Hub.chips.fmt(stake * 2)}</b></p>
        <div class="gcard ${face ? 'f' : ''}" style="color:${face && (face === '♥' || face === '♦') ? '#d42a3a' : '#111'}">${face || ''}</div><div class="ghist">${hist.map(h => `<span style="color:${h === '♥' || h === '♦' ? '#ff6b7a' : '#ddd'}">${h}</span>`).join('')}</div>
        <p>${msg2}</p><div style="display:flex;gap:10px"><button class="h-btn lg" style="background:#c4202f;color:#fff" data-g="r">ROT</button><button class="h-btn lg" style="background:#111;color:#fff" data-g="b">SCHWARZ</button><button class="h-btn lg primary" data-g="x">Einsammeln</button></div>`;
    };
    // Gewinn ist bereits gutgeschrieben -> Einsatz abziehen
    Hub.chips.add(-stake); updUI();
    render('Rate die Farbe der nächsten Karte!');
    await new Promise(res => {
      ov.onclick = async e => {
        const g2 = e.target.dataset.g; if (!g2) return;
        if (g2 === 'x'){ Hub.chips.add(stake); lastWin = stake; Hub.sfx('ok'); ov.onclick = null; ov.classList.remove('on'); res(); return; }
        const suit = ['♥', '♦', '♠', '♣'][Math.floor(Math.random() * 4)], red = suit === '♥' || suit === '♦';
        hist.unshift(suit); hist.length = Math.min(hist.length, 6);
        if ((g2 === 'r') === red){ stake *= 2; round++; Hub.tone(880, .1, 'triangle', .05); Hub.tone(1320, .12, 'triangle', .05, .08);
          if (round >= 5){ render('Maximum erreicht – automatisch eingesammelt!', suit); Hub.chips.add(stake); lastWin = stake; Hub.achieve(cfg.id, 'gamble', 'Zocker', 'Gewinne 5 Risikorunden in Folge'); setTimeout(() => { ov.onclick = null; ov.classList.remove('on'); res(); }, 1500); return; }
          render('Richtig! Weiter riskieren oder einsammeln?', suit);
        } else { render('Leider falsch – Einsatz verloren.', suit); Hub.sfx('bad'); lastWin = 0; setTimeout(() => { ov.onclick = null; ov.classList.remove('on'); res(); }, 1400); }
      };
    });
    updUI();
  }

  // ---------- Gewinntabelle ----------
  function paytable(){
    const bet = bets[betIdx], lb = cfg.ways ? bet / (cfg.waysDiv || 25) : bet / lines.length;
    const rows = KEYS.map(k => {
      const s = SYM[k], c = renderSym(k, 108);
      let p = s.pays ? Object.entries(s.pays).sort((a, b) => b[0] - a[0]).map(([n, v]) => `${n}× = ${Hub.chips.fmt(v * lb)}`).join('<br>') : '';
      if (s.scatterPays) p = Object.entries(s.scatterPays).sort((a, b) => b[0] - a[0]).map(([n, v]) => `${n}× überall = ${Hub.chips.fmt(v * bet)}`).join('<br>');
      return `<div><span data-k="${k}"></span><small><b>${s.name}</b>${s.wild ? ' · WILD' : ''}${s.scatter ? ' · SCATTER' : ''}<br>${p}</small></div>`;
    }).join('');
    Hub.dialog({title:`${cfg.title} – Gewinne`, html:`<p>${cfg.rules || ''}</p><p style="font-size:13px">Beträge für deinen aktuellen Einsatz von ${Hub.chips.fmt(bet)} Chips.</p><div class="ptab">${rows}</div>`});
    setTimeout(() => document.querySelectorAll('.ptab [data-k]').forEach(sp => { const c = renderSym(sp.dataset.k, 108); sp.replaceWith(c); }), 30);
  }

  async function broke(){
    const r = Hub.chips.rescue();
    if (r > 0) await Hub.dialog({title:'Keine Chips mehr', center:true, html:`<p>Die Spielhalle schenkt dir <b>${r} Chips</b> Nachschub. Viel Glück!</p>`});
    else await Hub.dialog({title:'Zu wenig Chips', center:true, html:`<p>Für diesen Einsatz reicht es nicht. ${r < 0 ? `Nachschub gibt es in ${-r} Sekunden – oder senke den Einsatz.` : 'Senke den Einsatz.'}</p>`});
    updUI();
  }

  // ---------- Eingabe ----------
  $('slSpin').onclick = () => { if (auto){ auto = false; updUI(); return; } spin(); };
  $('slAuto').onclick = () => { auto = !auto; updUI(); if (auto && !spinning) spin(); };
  $('slTurbo').onclick = () => { turbo = !turbo; updUI(); };
  $('slMinus').onclick = () => { betIdx = Math.max(0, betIdx - 1); Hub.write(cfg.id + '_bet', betIdx); Hub.tone(500, .03, 'triangle', .03); updUI(); };
  $('slPlus').onclick = () => { betIdx = Math.min(bets.length - 1, betIdx + 1); Hub.write(cfg.id + '_bet', betIdx); Hub.tone(700, .03, 'triangle', .03); updUI(); };
  $('slPay').onclick = paytable;
  if ($('slGamble')) $('slGamble').onclick = gamble;
  addEventListener('keydown', e => { if (e.code === 'Space' && !document.querySelector('.h-overlay.on') && !$('slOv').classList.contains('on')){ e.preventDefault(); $('slSpin').click(); } });
  document.addEventListener('hubchips', updUI);
  updUI();
  // Simulation (ohne Animation) zur Bestimmung der Auszahlungsquote
  function simulate(n, bet = 100){
    const save = {grid, curFree, special, freeSpins};
    let paid = 0, won = 0, feats = 0;
    const sum = ws => ws.reduce((a, w) => a + w.win, 0);
    for (let i = 0; i < n; i++){
      paid += bet; curFree = false; special = null; grid = genGrid(); won += sum(evaluate(bet));
      let sc = scatters(grid).length;
      if (cfg.feature === 'wheel' && sc >= 3){ const sg = cfg.wheelSegs || [5, 10, 20, 8, 50, 12, 15, 100, 6, 25]; won += sg[Math.floor(Math.random() * sg.length)] * bet; feats++; }
      if ((cfg.feature === 'book' || (cfg.feature === 'twin' && cfg.twinFree)) && sc >= 3){
        feats++; let fs = cfg.feature === 'book' ? (cfg.freeSpins || 10) : cfg.twinFree;
        const ks = KEYS.filter(k => !SYM[k].scatter && !SYM[k].wild); special = ks[Math.floor(Math.random() * ks.length)];
        while (fs > 0){ fs--; curFree = true; grid = genGrid(); won += sum(evaluate(bet)); if (scatters(grid).length >= 3) fs += cfg.feature === 'book' ? (cfg.freeSpins || 10) : cfg.twinFree; }
      }
    }
    Object.assign({}, save); grid = save.grid; curFree = save.curFree; special = save.special;
    return {rtp:won / paid, featureEvery:n / Math.max(1, feats)};
  }
  // für Tests
  return {simulate,evaluate:(g, bet) => { const old = grid; grid = g; const w = evaluate(bet); grid = old; return w; }, genGrid, get special(){ return special; }, set special(v){ special = v; }, set fs(v){ freeSpins = v; }, cfg};
};
