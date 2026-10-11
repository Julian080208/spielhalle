/* =====================================================================
   Spielhalle – dritte Spielewelle: Cover-Art und Katalogeinträge
   ===================================================================== */
(function(){
  if (!window.HubArt || !window.HubCatalogAdd) return;
  const {uid, rng, wrap, lg, rg, logoWrap} = HubArt;
  const W = 640, H = 360;

  // ---------- Geisterjagd ----------
  function ghost(x, y, s, col, u){
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-30 4 A30 30 0 0 1 30 4 L30 34 L20 26 L10 34 L0 26 L-10 34 L-20 26 L-30 34 Z" fill="${col}"/>
      <path d="M-30 4 A30 30 0 0 1 30 4 L30 34 L20 26 L10 34 L0 26 L-10 34 L-20 26 L-30 34 Z" fill="${col}" opacity=".5" filter="url(#${u}b)"/>
      <ellipse cx="-11" cy="0" rx="8" ry="10" fill="#fff"/><ellipse cx="13" cy="0" rx="8" ry="10" fill="#fff"/>
      <circle cx="-7" cy="2" r="4.5" fill="#1a2cff"/><circle cx="17" cy="2" r="4.5" fill="#1a2cff"/></g>`;
  }
  function coverGeister(){
    const u = uid();
    let dots = '';
    for (let k = 0; k < 12; k++) dots += `<rect x="${250 + k * 30}" y="196" width="8" height="8" fill="#ffd9b0"/>`;
    return wrap(u, lg(u + 's', [[0, '#04040c'], [1, '#0c0c26']], 1, 1), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <g fill="none" stroke="#2f6bff" stroke-width="5" stroke-linecap="round" opacity=".9">
        <rect x="24" y="24" width="592" height="312" rx="22"/><rect x="60" y="60" width="150" height="90" rx="14"/><rect x="430" y="60" width="150" height="90" rx="14"/>
        <rect x="60" y="250" width="150" height="50" rx="14"/><rect x="430" y="250" width="150" height="50" rx="14"/><path d="M250 60 H390 M250 300 H390"/></g>
      <g fill="none" stroke="#2f6bff" stroke-width="12" opacity=".25" filter="url(#${u}b2)"><rect x="24" y="24" width="592" height="312" rx="22"/></g>
      ${dots}<circle cx="252" cy="120" r="12" fill="#ffd9b0"/><circle cx="252" cy="120" r="22" fill="#ffd9b0" opacity=".3" filter="url(#${u}b2)"/>
      <path d="M180 200 L212 170 A44 44 0 1 0 212 230 Z" fill="#ffd93b"/><circle cx="168" cy="200" r="60" fill="#ffd93b" opacity=".18" filter="url(#${u}b)"/>
      ${ghost(370, 196, 1.15, '#ff4b5c', u)}${ghost(450, 196, 1.15, '#ff9ad6', u)}${ghost(530, 196, 1.15, '#3fe6ff', u)}${ghost(560, 112, .85, '#2b3cff', u)}`);
  }
  const logoGeister = () => logoWrap([[0, '#0c0c26'], [1, '#04040c']], `<path d="M30 32 L46 20 A20 20 0 1 0 46 44 Z" fill="#ffd93b"/><circle cx="54" cy="32" r="3" fill="#ffd9b0"/>`);

  // ---------- Kniffel ----------
  function die(x, y, s, rot, v, held){
    const P = {1:[[0, 0]], 2:[[-1, -1], [1, 1]], 3:[[-1, -1], [0, 0], [1, 1]], 4:[[-1, -1], [1, -1], [-1, 1], [1, 1]], 5:[[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6:[[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]}[v];
    const red = v === 1 || v === 4;
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-40" y="-32" width="80" height="80" rx="16" fill="#000" opacity=".35"/>
      <rect x="-40" y="-40" width="80" height="80" rx="16" fill="#b9bdc9"/><rect x="-40" y="-44" width="80" height="80" rx="16" fill="#fbfbfd" ${held ? 'stroke="#ffd23f" stroke-width="5"' : ''}/>
      ${P.map(([a, b]) => `<circle cx="${a * 21}" cy="${b * 21 - 4}" r="7.5" fill="${red ? '#c4102a' : '#15151c'}"/>`).join('')}</g>`;
  }
  function coverKniffel(){
    const u = uid();
    return wrap(u, rg(u + 'f', [[0, '#34a066'], [.6, '#16603a'], [1, '#0a2e1e']], '50%', '40%', '75%'), `
      <rect width="${W}" height="${H}" fill="url(#${u}f)"/>
      <rect x="10" y="10" width="620" height="340" rx="26" fill="none" stroke="#4a2c18" stroke-width="16"/>
      <g transform="translate(470 40) rotate(6)"><rect width="140" height="190" rx="8" fill="#fffdf4"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<line x1="12" x2="128" y1="${30 + k * 20}" y2="${30 + k * 20}" stroke="#9fb3d9" stroke-width="2"/><text x="112" y="${26 + k * 20}" font-family="Segoe Print,Segoe UI" font-size="14" fill="#2a4fb0" text-anchor="end">${[3, 8, 12, 16, 15, 24, 25, 50][k]}</text>`).join('')}<text x="12" y="20" font-family="Bahnschrift" font-weight="700" font-size="14" fill="#333">KNIFFEL</text></g>
      ${die(110, 210, 1.15, -18, 6, true)}${die(215, 160, 1.15, 10, 6, true)}${die(320, 225, 1.15, -6, 6, false)}${die(400, 140, 1, 24, 6, false)}${die(190, 290, .95, 32, 6, true)}
      <text x="310" y="70" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="54" fill="#ffd23f" transform="rotate(-6 310 70)" style="paint-order:stroke" stroke="#7a4d00" stroke-width="6">KNIFFEL!</text>`);
  }
  const logoKniffel = () => logoWrap([[0, '#2c8a55'], [1, '#0d3d24']], `<rect x="12" y="12" width="40" height="40" rx="9" fill="#fff" transform="rotate(-10 32 32)"/><g transform="rotate(-10 32 32)" fill="#15151c"><circle cx="22" cy="22" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="42" cy="42" r="4"/><circle cx="42" cy="22" r="4"/><circle cx="22" cy="42" r="4"/></g>`);

  // ---------- Minigolf ----------
  function coverGolf(){
    const u = uid(), r = rng(11);
    let blades = '';
    for (let k = 0; k < 4; k++) blades += `<rect x="-6" y="-78" width="12" height="78" fill="#f2ead8" stroke="#a5303a" stroke-width="2" transform="rotate(${k * 90 + 20})"/>`;
    let grass = ''; for (let k = 0; k < 9; k++) grass += `<path d="M${k * 90 - 60} 360 L${k * 90 - 20} 360 L${k * 90 + 140} 0 L${k * 90 + 100} 0Z" fill="#fff" opacity=".045"/>`;
    return wrap(u, lg(u + 's', [[0, '#3db35a'], [1, '#1d7a36']], 1, 1) + rg(u + 'h', [[0, '#000'], [.85, '#111'], [1, '#444']]) + `<clipPath id="${u}cp"><path d="M40 40 H600 V250 H420 V320 H40 Z"/></clipPath>`, `
      <rect width="${W}" height="${H}" fill="#0b1a10"/>
      <path d="M40 40 H600 V250 H420 V320 H40 Z" fill="url(#${u}s)"/>
      <g clip-path="url(#${u}cp)">${grass}</g>
      <path d="M40 40 H600 V250 H420 V320 H40 Z" fill="none" stroke="#4b2c16" stroke-width="22" stroke-linejoin="round"/><path d="M40 40 H600 V250 H420 V320 H40 Z" fill="none" stroke="#9a6538" stroke-width="13" stroke-linejoin="round"/>
      <rect x="150" y="150" width="130" height="120" fill="#1d7fd1"/><path d="M150 180 q16 -6 32 0 t32 0 t32 0 t32 0 M150 220 q16 -6 32 0 t32 0 t32 0 t32 0" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none"/>
      <ellipse cx="470" cy="190" rx="60" ry="40" fill="#e4c98a"/>
      <circle cx="520" cy="110" r="16" fill="url(#${u}h)"/><line x1="520" y1="110" x2="528" y2="20" stroke="#eee" stroke-width="4"/><path d="M528 20 l52 10 l-50 18z" fill="#ff3d5a"/>
      <g transform="translate(330 120)">${blades}<circle r="14" fill="#a5303a"/></g>
      <circle cx="96" cy="276" r="11" fill="#fff"/><circle cx="96" cy="276" r="24" fill="#fff" opacity=".25" filter="url(#${u}b2)"/>
      <path d="M96 276 L250 120" stroke="#fff" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>
      <circle cx="580" cy="300" r="20" fill="#e8304a"/><circle cx="580" cy="300" r="12" fill="#fff"/><circle cx="580" cy="300" r="6" fill="#e8304a"/>`);
  }
  const logoGolf = () => logoWrap([[0, '#3db35a'], [1, '#1d7a36']], `<ellipse cx="30" cy="48" rx="12" ry="5" fill="#000"/><line x1="30" y1="48" x2="32" y2="10" stroke="#fff" stroke-width="3"/><path d="M32 10 l18 6 l-18 7z" fill="#ff3d5a"/><circle cx="46" cy="46" r="5" fill="#fff"/>`);

  // ---------- Schiffe versenken ----------
  function coverSchiffe(){
    const u = uid();
    let grid = '';
    for (let k = 0; k <= 12; k++) grid += `<line x1="${k * 54}" y1="0" x2="${k * 54}" y2="360" stroke="#8fd0ff" stroke-opacity=".12"/><line x1="0" y1="${k * 54 - 30}" x2="640" y2="${k * 54 - 30}" stroke="#8fd0ff" stroke-opacity=".12"/>`;
    const ship = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-150 0 Q-140 -30 -100 -32 L120 -32 Q160 -16 170 0 Q160 16 120 32 L-100 32 Q-140 30 -150 0Z" fill="#3a4a5c"/><path d="M-130 0 Q-124 -18 -96 -20 L110 -20 Q140 -10 146 0 Q140 10 110 20 L-96 20 Q-124 18 -130 0Z" fill="#6f8296"/><rect x="-30" y="-14" width="56" height="28" rx="5" fill="#3a4a5c"/><circle cx="-80" cy="0" r="11" fill="#3a4a5c"/><rect x="-80" y="-3" width="34" height="6" fill="#3a4a5c"/><circle cx="80" cy="0" r="11" fill="#3a4a5c"/><rect x="80" y="-3" width="34" height="6" fill="#3a4a5c"/></g>`;
    return wrap(u, lg(u + 's', [[0, '#0f4a78'], [1, '#06223e']], 1, 1) + rg(u + 'x', [[0, '#fff6b0'], [.4, '#ff9a2e'], [.75, '#ff3d2e', .8], [1, '#ff3d2e', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>${grid}
      ${ship(250, 190, 1.1, -8)}
      <circle cx="300" cy="180" r="70" fill="url(#${u}x)"/><circle cx="300" cy="180" r="110" fill="#ff7a2e" opacity=".25" filter="url(#${u}b)"/>
      <path d="M300 150 q-20 -60 10 -120 q30 50 -10 120" fill="#333" opacity=".5" filter="url(#${u}b2)"/>
      <g fill="#dff0ff" opacity=".8"><circle cx="486" cy="78" r="9"/><circle cx="540" cy="132" r="9"/><circle cx="432" cy="294" r="9"/><circle cx="108" cy="78" r="9"/></g>
      <circle cx="540" cy="240" r="22" fill="none" stroke="#ff5d6c" stroke-width="4"/><line x1="540" y1="205" x2="540" y2="275" stroke="#ff5d6c" stroke-width="3"/><line x1="505" y1="240" x2="575" y2="240" stroke="#ff5d6c" stroke-width="3"/>`);
  }
  const logoSchiffe = () => logoWrap([[0, '#0f4a78'], [1, '#06223e']], `<path d="M8 36 L56 36 L48 48 L16 48Z" fill="#a7b8c9"/><rect x="24" y="26" width="14" height="10" fill="#a7b8c9"/><rect x="40" y="30" width="12" height="3" fill="#a7b8c9"/><circle cx="46" cy="18" r="8" fill="#ff7a2e"/>`);

  // ---------- Himmelssprung ----------
  function coverHimmel(){
    const u = uid();
    const plat = (x, y, w, c1, c2) => `<rect x="${x + 4}" y="${y + 7}" width="${w}" height="20" rx="10" fill="#000" opacity=".15"/><rect x="${x}" y="${y}" width="${w}" height="20" rx="10" fill="${c1}"/><rect x="${x}" y="${y + 10}" width="${w}" height="10" rx="5" fill="${c2}" opacity=".6"/><rect x="${x + 10}" y="${y + 3}" width="${w - 20}" height="4" rx="2" fill="#fff" opacity=".5"/>`;
    const cl = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity="${o}"><circle cx="0" cy="0" r="30"/><circle cx="34" cy="-12" r="36"/><circle cx="70" cy="0" r="28"/><rect x="0" y="0" width="70" height="26"/></g>`;
    return wrap(u, lg(u + 's', [[0, '#3a8cff'], [.6, '#8fd0ff'], [1, '#d6f0ff']]) + lg(u + 'p', [[0, '#ffe36b'], [1, '#ff9f2e']]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      ${cl(40, 80, 1.3, .55)}${cl(470, 50, 1, .5)}${cl(380, 300, 1.6, .6)}${cl(-20, 300, 1.2, .5)}
      ${plat(90, 270, 110, '#5fe36b', '#2a9a3a')}${plat(400, 210, 110, '#5ab8ff', '#1f6fc9')}${plat(200, 140, 110, '#ffffff', '#b8c6d8')}${plat(470, 70, 110, '#5fe36b', '#2a9a3a')}
      <g transform="translate(300 175) rotate(-8)"><ellipse rx="40" ry="44" fill="url(#${u}p)"/><ellipse cx="10" cy="-14" rx="13" ry="15" fill="#fff"/><ellipse cx="-14" cy="-14" rx="10" ry="13" fill="#fff"/><circle cx="15" cy="-12" r="6" fill="#1b1530"/><circle cx="-10" cy="-12" r="5" fill="#1b1530"/><path d="M30 4 L52 10 L30 16Z" fill="#ff5d3a"/><ellipse cx="-16" cy="42" rx="14" ry="8" fill="#ff7a2e"/><ellipse cx="16" cy="42" rx="14" ry="8" fill="#ff7a2e"/></g>
      <path d="M300 240 v40 M286 250 v26 M314 250 v26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>
      <g fill="#ffe066"><path d="M560 160 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z"/><path d="M130 190 l5 10 11 2 -8 8 2 11 -10 -6 -10 6 2 -11 -8 -8 11 -2z"/></g>`);
  }
  const logoHimmel = () => logoWrap([[0, '#3a8cff'], [1, '#8fd0ff']], `<rect x="10" y="46" width="44" height="9" rx="4.5" fill="#5fe36b"/><ellipse cx="32" cy="28" rx="13" ry="14" fill="#ffc93b"/><circle cx="36" cy="24" r="4" fill="#fff"/><circle cx="37" cy="24" r="2" fill="#1b1530"/><path d="M43 29 l8 2 -8 3z" fill="#ff5d3a"/>`);

  // ---------- Blasenzauber ----------
  function coverBlasen(){
    const u = uid(), r = rng(5), cols = [['#ff4d6d', '#b0153a'], ['#ffc53d', '#c77a00'], ['#3fd28b', '#108a52'], ['#4f9dff', '#1a4fc0'], ['#c77bff', '#7a2fc9']];
    let defs = lg(u + 's', [[0, '#1a0f3a'], [1, '#0a0618']]), b = '';
    cols.forEach(([a, c], k) => defs += rg(u + 'q' + k, [[0, '#fff'], [.25, a], [1, c]], '35%', '30%', '70%'));
    for (let row = 0; row < 4; row++) for (let c = 0; c < 13; c++){
      if (row === 3 && (c < 3 || c > 8)) continue;
      const x = 24 + c * 50 + (row % 2) * 25, y = 26 + row * 43, k = Math.floor(r() * 5);
      b += `<circle cx="${x}" cy="${y}" r="24" fill="url(#${u}q${k})"/><ellipse cx="${x - 8}" cy="${y - 10}" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-35 ${x - 8} ${y - 10})"/>`;
    }
    return wrap(u, defs, `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${b}
      <path d="M320 300 L250 200 L180 240" stroke="#fff" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" fill="none" opacity=".7"/>
      <circle cx="320" cy="320" r="46" fill="#2a1a5a" stroke="#7a5cff" stroke-width="4"/><circle cx="320" cy="320" r="26" fill="url(#${u}q2)"/>
      ${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${300 + Math.cos(k) * 60}" cy="${190 + Math.sin(k) * 40}" r="${6 + k}" fill="${cols[k % 5][0]}" opacity=".8"/>`).join('')}
      <circle cx="260" cy="195" r="60" fill="#c77bff" opacity=".25" filter="url(#${u}b)"/>`);
  }
  const logoBlasen = () => logoWrap([[0, '#2a1a5a'], [1, '#0a0618']], `<circle cx="22" cy="24" r="11" fill="#ff4d6d"/><circle cx="42" cy="24" r="11" fill="#4f9dff"/><circle cx="32" cy="42" r="11" fill="#3fd28b"/><circle cx="18" cy="20" r="3" fill="#fff" opacity=".6"/><circle cx="38" cy="20" r="3" fill="#fff" opacity=".6"/><circle cx="28" cy="38" r="3" fill="#fff" opacity=".6"/>`);

  // ---------- Neon-Flipper ----------
  function coverFlipper(){
    const u = uid();
    let grid = ''; for (let k = 0; k < 22; k++) grid += `<line x1="${k * 30}" y1="0" x2="${k * 30}" y2="360" stroke="#a050ff" stroke-opacity=".08"/>`;
    const bump = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="#ff3dbb" opacity=".35" filter="url(#${u}b)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}bp)"/><circle cx="${x}" cy="${y}" r="${r * .6}" fill="none" stroke="#fff" stroke-width="3"/>`;
    return wrap(u, lg(u + 's', [[0, '#1c0a3a'], [1, '#05020e']]) + rg(u + 'bp', [[0, '#ffc0ec'], [1, '#9a1a6e']], '40%', '35%', '65%') + rg(u + 'ball', [[0, '#fff'], [.5, '#c8cbd8'], [1, '#5a5e70']], '35%', '35%', '65%'), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>${grid}
      <path d="M60 360 L60 120 A260 160 0 0 1 580 120 L580 360" fill="none" stroke="#7a5cff" stroke-width="7"/>
      <path d="M60 360 L60 120 A260 160 0 0 1 580 120 L580 360" fill="none" stroke="#7a5cff" stroke-width="18" opacity=".3" filter="url(#${u}b2)"/>
      ${bump(250, 120, 32)}${bump(390, 120, 32)}${bump(320, 200, 32)}
      <g stroke-linecap="round"><line x1="190" y1="300" x2="280" y2="335" stroke="#ff3dbb" stroke-width="20"/><line x1="450" y1="300" x2="360" y2="250" stroke="#ff3dbb" stroke-width="20"/>
      <line x1="190" y1="300" x2="280" y2="335" stroke="#ffd0f0" stroke-width="6"/><line x1="450" y1="300" x2="360" y2="250" stroke="#ffd0f0" stroke-width="6"/></g>
      <path d="M110 220 L110 290 L160 316Z" fill="#ffb347" opacity=".35" stroke="#ffb347" stroke-width="4"/><path d="M530 220 L530 290 L480 316Z" fill="#ffb347" opacity=".35" stroke="#ffb347" stroke-width="4"/>
      <circle cx="400" cy="240" r="14" fill="url(#${u}ball)"/><path d="M400 240 L470 330" stroke="#fff" stroke-opacity=".2" stroke-width="10" stroke-linecap="round"/>
      <g fill="#3fe6ff"><circle cx="270" cy="58" r="7"/><circle cx="320" cy="52" r="7"/><circle cx="370" cy="58" r="7" opacity=".3"/></g>
      <text x="320" y="300" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="34" fill="#3fe6ff" opacity=".18" transform="rotate(-8 320 300)">NEON</text>`);
  }
  const logoFlipper = () => logoWrap([[0, '#1c0a3a'], [1, '#05020e']], `<circle cx="32" cy="22" r="10" fill="#ff3dbb"/><circle cx="32" cy="22" r="5" fill="none" stroke="#fff" stroke-width="2"/><line x1="12" y1="48" x2="28" y2="54" stroke="#ff3dbb" stroke-width="6" stroke-linecap="round"/><line x1="52" y1="48" x2="36" y2="54" stroke="#ff3dbb" stroke-width="6" stroke-linecap="round"/><circle cx="44" cy="38" r="4" fill="#ddd"/>`);

  // ---------- Dame ----------
  function coverDame(){
    const u = uid();
    let b = '';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++){
      const y0 = 150 + r * 34 + r * r * 2.4, y1 = 150 + (r + 1) * 34 + (r + 1) * (r + 1) * 2.4, sx = 1 + r * .2, sx1 = 1 + (r + 1) * .2;
      const x0 = 320 + (c - 5) * 64 * sx, x1 = 320 + (c - 4) * 64 * sx, x2 = 320 + (c - 4) * 64 * sx1, x3 = 320 + (c - 5) * 64 * sx1;
      b += `<polygon points="${x0},${y0} ${x1},${y0} ${x2},${y1} ${x3},${y1}" fill="${(r + c) % 2 ? '#8a5a34' : '#ecd6b0'}"/>`;
    }
    const pc = (x, y, s, w, k) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="10" rx="34" ry="14" fill="#000" opacity=".35"/><ellipse cx="0" cy="6" rx="32" ry="13" fill="${w ? '#b8a27c' : '#0a0705'}"/><ellipse cx="0" cy="0" rx="32" ry="13" fill="${w ? '#f4ead6' : '#3a2c22'}"/><ellipse cx="0" cy="0" rx="20" ry="8" fill="none" stroke="${w ? '#c9b796' : '#5a4a40'}" stroke-width="2"/>${k ? `<text x="0" y="-4" text-anchor="middle" font-size="30" fill="#e0aa20" font-family="Segoe UI Symbol">♛</text>` : ''}</g>`;
    return wrap(u, lg(u + 's', [[0, '#1e140c'], [1, '#3a2614']]) + rg(u + 'gl', [[0, '#ffcf8a', .45], [1, '#ffcf8a', 0]]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="320" cy="120" r="240" fill="url(#${u}gl)"/>${b}
      ${pc(190, 205, 1, false)}${pc(300, 240, 1.15, false)}${pc(420, 205, 1, true)}${pc(250, 300, 1.35, true)}${pc(470, 290, 1.35, true, true)}${pc(370, 168, .85, false, true)}
      <path d="M300 236 Q350 160 420 200" fill="none" stroke="#5aff96" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>`);
  }
  const logoDame = () => logoWrap([[0, '#8a5a34'], [1, '#3a2312']], `<ellipse cx="32" cy="40" rx="20" ry="8" fill="#b8a27c"/><ellipse cx="32" cy="34" rx="20" ry="8" fill="#f4ead6"/><ellipse cx="32" cy="27" rx="20" ry="8" fill="#b8a27c"/><ellipse cx="32" cy="22" rx="20" ry="8" fill="#f4ead6"/><text x="32" y="27" text-anchor="middle" font-size="14" fill="#d9a520" font-family="Segoe UI Symbol">♛</text>`);

  // ---------- Mahjong ----------
  function coverMahjong(){
    const u = uid();
    const tile = (x, y, ch, col, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="7" width="64" height="84" rx="9" fill="#8e7a52"/><rect x="-3" y="3" width="64" height="84" rx="9" fill="#c9b994"/><rect x="0" y="0" width="64" height="84" rx="9" fill="#fbf6e8"/>
      <text x="32" y="58" text-anchor="middle" font-family="Microsoft YaHei,SimSun,serif" font-size="44" font-weight="700" fill="${col}">${ch}</text></g>`;
    let t = '';
    const L = [[120, 170, '東', '#1a1a2a'], [184, 170, '中', '#c4202f'], [248, 170, '發', '#1f8a4a'], [312, 170, '萬', '#c4202f'], [376, 170, '北', '#1a1a2a'], [440, 170, '南', '#1a1a2a'],
      [152, 90, '三', '#1a1a2a'], [216, 90, '中', '#c4202f'], [280, 90, '西', '#1a1a2a'], [344, 90, '發', '#1f8a4a'], [408, 90, '五', '#1a1a2a']];
    L.forEach(([x, y, c, col]) => t += tile(x, y, c, col));
    t += tile(250, 30, '中', '#c4202f', 1.05);
    return wrap(u, rg(u + 's', [[0, '#1f5a48'], [1, '#081a15']], '50%', '45%', '75%'), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${t}
      <g transform="translate(470 250) rotate(12)"><rect x="-3" y="3" width="64" height="84" rx="9" fill="#c9b994"/><rect width="64" height="84" rx="9" fill="#fff7c2" stroke="#ffd86b" stroke-width="3"/><text x="32" y="58" text-anchor="middle" font-family="Microsoft YaHei" font-size="44" font-weight="700" fill="#c4202f">中</text></g>`);
  }
  const logoMahjong = () => logoWrap([[0, '#1f5a48'], [1, '#081a15']], `<rect x="16" y="10" width="34" height="46" rx="6" fill="#c9b994"/><rect x="14" y="8" width="34" height="46" rx="6" fill="#fbf6e8"/><text x="31" y="40" text-anchor="middle" font-family="Microsoft YaHei,SimSun" font-size="24" font-weight="700" fill="#c4202f">中</text>`);

  // ---------- Memory ----------
  function coverMemory(){
    const u = uid(), em = ['🦊', '🐼', '🍕', '🚀', '🦊', '⭐', '🐸', '🍩'];
    let c = '';
    em.forEach((e, k) => {
      const x = 70 + (k % 4) * 130, y = 40 + Math.floor(k / 4) * 150, up = [0, 4, 2, 6].includes(k), rot = [-6, 4, -3, 7, 5, -5, 3, -4][k];
      c += `<g transform="translate(${x + 50} ${y + 60}) rotate(${rot})"><rect x="-48" y="-54" width="96" height="116" rx="14" fill="#000" opacity=".35" transform="translate(4 8)"/>` +
        (up ? `<rect x="-48" y="-58" width="96" height="116" rx="14" fill="#fffdf7" ${k === 0 || k === 4 ? 'stroke="#3fd28b" stroke-width="5"' : ''}/><text x="0" y="18" text-anchor="middle" font-size="58" font-family="Segoe UI Emoji">${e}</text>`
            : `<rect x="-48" y="-58" width="96" height="116" rx="14" fill="url(#${u}cb)"/><rect x="-38" y="-48" width="76" height="96" rx="9" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-dasharray="5 4"/>`) + '</g>';
    });
    return wrap(u, rg(u + 's', [[0, '#3a1e70'], [1, '#0a0618']], '50%', '30%', '80%') + lg(u + 'cb', [[0, '#7c6cff'], [1, '#c45cff']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${c}`);
  }
  const logoMemory = () => logoWrap([[0, '#7c6cff'], [1, '#c45cff']], `<rect x="10" y="14" width="22" height="30" rx="4" fill="#fff"/><rect x="34" y="20" width="22" height="30" rx="4" fill="#fff" opacity=".35"/><text x="21" y="35" text-anchor="middle" font-size="15" font-family="Segoe UI Emoji">🦊</text>`);

  // ---------- Lichtrenner ----------
  function coverTron(){
    const u = uid();
    let g = ''; for (let k = -10; k <= 10; k++) g += `<line x1="${320 + k * 40}" y1="200" x2="${320 + k * 160}" y2="360" stroke="#3fe6ff" stroke-opacity=".25"/>`;
    for (let k = 0; k < 7; k++){ const y = 200 + Math.pow(k / 6, 1.8) * 160; g += `<line x1="0" y1="${y}" x2="640" y2="${y}" stroke="#3fe6ff" stroke-opacity=".2"/>`; }
    return wrap(u, lg(u + 's', [[0, '#000'], [.55, '#041428'], [1, '#02040a']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${g}
      <path d="M-10 300 L180 300 L180 230 L360 230 L360 170" fill="none" stroke="#3fe6ff" stroke-width="8" stroke-linejoin="round"/>
      <path d="M-10 300 L180 300 L180 230 L360 230 L360 170" fill="none" stroke="#3fe6ff" stroke-width="22" opacity=".35" filter="url(#${u}b)"/>
      <path d="M650 120 L470 120 L470 210 L380 210" fill="none" stroke="#ff9a3d" stroke-width="8" stroke-linejoin="round"/>
      <path d="M650 120 L470 120 L470 210 L380 210" fill="none" stroke="#ff9a3d" stroke-width="22" opacity=".35" filter="url(#${u}b)"/>
      <path d="M360 140 L346 176 L360 168 L374 176Z" fill="#bff8ff"/><path d="M350 210 L386 196 L378 210 L386 224Z" fill="#ffe0c0"/>
      <text x="320" y="80" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="44" letter-spacing="10" fill="#bff8ff" opacity=".9">LICHTRENNER</text>`);
  }
  const logoTron = () => logoWrap([[0, '#041428'], [1, '#02040a']], `<path d="M8 46 L28 46 L28 26 L48 26" fill="none" stroke="#3fe6ff" stroke-width="5"/><path d="M56 14 L40 14 L40 34" fill="none" stroke="#ff9a3d" stroke-width="5"/>`);

  // ---------- Stapelturm ----------
  function coverStapel(){
    const u = uid();
    const iso = (x, y, z) => [320 + (x - z) * .866, 300 + (x + z) * .5 - y];
    const box = (cx, cz, w, d, y, h) => {
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, yt = y + 22;
      const P = (x, yy, z) => iso(x, yy, z).map(v => v.toFixed(1)).join(',');
      return `<polygon points="${P(x1, yt, z0)} ${P(x1, yt, z1)} ${P(x1, y, z1)} ${P(x1, y, z0)}" fill="hsl(${h},60%,44%)"/><polygon points="${P(x0, yt, z1)} ${P(x1, yt, z1)} ${P(x1, y, z1)} ${P(x0, y, z1)}" fill="hsl(${h},60%,52%)"/><polygon points="${P(x0, yt, z0)} ${P(x1, yt, z0)} ${P(x1, yt, z1)} ${P(x0, yt, z1)}" fill="hsl(${h},62%,64%)"/>`;
    };
    let b = '', w = 150, d = 150;
    for (let k = 0; k < 11; k++){ if (k > 4) w -= 9; if (k > 7) d -= 10; b += box(0, 0, w, d, k * 22, 190 + k * 6); }
    b += box(70, 0, w, d, 11 * 22 + 30, 260);
    return wrap(u, lg(u + 's', [[0, '#9fd6e8'], [1, '#4a6fb8']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${b}
      <text x="320" y="62" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="56" fill="#fff" opacity=".95">11</text>`);
  }
  const logoStapel = () => logoWrap([[0, '#9fd6e8'], [1, '#4a6fb8']], `<rect x="16" y="40" width="32" height="10" fill="#6a7fd8"/><rect x="18" y="29" width="28" height="10" fill="#8a6ad8"/><rect x="21" y="18" width="24" height="10" fill="#c46ad8"/><rect x="28" y="7" width="22" height="10" fill="#e86ab0"/>`);

  // ---------- Froschsprung ----------
  function coverFrosch(){
    const u = uid();
    const car = (x, y, col) => `<rect x="${x}" y="${y}" width="80" height="40" rx="10" fill="${col}"/><rect x="${x + 50}" y="${y + 6}" width="16" height="28" rx="4" fill="#bfe6ff"/>`;
    return wrap(u, lg(u + 'w', [[0, '#0c3a6e'], [1, '#155a9a']]), `<rect width="${W}" height="${H}" fill="#1d1f26"/>
      <rect width="${W}" height="160" fill="url(#${u}w)"/><path d="M0 60 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#fff" stroke-opacity=".15" stroke-width="3" fill="none"/>
      <rect x="40" y="20" width="220" height="44" rx="22" fill="#6b4022"/><rect x="46" y="26" width="208" height="30" rx="15" fill="#8a5a34"/>
      <rect x="380" y="96" width="260" height="44" rx="22" fill="#6b4022"/><rect x="386" y="102" width="248" height="30" rx="15" fill="#8a5a34"/>
      <rect y="160" width="${W}" height="40" fill="#5a3a8a"/>
      <line x1="0" y1="250" x2="640" y2="250" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="30 26"/><line x1="0" y1="300" x2="640" y2="300" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="30 26"/>
      ${car(60, 206, '#ff5d6c')}${car(420, 206, '#4f9dff')}${car(220, 258, '#ffd23f')}${car(520, 306, '#c77bff')}
      <g transform="translate(330 180) scale(1.6)"><ellipse cx="-18" cy="-14" rx="8" ry="6" fill="#2a9a3a"/><ellipse cx="18" cy="-14" rx="8" ry="6" fill="#2a9a3a"/><ellipse cx="-20" cy="16" rx="8" ry="6" fill="#2a9a3a"/><ellipse cx="20" cy="16" rx="8" ry="6" fill="#2a9a3a"/>
      <ellipse cx="0" cy="2" rx="17" ry="21" fill="#5fe36b"/><ellipse cx="0" cy="6" rx="10" ry="12" fill="#9cff6b"/><circle cx="-8" cy="-14" r="6" fill="#fff"/><circle cx="8" cy="-14" r="6" fill="#fff"/><circle cx="-8" cy="-15" r="3" fill="#111"/><circle cx="8" cy="-15" r="3" fill="#111"/></g>`);
  }
  const logoFrosch = () => logoWrap([[0, '#155a9a'], [1, '#1d1f26']], `<ellipse cx="32" cy="34" rx="14" ry="16" fill="#5fe36b"/><circle cx="25" cy="21" r="6" fill="#fff"/><circle cx="39" cy="21" r="6" fill="#fff"/><circle cx="25" cy="20" r="3" fill="#111"/><circle cx="39" cy="20" r="3" fill="#111"/>`);

  // ---------- Billard ----------
  function coverBillard(){
    const u = uid();
    const ball = (x, y, r, col, n, stripe) => `<circle cx="${x + 4}" cy="${y + 6}" r="${r}" fill="#000" opacity=".35"/>` + (stripe
      ? `<clipPath id="${u}c${n}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath><circle cx="${x}" cy="${y}" r="${r}" fill="#f6f4ee"/><rect x="${x - r}" y="${y - r * .55}" width="${r * 2}" height="${r * 1.1}" fill="${col}" clip-path="url(#${u}c${n})"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`) + (n ? `<circle cx="${x}" cy="${y}" r="${r * .45}" fill="#fff"/><text x="${x}" y="${y + r * .22}" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="${r * .62}" fill="#111">${n}</text>` : '') +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}hl)"/>`;
    const C = ['#f5c400', '#1f4fd1', '#d7262b', '#5a2a9a', '#f07a12', '#1a8a3a', '#7a1a1a'];
    let rk = '', k = 0;
    const nums = [1, 10, 3, 14, 8, 6, 9, 12, 5, 2];
    for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++){ const n = nums[k++]; rk += ball(390 + row * 38, 180 + (i - row / 2) * 44, 22, n === 8 ? '#111' : C[(n > 8 ? n - 8 : n) - 1], n, n > 8); }
    return wrap(u, rg(u + 'f', [[0, '#2aa05a'], [1, '#14602f']], '50%', '50%', '70%') + rg(u + 'hl', [[0, '#fff', .7], [.3, '#fff', .05], [1, '#000', .35]], '35%', '30%', '70%'), `
      <rect width="${W}" height="${H}" fill="#3e200f"/><rect x="24" y="24" width="592" height="312" rx="16" fill="#156b3a"/><rect x="44" y="44" width="552" height="272" fill="url(#${u}f)"/>
      <circle cx="44" cy="44" r="20" fill="#050505"/><circle cx="596" cy="44" r="20" fill="#050505"/><circle cx="44" cy="316" r="20" fill="#050505"/><circle cx="596" cy="316" r="20" fill="#050505"/><circle cx="320" cy="38" r="17" fill="#050505"/><circle cx="320" cy="322" r="17" fill="#050505"/>
      ${rk}${ball(170, 230, 22, '#f6f4ee', 0)}
      <line x1="142" y1="250" x2="-40" y2="370" stroke="#c48a4a" stroke-width="12" stroke-linecap="round"/><line x1="142" y1="250" x2="120" y2="264" stroke="#3a8ad8" stroke-width="12" stroke-linecap="round"/>
      <line x1="194" y1="220" x2="350" y2="185" stroke="#fff" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/>`);
  }
  const logoBillard = () => logoWrap([[0, '#2aa05a'], [1, '#14602f']], `<circle cx="32" cy="32" r="16" fill="#111"/><circle cx="32" cy="32" r="7" fill="#fff"/><text x="32" y="36" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="10" fill="#111">8</text><circle cx="26" cy="25" r="5" fill="#fff" opacity=".3"/>`);

  const E = [
    [{id:'geister', file:'spiele/geister.html', title:'Geisterjagd', tagline:'Friss alles. Lass dich nicht fressen.', genres:['Arcade', 'Action'], accent:'#ffd23f', isNew:true,
      desc:'Der Labyrinth-Klassiker: Friss alle Punkte, weiche vier Geistern mit eigenen Taktiken aus und dreh mit Kraftpillen den Spieß um. Zwei Labyrinthe, wechselnde Farben, Bonusfrüchte und steigendes Tempo.',
      controls:[['Pfeiltasten / WASD', 'Bewegen'], ['Wischen', 'Bewegen (Touch)'], ['P', 'Pause']]}, coverGeister, logoGeister],
    [{id:'kniffel', file:'spiele/kniffel.html', title:'Kniffel', tagline:'Drei Würfe. Fünf Würfel. Ein Kniffel.', genres:['Denken', 'Brettspiel'], accent:'#3fd28b', isNew:true,
      desc:'Das Würfelspiel mit Spielblock: Würfle, halte die besten Würfel und trage geschickt ein. Gegen einen rechnenden Computergegner, zu zweit oder allein auf Rekordjagd.',
      controls:[['Leertaste', 'Würfeln'], ['Klick / 1–5', 'Würfel halten'], ['Klick auf Block', 'Eintragen']]}, coverKniffel, logoKniffel],
    [{id:'golf', file:'spiele/minigolf.html', title:'Minigolf', tagline:'Neun Bahnen. Unzählige Tücken.', genres:['Geschick', 'Sport'], accent:'#6fe36b', isNew:true, lowerBetter:true,
      desc:'Ein kompletter 9-Loch-Platz mit Wasserhindernissen, Sandbunkern, Windmühle, Stampfblöcken, Hängen und Bumpern. Ziele, ziehe, schlage – und jage dein Ergebnis unter Par.',
      controls:[['Ziehen & Loslassen', 'Schlagen'], ['R', 'Bahn neu starten']]}, coverGolf, logoGolf],
    [{id:'schiffe', file:'spiele/schiffe.html', title:'Schiffe versenken', tagline:'Treffer. Versenkt.', genres:['Denken', 'Brettspiel'], accent:'#3fa9ff', isNew:true,
      desc:'Der Seeschlacht-Klassiker: Platziere deine Flotte und spüre die gegnerischen Schiffe auf. Der „Admiral“ rechnet mit Wahrscheinlichkeitskarten – viel Glück!',
      controls:[['Klick', 'Platzieren / Feuern'], ['R / Rechtsklick', 'Schiff drehen']]}, coverSchiffe, logoSchiffe],
    [{id:'himmel', file:'spiele/himmel.html', title:'Himmelssprung', tagline:'Immer höher, immer weiter.', genres:['Arcade', 'Geschick'], accent:'#5ab8ff', isNew:true,
      desc:'Hüpfe endlos nach oben: wackelige, wandernde und zerbrechliche Plattformen, Sprungfedern, Propeller, Monster zum Abschießen und Sterne zum Sammeln. Wie hoch kommst du?',
      controls:[['← → / A D', 'Lenken'], ['Leertaste / Klick Mitte', 'Schießen'], ['P', 'Pause']]}, coverHimmel, logoHimmel],
    [{id:'blasen', file:'spiele/blasen.html', title:'Blasenzauber', tagline:'Zielen, abprallen, platzen lassen.', genres:['Puzzle', 'Arcade'], accent:'#c77bff', isNew:true,
      desc:'Bubble-Shooter mit Bandenschüssen: Bilde Gruppen aus drei gleichen Blasen, lass ganze Trauben abstürzen und nutze Bomben und Regenbogen-Blasen, bevor die Decke herunterkommt.',
      controls:[['Maus', 'Zielen'], ['Klick', 'Schießen'], ['Leertaste / Rechtsklick', 'Blase tauschen']]}, coverBlasen, logoBlasen],
    [{id:'flipper', file:'spiele/flipper.html', title:'Neon-Flipper', tagline:'Die Kugel muss im Spiel bleiben.', genres:['Arcade', 'Geschick'], accent:'#ff3dbb', isNew:true, featured:true,
      desc:'Ein echter Flippertisch mit Physik: Pop-Bumper, Schleudern, Zielscheiben, Bahnlichter, Multiplikator bis ×8, Jackpot-Kugelfang und Multiball mit bis zu drei Kugeln gleichzeitig.',
      controls:[['← / A', 'Linker Flipper'], ['→ / D', 'Rechter Flipper'], ['Leertaste halten', 'Abschuss']]}, coverFlipper, logoFlipper],
    [{id:'dame', file:'spiele/dame.html', title:'Dame', tagline:'Springen, schlagen, krönen.', genres:['Denken', 'Brettspiel'], accent:'#d9a520', isNew:true,
      desc:'Das klassische Damespiel mit deutschen Regeln: Schlagpflicht, Mehrfachsprünge und fliegende Damen. Gegen einen Computer in drei Stärken oder zu zweit.',
      controls:[['Klick', 'Stein wählen / ziehen']]}, coverDame, logoDame],
    [{id:'mahjong', file:'spiele/mahjong.html', title:'Mahjong', tagline:'144 Steine. Eine ruhige Hand.', genres:['Puzzle', 'Denken'], accent:'#3fd2a8', isNew:true, lowerBetter:true,
      desc:'Mahjong-Solitär mit handgezeichneten Steinen auf fünf Ebenen. Finde passende freie Paare und räume das Brett leer – jedes Spiel ist garantiert lösbar. Mit Tipps, Mischen und Rückgängig.',
      controls:[['Klick', 'Stein wählen'], ['H', 'Tipp'], ['Strg + Z', 'Rückgängig']]}, coverMahjong, logoMahjong],
    [{id:'memory', file:'spiele/memory.html', title:'Memory', tagline:'Wer merkt sich mehr?', genres:['Denken', 'Familie'], accent:'#a594ff', isNew:true, lowerBetter:true,
      desc:'Das Gedächtnisspiel mit vier Bildthemen und bis zu 42 Karten. Allein auf Bestwert-Jagd, gegen einen Computer mit (fast) perfektem Gedächtnis oder zu zweit.',
      controls:[['Klick', 'Karte aufdecken']]}, coverMemory, logoMemory],
    [{id:'tron', file:'spiele/lichtrenner.html', title:'Lichtrenner', tagline:'Schneide ihnen den Weg ab.', genres:['Arcade', 'Action'], accent:'#3fe6ff', isNew:true,
      desc:'Neon-Motorräder, die Lichtwände hinterlassen: Kessle deine Gegner ein, nutze den Turbo und überlebe als Letzter. Gegen eine oder drei KIs oder zu zweit an einer Tastatur.',
      controls:[['Pfeiltasten', 'Lenken'], ['Leertaste', 'Turbo'], ['WASD / Shift', 'Spieler 2']]}, coverTron, logoTron],
    [{id:'stapel', file:'spiele/stapel.html', title:'Stapelturm', tagline:'Ein Klick. Immer höher.', genres:['Arcade', 'Geschick'], accent:'#6a9fe8', isNew:true,
      desc:'Das süchtig machende Ein-Knopf-Spiel: Setze gleitende Blöcke exakt aufeinander. Was übersteht, fällt ab – perfekte Treffer lassen den Turm wieder wachsen.',
      controls:[['Klick / Leertaste', 'Block absetzen']]}, coverStapel, logoStapel],
    [{id:'frosch', file:'spiele/frosch.html', title:'Froschsprung', tagline:'Erst die Straße, dann der Fluss.', genres:['Arcade', 'Geschick'], accent:'#5fe36b', isNew:true,
      desc:'Der Arcade-Klassiker: Lotse deinen Frosch über eine vielbefahrene Straße und einen reißenden Fluss mit Baumstämmen und tauchenden Schildkröten bis in die Seerosen-Buchten.',
      controls:[['Pfeiltasten / WASD', 'Hüpfen'], ['Wischen / Tippen', 'Hüpfen (Touch)'], ['P', 'Pause']]}, coverFrosch, logoFrosch],
    [{id:'billard', file:'spiele/billard.html', title:'Billard', tagline:'8-Ball mit echter Kugelphysik.', genres:['Sport', 'Geschick'], accent:'#2aa05a', isNew:true, featured:true,
      desc:'Pool-Billard nach 8-Ball-Regeln: realistische Kugelphysik, Zielhilfe mit Geisterkugel, Fouls und Ball in der Hand. Gegen einen Computer in drei Stärken oder zu zweit.',
      controls:[['Maus', 'Zielen'], ['Halten & zurückziehen', 'Stoßkraft'], ['← →', 'Feinjustierung']]}, coverBillard, logoBillard],
  ];
  E.forEach(([e, c, l]) => HubCatalogAdd(e, c, l));
})();
