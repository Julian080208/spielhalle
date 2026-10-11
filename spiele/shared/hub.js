/* =====================================================================
   Spielhalle – gemeinsame Bibliothek für Launcher und alle Spiele
   Profil (XP/Level), Spielzeit, Rekorde, Erfolge, Einstellungen,
   Icons, Toasts, Dialoge, Sound und die Standard-Spielleiste.
   ===================================================================== */
(function(){
  const PKEY = 'hub_profile_v1', SKEY = 'hub_settings_v1';
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch(e){ return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

  const ACCENTS = {
    violet:['#7c6cff','#a594ff','124,108,255'], blue:['#3d8bff','#7ab0ff','61,139,255'], cyan:['#18c5d8','#6ee4f0','24,197,216'],
    green:['#2fbf71','#6be3a1','47,191,113'], orange:['#ff8a3d','#ffb27a','255,138,61'], pink:['#ff4f9a','#ff8fc0','255,79,154'], red:['#ff4d5e','#ff8a95','255,77,94'],
  };
  const settings = Object.assign({master:.8, sfx:1, music:.6, accent:'violet', reduceMotion:false, name:'Spieler'}, read(SKEY, {}));
  const profile = Object.assign({xp:0, games:{}, ach:{}, created:Date.now()}, read(PKEY, {}));

  function applyAccent(){
    const a = ACCENTS[settings.accent] || ACCENTS.violet, r = document.documentElement.style;
    r.setProperty('--accent', a[0]); r.setProperty('--accent-2', a[1]); r.setProperty('--accent-rgb', a[2]);
    document.documentElement.classList.toggle('reduce-motion', !!settings.reduceMotion);
  }
  applyAccent();

  // ---------- Icons (eigene Linien-Icons) ----------
  const P = {
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-6h4v6"/>',
    grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    chart:'<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-6"/><path d="M21.5 20H2.5"/>',
    trophy:'<path d="M8 21h8"/><path d="M12 16.5V21"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5.5h3v1.5a3.5 3.5 0 0 1-3.2 3.5"/><path d="M7 5.5H4v1.5a3.5 3.5 0 0 0 3.2 3.5"/>',
    sliders:'<path d="M4 6h9"/><path d="M19 6h1"/><circle cx="16" cy="6" r="2.5"/><path d="M4 12h2"/><path d="M12 12h8"/><circle cx="9" cy="12" r="2.5"/><path d="M4 18h11"/><circle cx="18" cy="18" r="2.5"/>',
    play:'<path class="f" d="M7.5 4.6v14.8a1 1 0 0 0 1.53.85l11.6-7.4a1 1 0 0 0 0-1.7L9.03 3.75A1 1 0 0 0 7.5 4.6z"/>',
    pause:'<rect class="f" x="6" y="4.5" width="4" height="15" rx="1.2"/><rect class="f" x="14" y="4.5" width="4" height="15" rx="1.2"/>',
    volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    mute:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    max:'<path d="M8 3.5H5.5a2 2 0 0 0-2 2V8"/><path d="M20.5 8V5.5a2 2 0 0 0-2-2H16"/><path d="M3.5 16v2.5a2 2 0 0 0 2 2H8"/><path d="M16 20.5h2.5a2 2 0 0 0 2-2V16"/>',
    left:'<path d="m15 18-6-6 6-6"/>', right:'<path d="m9 18 6-6-6-6"/>', down:'<path d="m6 9 6 6 6-6"/>', up:'<path d="m18 15-6-6-6 6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4-4"/>',
    star:'<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    flame:'<path d="M12 22c4 0 7-2.7 7-6.8 0-3-1.6-5.4-3.4-7.2-.4 2-1.4 3.2-2.6 3.6C13.6 7.8 12 4.6 9 2c.3 3.4-1.4 5.3-3 7.3C4.6 11 4 12.8 4 15c0 4.2 3.6 7 8 7z"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', check:'<path d="M20 6 9 17l-5-5"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
    download:'<path d="M12 3.5v11"/><path d="m7 10 5 5 5-5"/><path d="M4.5 20.5h15"/>',
    upload:'<path d="M12 20.5v-11"/><path d="m7 14 5-5 5 5"/><path d="M4.5 3.5h15"/>',
    music:'<path d="M9 18V5.5l11-2V16"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.5"/><path d="M12 17h.01"/>',
    sparkles:'<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    gamepad:'<path d="M6.5 11h4"/><path d="M8.5 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><path d="M17.3 5.5H6.7a4 4 0 0 0-3.96 3.4l-.9 6.3a2.6 2.6 0 0 0 2.56 2.9c.8 0 1.5-.3 2-.9L8 15.5h8l1.6 1.7c.5.6 1.2.9 2 .9a2.6 2.6 0 0 0 2.56-2.9l-.9-6.3a4 4 0 0 0-3.96-3.4z"/>',
    heart:'<path d="M12 20.5s-7-4.4-9.2-8.9A5.3 5.3 0 0 1 12 6.2a5.3 5.3 0 0 1 9.2 5.4C19 16.1 12 20.5 12 20.5z"/>',
    shuffle:'<path d="M16 3.5h4.5V8"/><path d="M4 20 20.5 3.5"/><path d="M20.5 16v4.5H16"/><path d="m15 15 5.5 5.5"/><path d="M4 4l5 5"/>',
    list:'<path d="M8.5 6h12"/><path d="M8.5 12h12"/><path d="M8.5 18h12"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
    undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    zap:'<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    keyboard:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7 14h10"/>',
    folder:'<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    trash:'<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5.5 7l1 13h11l1-13"/><path d="M9 7V4h6v3"/>',
    lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    coins:'<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>',
    bolt:'<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2.5V5M15 2.5V5M9 19v2.5M15 19v2.5M2.5 9H5M2.5 15H5M19 9h2.5M19 15h2.5"/>',
  };
  function icon(name, cls = ''){
    const body = (P[name] || P.info).replace(/class="f"/g, 'class="f" fill="currentColor" stroke="none"');
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  // ---------- Profil, Level, Spielzeit ----------
  const xpFor = n => Math.round(150 * Math.pow(n, 1.55));            // XP für Level n (kumulativ)
  function levelInfo(xp = profile.xp){
    let l = 1; while (xpFor(l) <= xp) l++;
    const a = l === 1 ? 0 : xpFor(l - 1), b = xpFor(l);
    return {level:l, cur:xp - a, need:b - a, pct:(xp - a) / (b - a)};
  }
  const g = id => (profile.games[id] = profile.games[id] || {playtime:0, sessions:0, last:0, best:null, plays:0});
  function save(){ write(PKEY, profile); }
  function addXP(n, silent){
    const before = levelInfo().level;
    profile.xp += Math.max(0, Math.round(n));
    const after = levelInfo().level;
    save();
    if (after > before && !silent) toast(`Level ${after} erreicht!`, 'Dein Spielhallen-Profil ist aufgestiegen.', 'crown', 'ach');
  }
  let gameId = null, tickT = null;
  function init(id, opts = {}){
    gameId = id;
    const gg = g(id); gg.sessions++; gg.last = Date.now(); save();
    try { localStorage.setItem('launcher_last', id); } catch(e){}
    clearInterval(tickT);
    let acc = 0;
    tickT = setInterval(() => {
      if (document.hidden) return;
      gg.playtime += 5; acc += 5; gg.last = Date.now();
      if (acc >= 60){ acc = 0; addXP(5, true); } else save();
    }, 5000);
    // sanftes Einblenden
    const f = document.createElement('div'); f.className = 'h-fade';
    document.body.appendChild(f); setTimeout(() => f.remove(), 600);
    if (chal && chal.game === id) setTimeout(() => showTurn(true), 700);
  }
  function score(id, v, opts = {}){
    const gg = g(id), lower = !!opts.lower;
    gg.plays = (gg.plays || 0) + 1;
    const rec = gg.best == null || (lower ? v < gg.best : v > gg.best);
    if (rec && (v > 0 || lower)) gg.best = v;
    save();
    addXP(10 + (rec && gg.plays > 1 ? 40 : 0));
    if (rec && gg.plays > 1 && !opts.silent) toast('Neuer Rekord!', `${opts.label || 'Bestwert'}: ${typeof v === 'number' ? v.toLocaleString('de-DE') : v}`, 'trophy', 'ach');
    challengeScore(id, v, opts);
    return {record:rec, best:gg.best};
  }
  const best = id => (profile.games[id] || {}).best;
  function achieve(id, key, title, desc, xp = 60){
    const k = id + ':' + key;
    if (profile.ach[k]) return false;
    profile.ach[k] = {t:Date.now(), title, desc, game:id};
    save(); addXP(xp, true);
    toast('Erfolg freigeschaltet', title, 'trophy', 'ach');
    sfx('ach');
    return true;
  }
  const hasAch = (id, key) => !!profile.ach[id + ':' + key];

  // ---------- Toasts ----------
  function toast(title, text = '', ic = 'sparkles', kind = ''){
    let box = document.getElementById('h-toasts');
    if (!box){ box = document.createElement('div'); box.id = 'h-toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'h-toast ' + kind;
    t.innerHTML = `<div class="ti">${icon(ic)}</div><div><b></b><span></span></div>`;
    t.querySelector('b').textContent = title; t.querySelector('span').textContent = text;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3600);
    while (box.children.length > 4) box.firstChild.remove();
  }

  // ---------- Dialog ----------
  function dialog({title, html = '', buttons = [{label:'OK', primary:true}], center = false, dismiss = true}){
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'h-overlay';
      ov.innerHTML = `<div class="h-dialog ${center ? 'center' : ''}"><h2></h2><div class="h-dbody">${html}</div><div class="h-row"></div></div>`;
      ov.querySelector('h2').textContent = title;
      const row = ov.querySelector('.h-row');
      const close = v => { ov.classList.remove('on'); setTimeout(() => ov.remove(), 220); res(v); };
      buttons.forEach((b, i) => {
        const el = document.createElement('button');
        el.className = 'h-btn ' + (b.primary ? 'primary ' : '') + (b.cls || '');
        el.innerHTML = b.label; el.onclick = () => close(b.value !== undefined ? b.value : i);
        row.appendChild(el);
      });
      if (dismiss) ov.addEventListener('pointerdown', e => { if (e.target === ov) close(null); });
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('on'));
    });
  }

  // ---------- Sound ----------
  let ac = null;
  function audio(){
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch(e){}
    return ac;
  }
  const vol = (kind = 'sfx') => settings.master * (kind === 'music' ? settings.music : settings.sfx);
  function tone(f, d = .08, type = 'sine', v = .05, delay = 0, f2){
    const a = audio(); if (!a) return;
    const V = v * vol(); if (V <= 0.0001) return;
    try {
      const t = a.currentTime + delay, o = a.createOscillator(), gn = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      gn.gain.setValueAtTime(V, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(gn).connect(a.destination); o.start(t); o.stop(t + d + .02);
    } catch(e){}
  }
  const SFX = {
    click:() => tone(880, .04, 'triangle', .04), hover:() => tone(1400, .02, 'sine', .015),
    ok:() => { tone(660, .08, 'triangle', .05); tone(990, .1, 'triangle', .045, .07); },
    ach:() => [523, 659, 784, 1047].forEach((f, k) => tone(f, .18, 'triangle', .05, k * .09)),
    bad:() => { tone(320, .18, 'sawtooth', .04); tone(220, .26, 'sawtooth', .04, .14); },
    launch:() => { tone(220, .5, 'sine', .05, 0, 880); tone(440, .4, 'triangle', .03, .1, 1320); },
  };
  const sfx = k => SFX[k] && SFX[k]();

  // ---------- Standard-Spielleiste ----------
  function bar({id, title, logo, stats = [], actions = ['sound', 'full']}){
    const el = document.createElement('header');
    el.className = 'h-bar';
    const cat = (window.HubCatalog || []).find(x => x.id === id);
    const lg = logo || (cat && cat.logo ? cat.logo() : '');
    el.innerHTML = `<a class="h-back" href="${location.pathname.includes('/spiele/') ? '../' : ''}Launcher.html" title="Zur Spielhalle">${icon('left')}Spielhalle</a>
      <span class="h-sep"></span>
      <div class="h-title">${lg ? `<span class="h-logo">${lg}</span>` : ''}<span></span></div>
      <div class="h-stats">${stats.map(([k, l]) => `<div class="h-stat" data-k="${k}"><small>${l}</small><b>–</b></div>`).join('')}</div>
      <div class="h-grow"></div>
      <div class="h-actions">
        ${CH_GAMES[id] ? `<button class="h-btn sm ghost" data-a="party" title="Reihum-Wettkampf mit der Runde" style="font-size:13px">🎉 Wettkampf</button>` : ''}
        ${actions.includes('help') ? `<button class="h-btn icon ghost" data-a="help" title="Anleitung">${icon('help')}</button>` : ''}
        ${actions.includes('pause') ? `<button class="h-btn icon ghost" data-a="pause" title="Pause">${icon('pause')}</button>` : ''}
        ${actions.includes('sound') ? `<button class="h-btn icon ghost" data-a="sound" title="Ton an/aus">${icon(settings.master > 0 ? 'volume' : 'mute')}</button>` : ''}
        ${actions.includes('full') ? `<button class="h-btn icon ghost" data-a="full" title="Vollbild">${icon('max')}</button>` : ''}
      </div>`;
    el.querySelector('.h-title span:last-child').textContent = title;
    document.body.prepend(el);
    const handlers = {};
    el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'sound'){
        settings.master = settings.master > 0 ? 0 : (settings._lastMaster || .8);
        if (settings.master > 0) settings._lastMaster = settings.master;
        write(SKEY, settings);
        b.innerHTML = icon(settings.master > 0 ? 'volume' : 'mute');
      }
      if (a === 'party'){ challengeMenu(id); }
      if (a === 'full'){ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }
      handlers[a] && handlers[a]();
    });
    if (settings.master > 0) settings._lastMaster = settings.master;
    const api = {
      el,
      set(k, v){ const s = el.querySelector(`[data-k="${k}"] b`); if (s && s.textContent !== String(v)) s.textContent = v; },
      on(a, fn){ handlers[a] = fn; return api; },
    };
    return api;
  }

  // ---------- Daten-Export/Import ----------
  function exportAll(){
    const out = {};
    try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); out[k] = localStorage.getItem(k); } } catch(e){}
    return {app:'Spielhalle', version:1, date:new Date().toISOString(), data:out};
  }
  function importAll(obj){
    if (!obj || !obj.data) throw new Error('Ungültige Datei');
    Object.entries(obj.data).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch(e){} });
  }

  // ---------- Casino-Chips (Spielgeld, gemeinsam für alle Casino-Spiele) ----------
  const CKEY = 'hub_chips_v1';
  const cread = () => Object.assign({n:2000, refill:0, daily:''}, read(CKEY, {}));
  const chips = {
    get(){ return cread().n; },
    add(v){ const c = cread(); c.n = Math.max(0, Math.round(c.n + v)); write(CKEY, c); document.dispatchEvent(new CustomEvent('hubchips', {detail:c.n})); return c.n; },
    // Tagesbonus: einmal pro Tag 500 Chips
    daily(){ const c = cread(), d = new Date().toDateString(); if (c.daily === d) return 0; c.daily = d; c.n += 500; write(CKEY, c); return 500; },
    // Nachschub, wenn fast pleite (alle 3 Minuten möglich)
    rescue(){ const c = cread(); if (c.n >= 100) return 0; if (Date.now() - c.refill < 180000) return -Math.ceil((180000 - (Date.now() - c.refill)) / 1000); c.n += 1000; c.refill = Date.now(); write(CKEY, c); return 1000; },
    fmt: n => Math.round(n).toLocaleString('de-DE'),
  };
  // Standard-Begrüßung für Casino-Spiele: Tagesbonus + Nachschub-Hinweis
  function casinoInit(){
    const d = chips.daily();
    if (d) setTimeout(() => toast('Tagesbonus!', `+${d} Chips für heute`, 'sparkles', 'ach'), 700);
  }

  // =====================================================================
  //  PARTY-MODUS: Spielerrunde, Fernseher-Modus, Reihum-Wettkampf
  // =====================================================================
  const PAKEY = 'hub_party_v1', CHKEY = 'hub_challenge_v1';
  const PARTY_COLORS = ['#e8343a', '#2f6bff', '#2fbf71', '#ff9a2e', '#c45cff', '#14c8d8', '#ff5d9e', '#ffd23f'];
  const PARTY_AVATARS = ['😎', '🦊', '🐼', '🦄', '🐯', '🐸', '🐵', '🐨', '🦁', '🐙', '🤖', '👽', '🐲', '🦉', '🐺', '🍕'];
  const DEF_NAMES = ['Julian', 'Silas', 'Steve', 'Luna', 'Josef', 'David'];
  const partyData = Object.assign({players:DEF_NAMES.map((n, i) => ({name:n, col:i, av:i, on:true})), tv:false, tvScale:1.3}, read(PAKEY, {}));
  function applyTV(){ const r = document.documentElement; r.classList.toggle('tv', !!partyData.tv); r.style.setProperty('--tvz', partyData.tvScale || 1.3); }
  applyTV();
  const partyFull = () => partyData.players.map((p, i) => ({...p, idx:i, color:PARTY_COLORS[p.col % PARTY_COLORS.length], avatar:PARTY_AVATARS[p.av % PARTY_AVATARS.length]}));
  const party = {
    data:partyData, COLORS:PARTY_COLORS, AVATARS:PARTY_AVATARS,
    save(){ write(PAKEY, partyData); applyTV(); },
    all:partyFull,
    active(){ return partyFull().filter(p => p.on && p.name.trim()); },
    get tv(){ return !!partyData.tv; },
    // Start aus dem Partyraum merken, damit das Spiel gleich im Partymodus öffnet
    flagLaunch(id){ write('hub_party_go', {id, t:Date.now()}); },
    wantsParty(id){ const v = read('hub_party_go', null); if (v && v.id === id && Date.now() - v.t < 60000){ try { localStorage.removeItem('hub_party_go'); } catch(e){} return true; } return false; },
  };
  // ---------- Reihum-Wettkampf ----------
  const CH_GAMES = {geister:1, himmel:1, stapel:1, blasen:1, frosch:1, flipper:1, snake:1, blockfall:1, g2048:1, flatter:1, ziegel:1, asteroiden:1, invasion:1, nacht:1, golf:1, juwelen:1};
  let chal = read(CHKEY, null);
  const chalSave = () => write(CHKEY, chal);
  const fmtN = v => typeof v === 'number' ? v.toLocaleString('de-DE') : v;
  const chalP = k => partyFull()[k];
  function chalBest(k){ const a = (chal.scores[k] || []); if (!a.length) return null; return chal.lower ? Math.min(...a) : Math.max(...a); }
  function chalRanking(){
    return chal.order.map(k => ({k, p:chalP(k), b:chalBest(k)})).sort((a, b) => a.b == null ? 1 : b.b == null ? -1 : (chal.lower ? a.b - b.b : b.b - a.b));
  }
  function partyOverlay(html, buttons){
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'h-overlay pty';
      ov.innerHTML = `<div class="pty-box">${html}<div class="pty-row"></div></div>`;
      const row = ov.querySelector('.pty-row');
      const close = v => { ov.classList.remove('on'); removeEventListener('keydown', key, true); setTimeout(() => ov.remove(), 220); res(v); };
      buttons.forEach(([l, v, cls]) => { const b = document.createElement('button'); b.className = 'h-btn lg ' + (cls || ''); b.innerHTML = l; b.onclick = () => close(v); row.appendChild(b); });
      const key = e => { if (e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); close(buttons[buttons.length - 1][1]); } };
      setTimeout(() => addEventListener('keydown', key, true), 250);
      document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
    });
  }
  function standingsHTML(){
    if (!chal) return '';
    return `<div class="pty-tab">${chalRanking().map(r => `<div style="--pc:${r.p.color}"><span class="pty-av">${r.p.avatar}</span><b>${esc(r.p.name)}</b><span class="pty-sc">${r.b == null ? '–' : fmtN(r.b)}</span></div>`).join('')}</div>`;
  }
  async function showTurn(resume){
    if (!chal) return;
    const p = chalP(chal.order[chal.idx]);
    sfx('launch');
    const r = await partyOverlay(`<div class="pty-tag">🎉 REIHUM-WETTKAMPF${chal.rounds > 1 ? ` · RUNDE ${chal.round}/${chal.rounds}` : ''}</div>
      <div class="pty-big" style="--pc:${p.color}"><span class="pty-av xl">${p.avatar}</span><div><small>${resume ? 'Weiter geht’s –' : 'Jetzt ist dran:'}</small><b>${esc(p.name)}</b></div></div>
      <p class="pty-hint">Tastatur an <b style="color:${p.color}">${esc(p.name)}</b> geben und eine Runde spielen. Danach ist automatisch der Nächste dran.</p>${standingsHTML()}`,
      [['Wettkampf beenden', 'stop', 'ghost'], [`Los, ${esc(p.name)}! ➜`, 'go', 'primary']]);
    if (r === 'stop') endChallenge(true);
  }
  function challengeScore(id, v, opts){
    if (!chal || chal.game !== id) return;
    const k = chal.order[chal.idx];
    (chal.scores[k] = chal.scores[k] || []).push(v);
    chal.lower = !!opts.lower; chal.label = opts.label || 'Punkte';
    chal.idx++;
    if (chal.idx >= chal.order.length){ chal.idx = 0; chal.round++; }
    chalSave();
    const p = chalP(k), done = chal.round > chal.rounds;
    setTimeout(async () => {
      if (done) return endChallenge(false);
      const nx = chalP(chal.order[chal.idx]);
      sfx('ok');
      const r = await partyOverlay(`<div class="pty-tag">🎉 REIHUM-WETTKAMPF</div>
        <div class="pty-res" style="--pc:${p.color}"><span class="pty-av">${p.avatar}</span><b>${esc(p.name)}</b><span>${fmtN(v)} ${esc(chal.label)}</span></div>${standingsHTML()}
        <div class="pty-next" style="--pc:${nx.color}">Als Nächstes: <span class="pty-av">${nx.avatar}</span><b>${esc(nx.name)}</b></div>
        <p class="pty-hint">Weitergeben – dann im Spiel eine neue Runde starten (z. B. „Nochmal“ oder Enter).</p>`,
        [['Wettkampf beenden', 'stop', 'ghost'], [`${esc(nx.name)} ist bereit ➜`, 'go', 'primary']]);
      if (r === 'stop') endChallenge(true);
    }, 1300);
  }
  async function endChallenge(aborted){
    if (!chal) return;
    const rank = chalRanking(), c = chal; chal = null; try { localStorage.removeItem(CHKEY); } catch(e){}
    const scored = rank.filter(r => r.b != null);
    if (!scored.length){ if (aborted) toast('Wettkampf beendet', '', 'sparkles'); return; }
    sfx('ach');
    const med = ['🥇', '🥈', '🥉'];
    await partyOverlay(`<div class="pty-tag">🏆 ${aborted ? 'WETTKAMPF ABGEBROCHEN' : 'SIEGEREHRUNG'}</div>
      <div class="pty-podium">${scored.slice(0, 3).map((r, i) => `<div class="pp p${i}" style="--pc:${r.p.color}"><span class="pty-av xl">${r.p.avatar}</span><b>${esc(r.p.name)}</b><span>${fmtN(r.b)}</span><div class="blk">${med[i]}</div></div>`).join('')}</div>
      <div class="pty-tab">${rank.map((r, i) => `<div style="--pc:${r.p.color}"><span>${i + 1}.</span><span class="pty-av">${r.p.avatar}</span><b>${esc(r.p.name)}</b><span class="pty-sc">${r.b == null ? '–' : fmtN(r.b) + ' ' + esc(c.label)}</span></div>`).join('')}</div>`,
      [['Fertig', 'ok', 'primary']]);
  }
  function startChallenge(game, order, rounds = 1){
    chal = {game, order:order.slice(), idx:0, round:1, rounds, scores:{}, lower:false, label:'Punkte'}; chalSave();
    if (gameId === game) showTurn(false);
  }
  function challengeMenu(game){
    if (chal && chal.game === game) return showTurn(true);
    const ps = partyFull();
    const ov = document.createElement('div'); ov.className = 'h-overlay pty';
    ov.innerHTML = `<div class="pty-box"><div class="pty-tag">🎉 REIHUM-WETTKAMPF</div><h2 style="margin:4px 0 6px;font-family:var(--font-display)">Wer spielt mit?</h2>
      <p class="pty-hint">Jeder spielt nacheinander eine Runde – wer das beste Ergebnis hat, gewinnt.</p>
      <div class="pty-pick">${ps.filter(p => p.name.trim()).map(p => `<label style="--pc:${p.color}"><input type="checkbox" value="${p.idx}" ${p.on ? 'checked' : ''}><span class="pty-av">${p.avatar}</span>${esc(p.name)}</label>`).join('')}</div>
      <div class="pty-rounds">Runden pro Person: <button data-r="1" class="on">1</button><button data-r="2">2</button><button data-r="3">3</button></div>
      <div class="pty-row"><button class="h-btn lg ghost" data-x="0">Abbrechen</button><button class="h-btn lg primary" data-x="1">Wettkampf starten</button></div></div>`;
    document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('on'));
    let rounds = 1;
    ov.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rounds = +b.dataset.r; ov.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); });
    ov.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      const order = [...ov.querySelectorAll('.pty-pick input:checked')].map(i => +i.value);
      ov.classList.remove('on'); setTimeout(() => ov.remove(), 220);
      if (b.dataset.x === '1'){ if (order.length < 2) return toast('Mindestens zwei Leute', 'Hake mindestens zwei Mitspieler an.', 'user'); startChallenge(game, order, rounds); }
    });
  }
  const challenge = {get:() => chal, start:startChallenge, menu:challengeMenu, end:() => endChallenge(true), GAMES:CH_GAMES};
  function esc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }

  window.Hub = {
    party, challenge, applyTV,
    chips, casinoInit,
    settings, profile, ACCENTS, icon, init, score, best, achieve, hasAch, addXP, levelInfo, toast, dialog, tone, sfx, vol, audio, bar,
    saveSettings(){ write(SKEY, settings); applyAccent(); }, save, game:g, exportAll, importAll, read, write,
    fmt:n => Math.round(n).toLocaleString('de-DE'),
    fmtTime(s){ s = Math.round(s); if (s < 60) return s + ' s'; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${m} min` : `${m} min`; },
  };
})();
