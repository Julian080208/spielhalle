/* =====================================================================
   Spielhalle – weitere Spiele: Cover-Art und Katalogeinträge
   ===================================================================== */
(function(){
  if (!window.HubArt) return;
  const {uid, rng, wrap, lg, rg, logoWrap} = HubArt;
  const W = 640, H = 360;
  const SUITS = ['♠', '♥', '♦', '♣'];

  // ---------- Solitär ----------
  function card(x, y, rot, r, s, sc = 1){
    const red = s === 1 || s === 2, col = red ? '#d42a3a' : '#1b1e26';
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><rect x="-46" y="-64" width="92" height="128" rx="9" fill="#000" opacity=".3" transform="translate(4 6)"/>
      <rect x="-46" y="-64" width="92" height="128" rx="9" fill="#fbfbfd" stroke="#d8dbe4"/>
      <text x="-36" y="-40" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="22" fill="${col}">${r}</text>
      <text x="-36" y="-20" font-family="Segoe UI Symbol" font-size="18" fill="${col}">${SUITS[s]}</text>
      <text x="0" y="20" text-anchor="middle" font-family="Segoe UI Symbol" font-size="58" fill="${col}">${SUITS[s]}</text></g>`;
  }
  function coverSolitaer(){
    const u = uid();
    return wrap(u, rg(u + 'f', [[0, '#2a8a58'], [.6, '#155c3a'], [1, '#0a2e1e']], '50%', '45%', '75%'), `
      <rect width="${W}" height="${H}" fill="url(#${u}f)"/>
      <ellipse cx="320" cy="300" rx="260" ry="40" fill="#000" opacity=".25"/>
      ${card(190, 200, -24, 'A', 0)}${card(270, 180, -8, 'A', 1)}${card(360, 178, 8, 'A', 2)}${card(445, 196, 24, 'A', 3)}
      <g transform="translate(560 90) rotate(14)"><rect x="-40" y="-56" width="80" height="112" rx="8" fill="#7c6cff"/><rect x="-34" y="-50" width="68" height="100" rx="6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>
      <g transform="translate(80 90) rotate(-16)"><rect x="-40" y="-56" width="80" height="112" rx="8" fill="#7c6cff"/><rect x="-34" y="-50" width="68" height="100" rx="6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>`);
  }
  const logoSolitaer = () => logoWrap([[0, '#1f7a4a'], [1, '#0e4a2c']], `<rect x="14" y="10" width="30" height="42" rx="5" fill="#fff" transform="rotate(-10 29 31)"/><rect x="22" y="12" width="30" height="42" rx="5" fill="#fff" stroke="#ccd" transform="rotate(8 37 33)"/><text x="37" y="42" text-anchor="middle" font-family="Segoe UI Symbol" font-size="20" fill="#d42a3a" transform="rotate(8 37 33)">♥</text>`);

  // ---------- Vier gewinnt ----------
  function coverVier(){
    const u = uid(), map = ['.......', '.......', '...Y...', '..YRR..', '.YRRY..', 'YRRYRY.'];
    let holes = '', discs = '';
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      const x = 140 + c * 60, y = 30 + r * 54 + 16;
      holes += `<circle cx="${x}" cy="${y}" r="22" fill="#000"/>`;
      if (ch !== '.') discs += `<circle cx="${x}" cy="${y}" r="22" fill="${ch === 'R' ? '#ff4d6a' : '#ffd23f'}"/><circle cx="${x - 7}" cy="${y - 8}" r="7" fill="#fff" opacity=".45"/>`;
    }));
    return wrap(u, lg(u + 's', [[0, '#0a1030'], [1, '#1d2a6a']], 1, 1) + lg(u + 'brd', [[0, '#4a73ff'], [1, '#1f3ccf']]) + `<mask id="${u}m"><rect x="105" y="16" width="430" height="330" rx="20" fill="#fff"/>${holes}</mask>`, `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>${discs}
      <rect x="105" y="16" width="430" height="330" rx="20" fill="url(#${u}brd)" mask="url(#${u}m)"/>
      <line x1="140" y1="316" x2="320" y2="154" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".55" filter="url(#${u}b2)"/>
      <circle cx="320" cy="44" r="22" fill="#ff4d6a"/><path d="M320 74 l-8 -10 h16z" fill="#ff4d6a" opacity=".7"/>`);
  }
  const logoVier = () => logoWrap([[0, '#3a63ff'], [1, '#1f3ccf']], `<circle cx="20" cy="22" r="8" fill="#0a1030"/><circle cx="44" cy="22" r="8" fill="#ffd23f"/><circle cx="20" cy="44" r="8" fill="#ff4d6a"/><circle cx="44" cy="44" r="8" fill="#ff4d6a"/>`);

  // ---------- Sudoku ----------
  function coverSudoku(){
    const u = uid(), r = rng(9), g = [];
    const sol = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    let cells = '';
    for (let i = 0; i < 81; i++){
      const x = 170 + (i % 9) * 34, y = 28 + Math.floor(i / 9) * 34;
      const show = r() < .45, hl = (i % 9) === 4 || Math.floor(i / 9) === 4;
      if (hl) cells += `<rect x="${x}" y="${y}" width="34" height="34" fill="#7c6cff" opacity=".18"/>`;
      if (show) cells += `<text x="${x + 17}" y="${y + 25}" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="${r() < .3 ? 400 : 700}" font-size="21" fill="${r() < .2 ? '#a594ff' : '#e8eaf2'}">${sol[i]}</text>`;
    }
    let lines = '';
    for (let k = 0; k <= 9; k++){ const w = k % 3 === 0 ? 3 : 1, o = k % 3 === 0 ? .7 : .2; lines += `<line x1="${170 + k * 34}" y1="28" x2="${170 + k * 34}" y2="334" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}"/><line x1="170" y1="${28 + k * 34}" x2="476" y2="${28 + k * 34}" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}"/>`; }
    return wrap(u, lg(u + 's', [[0, '#0f1022'], [1, '#26204a']], 1, 1) + rg(u + 'glow', [[0, '#7c6cff', .45], [1, '#7c6cff', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/><circle cx="323" cy="181" r="230" fill="url(#${u}glow)"/>
      <rect x="164" y="22" width="318" height="318" rx="10" fill="#14152a" stroke="#7c6cff" stroke-opacity=".4"/>${cells}${lines}
      <rect x="306" y="164" width="34" height="34" fill="none" stroke="#ffd34d" stroke-width="3"/>`);
  }
  const logoSudoku = () => logoWrap([[0, '#2a2460'], [1, '#14152a']], `<g stroke="#fff" stroke-opacity=".7" stroke-width="2"><path d="M24 8v48M40 8v48M8 24h48M8 40h48"/></g><text x="16" y="21" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="12" fill="#a594ff">5</text><text x="32" y="37" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="12" fill="#fff">9</text><text x="48" y="53" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="12" fill="#ffd34d">3</text>`);

  // ---------- Juwelen ----------
  const GEM = [['#ff4d6a', '#9a1030'], ['#3fd28b', '#0e6a3a'], ['#4f9dff', '#163a9a'], ['#ffd23f', '#a07000'], ['#c77bff', '#5a2090'], ['#ff8a3d', '#a04000']];
  function gem(x, y, s, k){
    const [a, b] = GEM[k], u = 'gm' + k;
    const shapes = [
      `<polygon points="0,-1 .95,-.31 .59,.81 -.59,.81 -.95,-.31"/>`,
      `<polygon points="0,-1 .87,-.5 .87,.5 0,1 -.87,.5 -.87,-.5"/>`,
      `<polygon points="0,-1 1,0 0,1 -1,0"/>`,
      `<circle r=".9"/>`,
      `<polygon points="-.7,-.7 .7,-.7 1,0 .7,.7 -.7,.7 -1,0"/>`,
      `<polygon points="0,-1 .3,-.3 1,-.2 .45,.25 .6,1 0,.55 -.6,1 -.45,.25 -1,-.2 -.3,-.3"/>`][k];
    return `<g transform="translate(${x} ${y}) scale(${s})"><g fill="${b}" transform="translate(.04 .08)">${shapes}</g><g fill="${a}">${shapes}</g>
      <g fill="#fff" opacity=".35" transform="scale(.55) translate(-.25 -.3)">${shapes}</g><circle cx="-.35" cy="-.4" r=".12" fill="#fff" opacity=".9"/></g>`;
  }
  function coverJuwelen(){
    const u = uid(), r = rng(13);
    let g = '';
    for (let row = 0; row < 5; row++) for (let c = 0; c < 9; c++) g += gem(76 + c * 62, 60 + row * 62, 24, Math.floor(r() * 6));
    let sp = ''; for (let k = 0; k < 14; k++){ const x = r() * W, y = r() * H, s = 3 + r() * 6; sp += `<path d="M${x} ${y - s} L${x + s * .3} ${y - s * .3} L${x + s} ${y} L${x + s * .3} ${y + s * .3} L${x} ${y + s} L${x - s * .3} ${y + s * .3} L${x - s} ${y} L${x - s * .3} ${y - s * .3}Z" fill="#fff" opacity=".8"/>`; }
    return wrap(u, lg(u + 's', [[0, '#1a0a30'], [1, '#3a1260']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <rect x="40" y="26" width="560" height="312" rx="18" fill="#000" opacity=".25"/>${g}
      <rect x="230" y="150" width="186" height="60" rx="14" fill="none" stroke="#fff" stroke-width="4" opacity=".85" filter="url(#${u}b2)"/>${sp}`);
  }
  const logoJuwelen = () => logoWrap([[0, '#3a1260'], [1, '#1a0a30']], gem(32, 33, 20, 0));

  // ---------- Asteroiden ----------
  function rock(x, y, s, r){
    let p = []; const n = 10;
    for (let k = 0; k < n; k++){ const a = k / n * 6.283, d = s * (.7 + r() * .35); p.push(`${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`); }
    return `<polygon points="${p.join(' ')}" fill="none" stroke="#9fd6ff" stroke-width="2.5"/>`;
  }
  function coverAsteroiden(){
    const u = uid(), r = rng(21);
    let stars = ''; for (let k = 0; k < 120; k++) stars += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(r() * 1.4 + .2).toFixed(1)}" fill="#fff" opacity="${(.3 + r() * .7).toFixed(2)}"/>`;
    const rocks = rock(140, 100, 46, r) + rock(500, 80, 60, r) + rock(520, 270, 34, r) + rock(90, 280, 28, r) + rock(380, 60, 20, r);
    return wrap(u, rg(u + 's', [[0, '#141a3a'], [1, '#03040c']], '50%', '50%', '70%') + rg(u + 'n', [[0, '#7c3cff', .45], [1, '#7c3cff', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/><circle cx="460" cy="120" r="200" fill="url(#${u}n)"/>${stars}
      <g filter="url(#${u}b2)" opacity=".8">${rocks}</g>${rocks}
      <g transform="translate(300 200) rotate(-28)"><path d="M0 -26 L16 18 L0 10 L-16 18Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-7 16 L0 38 L7 16" fill="#ff8a3d" filter="url(#${u}b2)"/></g>
      <line x1="315" y1="172" x2="470" y2="-110" stroke="#ff5d8f" stroke-width="3" opacity=".9"/><line x1="315" y1="172" x2="470" y2="-110" stroke="#ff5d8f" stroke-width="8" opacity=".3" filter="url(#${u}b2)"/>`);
  }
  const logoAsteroiden = () => logoWrap([[0, '#141a3a'], [1, '#03040c']], `<path d="M32 12 L44 46 L32 40 L20 46Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><polygon points="50,14 58,18 56,26 48,26 45,19" fill="none" stroke="#9fd6ff" stroke-width="2"/>`);

  // ---------- Turmverteidigung ----------
  function coverTurm(){
    const u = uid(), r = rng(31);
    const path = 'M-20 250 C 80 250, 120 120, 220 120 S 340 280, 440 260 S 560 110, 660 120';
    let tufts = ''; for (let k = 0; k < 60; k++){ const x = r() * W, y = r() * H; tufts += `<path d="M${x} ${y} l3 -7 l3 7" stroke="#2f7a2a" stroke-width="2" fill="none" opacity=".6"/>`; }
    const tower = (x, y, c, a) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="16" rx="24" ry="8" fill="#000" opacity=".3"/><rect x="-20" y="-6" width="40" height="22" rx="6" fill="#5a6070"/><circle r="17" fill="${c}"/><circle r="9" fill="#fff" opacity=".25"/><rect x="0" y="-5" width="28" height="10" rx="4" fill="#2a2f3a" transform="rotate(${a})"/></g>`;
    const enemy = (x, y, c, s) => `<g transform="translate(${x} ${y})"><circle r="${s}" fill="${c}"/><circle cx="${-s * .3}" cy="${-s * .3}" r="${s * .3}" fill="#fff" opacity=".4"/><rect x="${-s}" y="${-s - 8}" width="${s * 2}" height="4" fill="#000" opacity=".5"/><rect x="${-s}" y="${-s - 8}" width="${s * 1.3}" height="4" fill="#3fd28b"/></g>`;
    return wrap(u, lg(u + 's', [[0, '#4a9a3a'], [1, '#2a6a24']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${tufts}
      <path d="${path}" fill="none" stroke="#7a5a32" stroke-width="54" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#c9a46a" stroke-width="42" stroke-linecap="round"/>
      ${enemy(150, 165, '#ff5d6c', 13)}${enemy(250, 128, '#ff8a3d', 11)}${enemy(330, 210, '#c77bff', 16)}${enemy(430, 262, '#ff5d6c', 12)}
      ${tower(200, 220, '#4f9dff', -40)}${tower(330, 120, '#ff8a3d', 70)}${tower(500, 190, '#c77bff', 160)}${tower(90, 140, '#3fd28b', 20)}
      <line x1="355" y1="132" x2="335" y2="200" stroke="#ffd34d" stroke-width="4"/><circle cx="333" cy="205" r="22" fill="#ffd34d" opacity=".5" filter="url(#${u}b2)"/>`);
  }
  const logoTurm = () => logoWrap([[0, '#4a9a3a'], [1, '#2a6a24']], `<rect x="16" y="30" width="32" height="20" rx="5" fill="#5a6070"/><circle cx="32" cy="28" r="13" fill="#4f9dff"/><rect x="32" y="24" width="20" height="8" rx="3" fill="#2a2f3a" transform="rotate(-30 32 28)"/>`);

  // ---------- Reversi ----------
  function coverReversi(){
    const u = uid(), map = ['........', '...B....', '..BWB...', '..WWWB..', '...BWW..', '....BW..', '........', '........'];
    let g = '', d = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++){
      const x = 180 + c * 36, y = 36 + r * 36;
      g += `<rect x="${x}" y="${y}" width="36" height="36" fill="${(r + c) % 2 ? '#1f8a4c' : '#23955a'}"/>`;
      const ch = map[r][c];
      if (ch !== '.') d += `<circle cx="${x + 18}" cy="${y + 20}" r="14" fill="#000" opacity=".35"/><circle cx="${x + 18}" cy="${y + 18}" r="14" fill="${ch === 'B' ? '#16181e' : '#f2f3f6'}"/><circle cx="${x + 13}" cy="${y + 13}" r="4" fill="#fff" opacity="${ch === 'B' ? .18 : .7}"/>`;
    }
    return wrap(u, lg(u + 's', [[0, '#0a1a14'], [1, '#14382a']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <rect x="170" y="26" width="308" height="308" rx="12" fill="#3a2a1a"/>${g}${d}
      <g transform="translate(500 120)"><ellipse rx="34" ry="34" fill="#16181e"/><ellipse rx="10" ry="34" fill="#f2f3f6" transform="translate(14 0)"/></g>
      <g transform="translate(110 240)"><circle r="32" fill="#f2f3f6"/><circle cx="-9" cy="-9" r="9" fill="#fff"/></g>`);
  }
  const logoReversi = () => logoWrap([[0, '#23955a'], [1, '#14582f']], `<circle cx="24" cy="24" r="10" fill="#16181e"/><circle cx="40" cy="24" r="10" fill="#f2f3f6"/><circle cx="24" cy="40" r="10" fill="#f2f3f6"/><circle cx="40" cy="40" r="10" fill="#16181e"/>`);

  // ---------- Wortjagd ----------
  function coverWort(){
    const u = uid(), rows = [['REGEN', 'xyxxg'], ['SPIEL', 'gygxg'], ['SPASS', 'ggggg']];
    const C = {g:'#3fa94a', y:'#d9a91a', x:'#3a3f4c'};
    let t = '';
    rows.forEach(([w, c], r) => [...w].forEach((ch, k) => {
      const x = 170 + k * 62, y = 50 + r * 92;
      t += `<rect x="${x}" y="${y + 4}" width="54" height="54" rx="8" fill="#000" opacity=".3"/><rect x="${x}" y="${y}" width="54" height="54" rx="8" fill="${C[c[k]]}"/>
        <text x="${x + 27}" y="${y + 38}" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="30" fill="#fff">${ch}</text>`;
    }));
    return wrap(u, lg(u + 's', [[0, '#121420'], [1, '#22263a']], 1, 1) + rg(u + 'glow', [[0, '#3fa94a', .4], [1, '#3fa94a', 0]]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="324" cy="260" r="200" fill="url(#${u}glow)"/>${t}`);
  }
  const logoWort = () => logoWrap([[0, '#3fa94a'], [1, '#2a7a32']], `<text x="32" y="44" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="34" fill="#fff">W</text>`);

  // ---------- Neon-Pong ----------
  function coverPong(){
    const u = uid();
    let trail = ''; for (let k = 0; k < 9; k++) trail += `<circle cx="${380 - k * 20}" cy="${150 + k * 9}" r="${11 - k}" fill="#00f0ff" opacity="${(.6 - k * .06).toFixed(2)}"/>`;
    return wrap(u, lg(u + 's', [[0, '#05030f'], [1, '#160a30']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <line x1="320" y1="0" x2="320" y2="360" stroke="#fff" stroke-opacity=".25" stroke-width="5" stroke-dasharray="14 14"/>
      <text x="230" y="90" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="70" fill="#ff3d8b" opacity=".85">7</text>
      <text x="410" y="90" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="70" fill="#00f0ff" opacity=".85">5</text>
      <rect x="50" y="170" width="16" height="96" rx="8" fill="#ff3d8b"/><rect x="40" y="160" width="36" height="116" rx="18" fill="#ff3d8b" opacity=".3" filter="url(#${u}b)"/>
      <rect x="574" y="80" width="16" height="96" rx="8" fill="#00f0ff"/><rect x="564" y="70" width="36" height="116" rx="18" fill="#00f0ff" opacity=".3" filter="url(#${u}b)"/>
      ${trail}<circle cx="392" cy="144" r="13" fill="#fff"/><circle cx="392" cy="144" r="26" fill="#00f0ff" opacity=".35" filter="url(#${u}b2)"/>`);
  }
  const logoPong = () => logoWrap([[0, '#160a30'], [1, '#05030f']], `<rect x="10" y="18" width="6" height="26" rx="3" fill="#ff3d8b"/><rect x="48" y="22" width="6" height="26" rx="3" fill="#00f0ff"/><circle cx="32" cy="30" r="5" fill="#fff"/>`);

  // ---------- Schach ----------
  function coverSchach(){
    const u = uid();
    let b = '';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++){
      const y0 = 200 + r * 28 + r * r * 2, y1 = 200 + (r + 1) * 28 + (r + 1) * (r + 1) * 2, sx = 1 + r * .18, sx1 = 1 + (r + 1) * .18;
      const x0 = 320 + (c - 5) * 64 * sx, x1 = 320 + (c - 4) * 64 * sx, x2 = 320 + (c - 4) * 64 * sx1, x3 = 320 + (c - 5) * 64 * sx1;
      b += `<polygon points="${x0},${y0} ${x1},${y0} ${x2},${y1} ${x3},${y1}" fill="${(r + c) % 2 ? '#b98a5a' : '#ecd6b0'}"/>`;
    }
    return wrap(u, lg(u + 's', [[0, '#0e0c14'], [1, '#2a2030']]) + rg(u + 'glow', [[0, '#ffcf8a', .5], [1, '#ffcf8a', 0]]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="320" cy="140" r="220" fill="url(#${u}glow)"/>${b}
      <text x="250" y="250" text-anchor="middle" font-family="Segoe UI Symbol" font-size="170" fill="#1a1a22" stroke="#000" stroke-width="2">♚</text>
      <text x="400" y="262" text-anchor="middle" font-family="Segoe UI Symbol" font-size="150" fill="#f4efe6" stroke="#9a8a70" stroke-width="2">♞</text>
      <text x="520" y="300" text-anchor="middle" font-family="Segoe UI Symbol" font-size="90" fill="#f4efe6" stroke="#9a8a70" stroke-width="1.5" opacity=".9">♟</text>`);
  }
  const logoSchach = () => logoWrap([[0, '#3a2a20'], [1, '#14100c']], `<text x="32" y="50" text-anchor="middle" font-family="Segoe UI Symbol" font-size="44" fill="#f4efe6">♞</text>`);

  // ---------- Sternenangriff (Invaders) ----------
  const INV = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
  function invader(x, y, s, c){ let o = ''; INV.forEach((row, r) => [...row].forEach((b, k) => { if (b === '1') o += `<rect x="${x + k * s}" y="${y + r * s}" width="${s}" height="${s}" fill="${c}"/>`; })); return o; }
  function coverInvasion(){
    const u = uid(), r = rng(5);
    let stars = ''; for (let k = 0; k < 80; k++) stars += `<rect x="${(r() * W).toFixed(0)}" y="${(r() * H).toFixed(0)}" width="2" height="2" fill="#fff" opacity="${(.2 + r() * .6).toFixed(2)}"/>`;
    let inv = ''; const cols = ['#ff5d8f', '#ffd23f', '#3fe6ff'];
    for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) inv += invader(110 + c * 74, 40 + row * 50, 4.2, cols[row]);
    return wrap(u, lg(u + 's', [[0, '#05040e'], [1, '#14103a']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${stars}
      <g filter="url(#${u}b2)" opacity=".6">${inv}</g>${inv}
      <rect x="300" y="300" width="44" height="14" fill="#3fd28b"/><rect x="314" y="290" width="16" height="12" fill="#3fd28b"/><rect x="320" y="280" width="4" height="12" fill="#3fd28b"/>
      <rect x="320" y="190" width="4" height="22" fill="#fff"/><rect x="200" y="230" width="4" height="14" fill="#ff5d8f"/>
      <rect x="0" y="340" width="${W}" height="3" fill="#3fd28b" opacity=".6"/>`);
  }
  const logoInvasion = () => logoWrap([[0, '#14103a'], [1, '#05040e']], invader(9, 15, 4.2, '#3fe6ff'));

  // ---------- Nachtfahrt ----------
  function coverNacht(){
    const u = uid();
    let grid = ''; for (let k = -10; k <= 10; k++) grid += `<line x1="${320 + k * 18}" y1="200" x2="${320 + k * 140}" y2="360" stroke="#ff3dbb" stroke-opacity=".55" stroke-width="2"/>`;
    for (let k = 0; k < 8; k++){ const y = 200 + Math.pow(k / 7, 2) * 160; grid += `<line x1="0" y1="${y}" x2="640" y2="${y}" stroke="#ff3dbb" stroke-opacity=".45" stroke-width="2"/>`; }
    let sun = ''; for (let k = 0; k < 6; k++) sun += `<rect x="220" y="${150 + k * 9}" width="200" height="${3 + k * .8}" fill="#2a0a3a"/>`;
    return wrap(u, lg(u + 's', [[0, '#0a0420'], [.55, '#3a0a5a'], [1, '#ff3d8b']]) + lg(u + 'sun', [[0, '#ffe66a'], [1, '#ff3d8b']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="320" cy="150" r="96" fill="url(#${u}sun)"/>${sun}
      <path d="M0 200 L90 150 L160 180 L240 130 L320 200Z M320 200 L420 140 L500 175 L560 140 L640 200Z" fill="#1a0630"/>
      <rect y="200" width="${W}" height="160" fill="#0c0420"/>${grid}
      <path d="M280 200 L360 200 L520 360 L120 360Z" fill="#14082a"/>
      <g transform="translate(320 300)"><path d="M-80 30 L-70 -6 Q-60 -26 -30 -28 L30 -28 Q60 -26 70 -6 L80 30Z" fill="#14141c"/><path d="M-50 -24 L-36 -42 L36 -42 L50 -24Z" fill="#2a2a3a"/>
        <rect x="-74" y="2" width="30" height="8" rx="3" fill="#ff2a4a"/><rect x="44" y="2" width="30" height="8" rx="3" fill="#ff2a4a"/><rect x="-80" y="0" width="160" height="12" fill="#ff2a4a" opacity=".25" filter="url(#${u}b2)"/></g>`);
  }
  const logoNacht = () => logoWrap([[0, '#3a0a5a'], [1, '#ff3d8b']], `<circle cx="32" cy="26" r="14" fill="#ffe66a"/><rect y="34" width="64" height="30" fill="#0c0420"/><path d="M26 34 L38 34 L52 64 L12 64Z" fill="#ff3dbb" opacity=".6"/>`);

  // ---------- Einträge ----------
  const add = (e, c, l) => HubCatalogAdd(e, c, l);
  const READY = ['solitaer', 'vier', 'sudoku', 'juwelen', 'asteroiden', 'turm', 'reversi', 'wort', 'pong', 'schach', 'invasion', 'nacht'];   // fertige Spiele
  const E = [
    [{id:'solitaer', file:'spiele/solitaer.html', title:'Solitär', tagline:'Die Patience, die jeder kennt.', genres:['Karten', 'Denken'], accent:'#2fbf71',
      desc:'Klondike-Solitär mit flüssigem Ziehen und Ablegen, automatischem Ablegen per Klick, Rückgängig, Tipps und der berühmten Karten-Siegesanimation. Wahlweise 1 oder 3 Karten pro Zug.',
      controls:[['Ziehen', 'Karten bewegen'], ['Klick', 'Automatisch ablegen'], ['Strg + Z', 'Rückgängig'], ['H', 'Tipp']]}, coverSolitaer, logoSolitaer],
    [{id:'vier', file:'spiele/viergewinnt.html', title:'Vier gewinnt', tagline:'Vier in einer Reihe – gegen eine echte KI.', genres:['Denken', 'Brettspiel'], accent:'#3d8bff',
      desc:'Der Klassiker gegen einen Computer mit drei Stärken – oder zu zweit an einem Bildschirm. Mit fallenden Steinen, Siegeslinie und Rückgängig-Funktion.',
      controls:[['Klick / 1–7', 'Stein einwerfen'], ['N', 'Neue Runde']]}, coverVier, logoVier],
    [{id:'sudoku', file:'spiele/sudoku.html', title:'Sudoku', tagline:'Jeden Tag ein neues Rätsel.', genres:['Denken', 'Puzzle'], accent:'#7c6cff',
      desc:'Unendlich viele Sudokus in vier Schwierigkeitsstufen. Notizen, Fehlerprüfung, Tipps, Markierung gleicher Zahlen und Bestzeiten.',
      controls:[['1–9', 'Zahl setzen'], ['N', 'Notizmodus'], ['Pfeiltasten', 'Bewegen']], lowerBetter:true}, coverSudoku, logoSudoku],
    [{id:'juwelen', file:'spiele/juwelen.html', title:'Juwelen', tagline:'Tauschen, kombinieren, explodieren.', genres:['Puzzle', 'Arcade'], accent:'#c77bff',
      desc:'Tausche Edelsteine und bilde Reihen aus drei oder mehr. Vierer werden zu Bomben, Fünfer zu Regenbogen-Steinen – Kettenreaktionen inklusive.',
      controls:[['Klick / Wischen', 'Steine tauschen']]}, coverJuwelen, logoJuwelen],
    [{id:'asteroiden', file:'spiele/asteroiden.html', title:'Asteroiden', tagline:'Überleben im Gesteinssturm.', genres:['Arcade', 'Action'], accent:'#4f9dff',
      desc:'Vektor-Weltraumklassiker: Zerschieße Asteroiden, weiche UFOs aus, sammle Power-ups und überlebe immer härtere Wellen.',
      controls:[['← →', 'Drehen'], ['↑', 'Schub'], ['Leertaste', 'Schießen'], ['Shift', 'Hyperraum']]}, coverAsteroiden, logoAsteroiden],
    [{id:'turm', file:'spiele/turm.html', title:'Turmverteidigung', tagline:'Kein Gegner kommt durch.', genres:['Strategie', 'Action'], accent:'#3fd28b',
      desc:'Baue und verbessere vier Turmarten entlang des Weges und halte 30 immer stärkere Angriffswellen auf – inklusive Bossgegnern.',
      controls:[['Klick', 'Turm bauen / wählen'], ['Leertaste', 'Nächste Welle']]}, coverTurm, logoTurm],
    [{id:'reversi', file:'spiele/reversi.html', title:'Reversi', tagline:'Ein Zug kann alles drehen.', genres:['Denken', 'Brettspiel'], accent:'#2fbf71',
      desc:'Umzingle die Steine deines Gegners, um sie umzudrehen. Gegen eine KI in drei Stärken oder zu zweit.',
      controls:[['Klick', 'Stein setzen']]}, coverReversi, logoReversi],
    [{id:'wort', file:'spiele/wort.html', title:'Wortjagd', tagline:'Errate das Wort in sechs Versuchen.', genres:['Denken', 'Wörter'], accent:'#3fa94a',
      desc:'Das beliebte Wort-Rätsel auf Deutsch: Errate das gesuchte Wort mit fünf Buchstaben. Grün heißt richtig, Gelb heißt falscher Platz.',
      controls:[['Tastatur', 'Buchstaben'], ['Enter', 'Raten']]}, coverWort, logoWort],
    [{id:'pong', file:'spiele/pong.html', title:'Neon-Pong', tagline:'Der Urvater aller Videospiele.', genres:['Arcade', 'Geschick'], accent:'#ff4f9a',
      desc:'Pong in Neon gegen eine KI oder zu zweit: Effetschläge, immer schneller werdende Bälle und Leuchteffekte.',
      controls:[['W S / Maus', 'Schläger links'], ['↑ ↓', 'Schläger rechts']]}, coverPong, logoPong],
    [{id:'schach', file:'spiele/schach.html', title:'Schach', tagline:'Das Spiel der Könige.', genres:['Denken', 'Brettspiel'], accent:'#ffb547',
      desc:'Vollständiges Schach mit allen Regeln – Rochade, en passant, Umwandlung – gegen einen Computer in drei Stärken oder zu zweit.',
      controls:[['Klick / Ziehen', 'Figur bewegen']]}, coverSchach, logoSchach],
    [{id:'invasion', file:'spiele/invasion.html', title:'Sternenangriff', tagline:'Sie kommen in Reihen.', genres:['Arcade', 'Action'], accent:'#3fe6ff',
      desc:'Verteidige die Erde gegen Wellen von Pixel-Aliens. Deckung, Mutterschiffe und immer schnellere Angriffe.',
      controls:[['← →', 'Bewegen'], ['Leertaste', 'Schießen']]}, coverInvasion, logoInvasion],
    [{id:'nacht', file:'spiele/nachtfahrt.html', title:'Nachtfahrt', tagline:'Retro-Rennen in den Sonnenuntergang.', genres:['Rennen', 'Arcade'], accent:'#ff3dbb',
      desc:'Pseudo-3D-Rennspiel im Stil der 80er: Kurven, Hügel, Verkehr und Checkpoints. Wie weit kommst du, bevor die Zeit abläuft?',
      controls:[['← →', 'Lenken'], ['↑', 'Gas'], ['↓', 'Bremse']]}, coverNacht, logoNacht],
  ];
  E.forEach(([e, c, l]) => { if (READY.includes(e.id)) add(e, c, l); });
})();
