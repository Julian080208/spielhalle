/* =====================================================================
   Spielhalle – Katalog aller Spiele inkl. gezeichneter Cover-Art (SVG)
   ===================================================================== */
(function(){
  let U = 0;
  const uid = () => 'c' + (++U) + Math.random().toString(36).slice(2, 6);
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const W = 640, H = 360;
  const wrap = (u, defs, body) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}
      <filter id="${u}g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0"/></filter>
      <radialGradient id="${u}v" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".6"/></radialGradient>
      <filter id="${u}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="${u}b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>${body}<rect width="${W}" height="${H}" filter="url(#${u}g)"/><rect width="${W}" height="${H}" fill="url(#${u}v)"/></svg>`;
  const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  const rg = (id, stops, cx = '50%', cy = '50%', r = '50%') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
  const logoWrap = (bg, body) => { const u = uid(); return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>${lg(u, bg, 1, 1)}</defs><rect width="64" height="64" fill="url(#${u})"/>${body}</svg>`; };

  // ---------- Tycoon Imperium ----------
  function coverTycoon(){
    const u = uid(), r = rng(7);
    const sky = lg(u + 's', [[0, '#0e0a26'], [.42, '#341a5c'], [.72, '#b8406a'], [1, '#ffb35c']]);
    const sun = rg(u + 'sun', [[0, '#fff6d6'], [.45, '#ffcf7a'], [1, '#ff8a4c', 0]]);
    const gold = lg(u + 'gd', [[0, '#fff1b0'], [.5, '#ffc53d'], [1, '#c77a00']]);
    const layer = (base, hmin, hmax, col, wins) => {
      let x = -10, s = '';
      while (x < W + 10){
        const w = 26 + r() * 46, h = hmin + r() * (hmax - hmin);
        s += `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 120).toFixed(1)}" fill="${col}"/>`;
        if (r() < .3) s += `<rect x="${(x + w / 2 - 1.5).toFixed(1)}" y="${(base - h - 18).toFixed(1)}" width="3" height="18" fill="${col}"/>`;
        if (wins) for (let yy = base - h + 8; yy < H; yy += 11) for (let xx = x + 5; xx < x + w - 6; xx += 9)
          if (r() < .42) s += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="4" height="5" fill="#ffd27a" opacity="${(.5 + r() * .5).toFixed(2)}"/>`;
        x += w + 2 + r() * 6;
      }
      return s;
    };
    let pts = [], v = 300;
    for (let k = 0; k <= 12; k++){ v -= 8 + r() * 26 - (k % 3 === 2 ? 30 : 0); pts.push(`${(40 + k * 46)},${Math.max(40, v).toFixed(0)}`); }
    const line = pts.join(' ');
    const last = pts[pts.length - 1].split(',');
    return wrap(u, sky + sun + gold, `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="430" cy="250" r="190" fill="url(#${u}sun)" opacity=".55"/>
      <circle cx="430" cy="250" r="78" fill="#ffe7a8" opacity=".95"/>
      <g opacity=".55">${layer(270, 40, 120, '#3a1d58', false)}</g>
      <g>${layer(300, 50, 170, '#20103a', false)}</g>
      <g>${layer(345, 60, 210, '#0b0719', true)}</g>
      <polyline points="${line}" fill="none" stroke="#ffcf5a" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" filter="url(#${u}b)" opacity=".8"/>
      <polyline points="${line}" fill="none" stroke="url(#${u}gd)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="9" fill="#fff4c2"/><circle cx="${last[0]}" cy="${last[1]}" r="20" fill="#ffd34d" opacity=".35" filter="url(#${u}b2)"/>
      <g transform="translate(560 300)"><ellipse cx="0" cy="22" rx="46" ry="12" fill="#a86400"/><rect x="-46" y="0" width="92" height="22" fill="url(#${u}gd)"/><ellipse cx="0" cy="0" rx="46" ry="12" fill="#ffe28a"/>
        <ellipse cx="0" cy="-10" rx="46" ry="12" fill="#a86400"/><rect x="-46" y="-32" width="92" height="22" fill="url(#${u}gd)"/><ellipse cx="0" cy="-32" rx="46" ry="12" fill="#ffe9a0"/>
        <text x="0" y="-26" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="17" fill="#a86400">€</text></g>`);
  }
  const logoTycoon = () => logoWrap([[0, '#3b1a64'], [1, '#d4497a']],
    `<rect x="10" y="30" width="10" height="26" fill="#120a24"/><rect x="22" y="18" width="12" height="38" fill="#120a24"/><rect x="36" y="26" width="9" height="30" fill="#120a24"/><rect x="47" y="36" width="8" height="20" fill="#120a24"/>
     <polyline points="8,44 22,34 32,38 54,14" fill="none" stroke="#ffd04d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="14" r="4" fill="#fff2b8"/>`);

  // ---------- Ölrausch ----------
  function coverOil(){
    const u = uid(), r = rng(11);
    const defs = lg(u + 's', [[0, '#170b1e'], [.45, '#5c1f2e'], [.8, '#d9622e'], [1, '#ffc078']])
      + lg(u + 'e', [[0, '#7a4222'], [.3, '#5c321b'], [.65, '#3f2211'], [1, '#22120a']])
      + rg(u + 'o', [[0, '#3c3a52'], [.35, '#121019'], [1, '#050407']], '40%', '35%', '70%')
      + rg(u + 'sun', [[0, '#fff3d0'], [.5, '#ffc078', .7], [1, '#ff7a3a', 0]]);
    let lattice = '';
    const dx = 200, top = 52, base = 232;
    for (let k = 0; k < 7; k++){
      const y0 = base - (base - top) * k / 7, y1 = base - (base - top) * (k + 1) / 7;
      const w0 = 46 - 40 * k / 7, w1 = 46 - 40 * (k + 1) / 7;
      lattice += `<line x1="${dx - w0}" y1="${y0}" x2="${dx + w1}" y2="${y1}"/><line x1="${dx + w0}" y1="${y0}" x2="${dx - w1}" y2="${y1}"/><line x1="${dx - w1}" y1="${y1}" x2="${dx + w1}" y2="${y1}"/>`;
    }
    let strata = '';
    for (let k = 0; k < 5; k++){
      let d = `M0 ${250 + k * 24}`;
      for (let x = 0; x <= W; x += 40) d += ` L${x} ${(250 + k * 24 + Math.sin(x * .02 + k) * 6 + r() * 3).toFixed(1)}`;
      strata += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`;
    }
    let pebbles = '';
    for (let k = 0; k < 60; k++) pebbles += `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(240 + r() * 120).toFixed(0)}" rx="${(1 + r() * 3).toFixed(1)}" ry="${(1 + r() * 2).toFixed(1)}" fill="${r() < .5 ? '#000' : '#ffd9a8'}" opacity=".18"/>`;
    return wrap(u, defs, `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="470" cy="228" r="150" fill="url(#${u}sun)"/>
      <circle cx="470" cy="228" r="58" fill="#ffe3b0"/>
      <path d="M0 232 L0 196 L40 190 L60 170 L120 168 L138 192 L230 196 L250 182 L330 180 L350 200 L420 204 L540 200 L560 176 L610 174 L626 196 L640 198 L640 232Z" fill="#4a1a1c" opacity=".9"/>
      <path d="M0 232 L0 214 L90 208 L180 216 L300 210 L400 218 L520 212 L640 216 L640 232Z" fill="#2e1014"/>
      <rect y="232" width="${W}" height="${H - 232}" fill="url(#${u}e)"/>${strata}${pebbles}
      <path d="M300 300 C 320 270, 420 262, 470 280 C 520 296, 530 330, 470 342 C 400 356, 300 346, 286 326 C 278 314, 286 306, 300 300Z" fill="url(#${u}o)"/>
      <path d="M318 292 C 360 276, 420 272, 456 284" fill="none" stroke="#8b8fb8" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
      <path d="M${dx} 232 L${dx} 262 L330 300" fill="none" stroke="#9aa0ad" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${dx} 232 L${dx} 262 L330 300" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="4 6"/>
      <g stroke="#120806" stroke-width="4" stroke-linecap="round">${lattice}<line x1="${dx - 46}" y1="${base}" x2="${dx - 6}" y2="${top}"/><line x1="${dx + 46}" y1="${base}" x2="${dx + 6}" y2="${top}"/></g>
      <rect x="${dx - 12}" y="${top - 14}" width="24" height="14" fill="#120806"/>
      <path d="M${dx} ${top - 14} L${dx} ${top - 38} L${dx + 26} ${top - 30} L${dx} ${top - 22}" fill="#ff6a3a"/>
      <g fill="#120806"><rect x="96" y="214" width="34" height="18"/><path d="M80 214 L146 214 L113 198Z"/><rect x="380" y="208" width="10" height="24"/>
        <path d="M352 196 L420 186 L422 194 L354 204Z"/><path d="M348 192 L358 214 L364 212 L356 190Z"/><circle cx="414" cy="218" r="9"/></g>`);
  }
  const logoOil = () => logoWrap([[0, '#6a2418'], [1, '#f08a3c']],
    `<g stroke="#1a0b06" stroke-width="3.4" stroke-linecap="round"><line x1="20" y1="54" x2="30" y2="10"/><line x1="44" y1="54" x2="34" y2="10"/><line x1="22" y1="44" x2="41" y2="34"/><line x1="42" y1="44" x2="23" y2="34"/><line x1="25" y1="26" x2="38" y2="20"/><line x1="12" y1="54" x2="52" y2="54"/></g>
     <path d="M32 10 L32 2 L42 5 L32 8" fill="#ffd27a"/>`);

  // ---------- Blockfall ----------
  function block(x, y, s, c1, c2){
    return `<g><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="4" fill="${c2}"/><rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 6}" rx="3" fill="${c1}"/><rect x="${x + 5}" y="${y + 4}" width="${s - 10}" height="4" rx="2" fill="#fff" opacity=".45"/></g>`;
  }
  function coverBlock(){
    const u = uid(), s = 34;
    const C = {I:['#3fe6ff', '#0f8fb0'], O:['#ffe14a', '#c79a00'], T:['#c77bff', '#7a2fc0'], S:['#46e38f', '#148a4a'], Z:['#ff5a78', '#b0213e'], J:['#5b7cff', '#2a3fb0'], L:['#ffa24a', '#c05a00']};
    const stack = [
      [0,0,'J'],[1,0,'J'],[2,0,'J'],[0,-1,'J'],[3,0,'O'],[4,0,'O'],[3,-1,'O'],[4,-1,'O'],[5,0,'I'],[6,0,'I'],[7,0,'I'],[8,0,'I'],
      [1,-1,'S'],[2,-1,'S'],[2,-2,'S'],[5,-1,'Z'],[6,-1,'Z'],[6,-2,'Z'],[7,-2,'Z'],[7,-1,'L'],[8,-1,'L'],[8,-2,'L'],[8,-3,'L'],
      [0,-2,'T'],[0,-3,'T'],[1,-2,'T'],[0,-4,'I'],[3,-2,'O'],[4,-2,'O'],[3,-3,'O'],[4,-3,'O']];
    const ox = 290, oy = 318;
    let body = stack.map(([x, y, t]) => block(ox + x * s, oy + y * s, s, ...C[t])).join('');
    const fall = [[0, 0], [1, 0], [2, 0], [1, 1]].map(([x, y]) => block(400 + x * s, 70 + y * s, s, ...C.T)).join('');
    let grid = '';
    for (let k = -8; k <= 8; k++) grid += `<line x1="${320 + k * 30}" y1="360" x2="${320 + k * 120}" y2="250" stroke="#5b6cff" stroke-opacity=".18"/>`;
    for (let k = 0; k < 5; k++) grid += `<line x1="0" y1="${360 - k * k * 6}" x2="640" y2="${360 - k * k * 6}" stroke="#5b6cff" stroke-opacity=".14"/>`;
    return wrap(u, lg(u + 's', [[0, '#070a24'], [.6, '#16123e'], [1, '#2a0f4a']]) + rg(u + 'gl', [[0, '#7c6cff', .55], [1, '#7c6cff', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="450" cy="200" r="230" fill="url(#${u}gl)"/>${grid}
      <g filter="url(#${u}b)" opacity=".6">${fall}</g>${fall}
      <g stroke="#c77bff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"><line x1="418" y1="40" x2="418" y2="62"/><line x1="452" y1="28" x2="452" y2="62"/><line x1="486" y1="40" x2="486" y2="62"/></g>
      ${body}
      <rect x="${ox}" y="${oy - 4 * s}" width="${9 * s}" height="${s}" fill="#fff" opacity=".18"/>`);
  }
  const logoBlock = () => logoWrap([[0, '#1a1550'], [1, '#4a1f7a']], block(8, 30, 16, '#c77bff', '#7a2fc0') + block(24, 30, 16, '#c77bff', '#7a2fc0') + block(40, 30, 16, '#c77bff', '#7a2fc0') + block(24, 14, 16, '#c77bff', '#7a2fc0'));

  // ---------- Neon-Snake ----------
  function coverSnake(){
    const u = uid();
    let grid = '';
    for (let x = 0; x <= W; x += 32) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
    for (let y = 0; y <= H; y += 32) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
    const path = 'M40 300 L40 236 L168 236 L168 140 L72 140 L72 76 L328 76 L328 204 L456 204 L456 108';
    return wrap(u, lg(u + 's', [[0, '#04060f'], [1, '#0b0f2a']]) + lg(u + 'n', [[0, '#00f0ff'], [.5, '#8b5cff'], [1, '#ff3d8b']], 1, 0), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <g stroke="#3b5bff" stroke-opacity=".13">${grid}</g>
      <path d="${path}" fill="none" stroke="url(#${u}n)" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" filter="url(#${u}b)" opacity=".9"/>
      <path d="${path}" fill="none" stroke="url(#${u}n)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="translate(-3 -4)"/>
      <circle cx="456" cy="104" r="20" fill="#ff3d8b"/>
      <circle cx="448" cy="98" r="5.5" fill="#fff"/><circle cx="464" cy="98" r="5.5" fill="#fff"/><circle cx="449" cy="97" r="2.6" fill="#111"/><circle cx="465" cy="97" r="2.6" fill="#111"/>
      <circle cx="560" cy="108" r="40" fill="#ff2d55" opacity=".45" filter="url(#${u}b)"/>
      <circle cx="560" cy="110" r="17" fill="#ff3b5c"/><circle cx="554" cy="104" r="5" fill="#fff" opacity=".6"/>
      <path d="M560 94 C 562 84, 570 80, 576 82 C 572 90, 566 94, 560 94Z" fill="#3ddc84"/>`);
  }
  const logoSnake = () => logoWrap([[0, '#05081a'], [1, '#1a1040']],
    `<path d="M12 50 L12 36 L44 36 L44 22 L22 22" fill="none" stroke="#3fe6ff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="22" r="6" fill="#ff3d8b"/><circle cx="50" cy="12" r="5" fill="#ff3b5c"/>`);

  // ---------- 2048 ----------
  const TC = {2:['#eee4da', '#5a4636'], 4:['#ede0c8', '#5a4636'], 8:['#f2b179', '#fff'], 16:['#f59563', '#fff'], 32:['#f67c5f', '#fff'], 64:['#f65e3b', '#fff'], 128:['#edcf72', '#fff'], 256:['#edcc61', '#fff'], 512:['#edc850', '#fff'], 1024:['#c56cf0', '#fff'], 2048:['#ff3fa4', '#fff']};
  function tile(x, y, s, v, fs){
    const [b, f] = TC[v];
    return `<g><rect x="${x}" y="${y + 4}" width="${s}" height="${s}" rx="${s * .14}" fill="#000" opacity=".25"/><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * .14}" fill="${b}"/>
      <text x="${x + s / 2}" y="${y + s / 2 + fs * .36}" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="${fs}" fill="${f}">${v}</text></g>`;
  }
  function cover2048(){
    const u = uid(), vals = [[2, 4, 8, 16], [4, 32, 64, 2], [128, 256, 8, 4], [512, 1024, 2, 32]];
    let board = `<rect x="-8" y="-8" width="296" height="296" rx="20" fill="#3b2a1e"/>`;
    vals.forEach((row, r) => row.forEach((v, c) => board += tile(c * 72, r * 72, 64, v, v >= 1000 ? 20 : v >= 100 ? 24 : 28)));
    return wrap(u, lg(u + 's', [[0, '#1d1028'], [.55, '#4a1d2e'], [1, '#8a3a1a']], 1, 1) + rg(u + 'gl', [[0, '#ff3fa4', .7], [1, '#ff3fa4', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <g transform="translate(70 60) rotate(-9) scale(.95)" opacity=".95">${board}</g>
      <circle cx="470" cy="185" r="170" fill="url(#${u}gl)"/>
      <g transform="translate(470 185) rotate(6)">${tile(-85, -85, 170, 2048, 54).replace('<rect x="-85" y="-85"', '<rect x="-85" y="-85" stroke="#fff" stroke-opacity=".5" stroke-width="3"')}</g>`);
  }
  const logo2048 = () => logoWrap([[0, '#ff5fb4'], [1, '#c0207a']], `<text x="32" y="40" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="21" fill="#fff">2048</text>`);

  // ---------- Flatter-Vogel ----------
  function bird(x, y, s){
    return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-12)">
      <ellipse cx="0" cy="4" rx="36" ry="30" fill="#e8a800"/><ellipse cx="0" cy="0" rx="34" ry="29" fill="#ffd23f"/>
      <ellipse cx="-12" cy="6" rx="18" ry="12" fill="#fff3b0" transform="rotate(-20 -12 6)"/>
      <circle cx="14" cy="-8" r="11" fill="#fff"/><circle cx="17" cy="-8" r="5" fill="#1b1b1b"/><circle cx="18.5" cy="-10" r="1.6" fill="#fff"/>
      <path d="M28 2 L50 6 L28 14Z" fill="#ff7a2a"/><path d="M28 8 L46 9 L28 14Z" fill="#d9541a"/>
      <ellipse cx="-14" cy="-2" rx="16" ry="10" fill="#ffb800" transform="rotate(-30 -14 -2)"/></g>`;
  }
  function pipe(x, y0, y1, cap, u){
    return `<rect x="${x - 34}" y="${y0}" width="68" height="${y1 - y0}" fill="url(#${u}p)"/><rect x="${x - 40}" y="${cap - 16}" width="80" height="32" rx="5" fill="url(#${u}p)"/><rect x="${x - 40}" y="${cap - 16}" width="80" height="32" rx="5" fill="none" stroke="#155c22" stroke-width="3"/><rect x="${x - 34}" y="${y0}" width="68" height="${y1 - y0}" fill="none" stroke="#155c22" stroke-width="3"/>`;
  }
  function coverFlatter(){
    const u = uid(), r = rng(5);
    let city = '';
    for (let x = 0; x < W; x += 30 + r() * 20){ const h = 40 + r() * 80; city += `<rect x="${x.toFixed(0)}" y="${(300 - h).toFixed(0)}" width="${(26 + r() * 18).toFixed(0)}" height="${h.toFixed(0)}" fill="#7cc8c0"/>`; }
    const clouds = [[90, 70, 1.2], [300, 50, .9], [540, 90, 1.3], [200, 150, .7]].map(([x, y, s]) => `<g fill="#fff" opacity=".9" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="26"/><circle cx="28" cy="6" r="20"/><circle cx="-26" cy="8" r="18"/><rect x="-44" y="6" width="90" height="20" rx="10"/></g>`).join('');
    return wrap(u, lg(u + 's', [[0, '#2b8fd8'], [1, '#bfe9ff']]) + lg(u + 'p', [[0, '#2f9a3a'], [.35, '#8ae67f'], [.6, '#5fc85a'], [1, '#237a2c']], 1, 0), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="560" cy="70" r="40" fill="#fff6c0"/><circle cx="560" cy="70" r="70" fill="#fff6c0" opacity=".25"/>
      ${clouds}<g opacity=".8">${city}</g>
      ${pipe(390, 0, 108, 108, u)}${pipe(390, 250, 330, 250, u)}${pipe(560, 0, 50, 50, u)}${pipe(560, 196, 330, 196, u)}
      <rect y="318" width="${W}" height="42" fill="#ded895"/><rect y="312" width="${W}" height="10" fill="#6cc24a"/>
      <g stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"><path d="M118 196 q-30 4 -56 0"/><path d="M110 216 q-26 4 -46 2"/></g>
      ${bird(190, 190, 1.5)}`);
  }
  const logoFlatter = () => logoWrap([[0, '#2b8fd8'], [1, '#8ad4ff']], `<g transform="translate(-118 -110) scale(.62)">${bird(240, 228, 1.2)}</g>`);

  // ---------- Ziegelbrecher ----------
  function coverZiegel(){
    const u = uid(), r = rng(3);
    const cols = [['#ff5a8a', '#b0214e'], ['#ffa24a', '#c05a00'], ['#ffe14a', '#c79a00'], ['#46e3c0', '#0f8f74'], ['#5b9cff', '#2a4fb0']];
    let bricks = '';
    for (let row = 0; row < 5; row++) for (let c = 0; c < 9; c++){
      if (row > 2 && r() < .35) continue;
      const x = 22 + c * 68, y = 34 + row * 30, [a, b] = cols[row];
      bricks += `<rect x="${x}" y="${y}" width="62" height="24" rx="5" fill="${b}"/><rect x="${x}" y="${y}" width="62" height="20" rx="5" fill="${a}"/><rect x="${x + 6}" y="${y + 4}" width="50" height="4" rx="2" fill="#fff" opacity=".4"/>`;
    }
    let trail = '';
    for (let k = 0; k < 8; k++) trail += `<circle cx="${250 - k * 22}" cy="${238 + k * 13}" r="${12 - k}" fill="#bde3ff" opacity="${(.5 - k * .06).toFixed(2)}"/>`;
    let sparks = '';
    for (let k = 0; k < 18; k++){ const a = r() * 6.28, d = 20 + r() * 50; sparks += `<rect x="${(380 + Math.cos(a) * d).toFixed(0)}" y="${(168 + Math.sin(a) * d * .7).toFixed(0)}" width="5" height="5" fill="${cols[k % 5][0]}" transform="rotate(${(r() * 90).toFixed(0)} ${(380 + Math.cos(a) * d).toFixed(0)} ${(168 + Math.sin(a) * d * .7).toFixed(0)})"/>`; }
    return wrap(u, lg(u + 's', [[0, '#0c0418'], [.6, '#2a0b3a'], [1, '#4a1040']]) + lg(u + 'pd', [[0, '#ffffff'], [1, '#8a9cff']]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>${bricks}${sparks}${trail}
      <circle cx="262" cy="232" r="26" fill="#7fd0ff" opacity=".7" filter="url(#${u}b)"/><circle cx="262" cy="232" r="13" fill="#fff"/>
      <rect x="120" y="318" width="170" height="18" rx="9" fill="#8a9cff" opacity=".6" filter="url(#${u}b)"/><rect x="120" y="318" width="170" height="16" rx="8" fill="url(#${u}pd)"/>`);
  }
  const logoZiegel = () => logoWrap([[0, '#2a0b3a'], [1, '#7a1a5a']],
    `<rect x="8" y="12" width="22" height="9" rx="2" fill="#ff5a8a"/><rect x="34" y="12" width="22" height="9" rx="2" fill="#ffa24a"/><rect x="8" y="24" width="22" height="9" rx="2" fill="#ffe14a"/><rect x="34" y="24" width="22" height="9" rx="2" fill="#46e3c0"/><circle cx="32" cy="44" r="5" fill="#fff"/><rect x="18" y="52" width="28" height="5" rx="2.5" fill="#bcc6ff"/>`);

  // ---------- Minensucher ----------
  function mine(x, y, s){
    let spikes = '';
    for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4; spikes += `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(a) * s * 1.5).toFixed(1)}" y2="${(y + Math.sin(a) * s * 1.5).toFixed(1)}"/>`; }
    return `<g stroke="#0b0f14" stroke-width="${s * .3}" stroke-linecap="round">${spikes}</g><circle cx="${x}" cy="${y}" r="${s}" fill="#0b0f14"/><circle cx="${x - s * .35}" cy="${y - s * .35}" r="${s * .28}" fill="#fff" opacity=".7"/>`;
  }
  function coverMinen(){
    const u = uid(), map = ['XX1..1XX', 'X21..12X', '1M1..1F1', '111..111'], nc = {1:'#4fa3ff', 2:'#3ddc84', 3:'#ff5a5a'};
    let g = '';
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      const x = c * 60, y = r * 60;
      if (ch === 'X' || ch === 'F'){
        g += `<rect x="${x}" y="${y}" width="56" height="56" rx="8" fill="#2f5f86"/><rect x="${x}" y="${y}" width="56" height="50" rx="8" fill="#4f86b8"/><rect x="${x + 6}" y="${y + 5}" width="44" height="5" rx="2.5" fill="#fff" opacity=".3"/>`;
        if (ch === 'F') g += `<line x1="${x + 22}" y1="${y + 12}" x2="${x + 22}" y2="${y + 44}" stroke="#ddd" stroke-width="4" stroke-linecap="round"/><path d="M${x + 24} ${y + 12} L${x + 44} ${y + 20} L${x + 24} ${y + 29}Z" fill="#ff3b4a"/><rect x="${x + 12}" y="${y + 42}" width="22" height="5" rx="2" fill="#ddd"/>`;
      } else {
        g += `<rect x="${x}" y="${y}" width="56" height="56" rx="8" fill="${ch === 'M' ? '#ff4d4d' : '#152634'}"/>`;
        if (nc[ch]) g += `<text x="${x + 28}" y="${y + 40}" text-anchor="middle" font-family="Bahnschrift,Segoe UI" font-weight="700" font-size="32" fill="${nc[ch]}">${ch}</text>`;
        if (ch === 'M') g += mine(x + 28, y + 28, 11);
      }
    }));
    return wrap(u, lg(u + 's', [[0, '#071019'], [.6, '#10283a'], [1, '#1d4a66']], 1, 1) + rg(u + 'ex', [[0, '#ffcf6a', .9], [.4, '#ff5a3a', .5], [1, '#ff5a3a', 0]]), `
      <rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="210" cy="200" r="150" fill="url(#${u}ex)"/>
      <g transform="translate(90 70) rotate(-4)">${g}</g>`);
  }
  const logoMinen = () => logoWrap([[0, '#173a55'], [1, '#2f6f9a']], mine(32, 32, 11));

  // ---------- Katalog ----------
  window.HubCover = {tycoon:coverTycoon, oel:coverOil, blockfall:coverBlock, snake:coverSnake, g2048:cover2048, flatter:coverFlatter, ziegel:coverZiegel, minen:coverMinen};
  window.HubCatalog = [
    {id:'oel', file:'spiele/oelrausch.html', title:'Ölrausch', tagline:'Bohr dich zum Ölbaron des Wilden Westens.', genres:['Strategie', 'Wirtschaft'],
      desc:'Finde verborgene Ölfelder, bohr verzweigte Rohrleitungen durch Fels und Erde, schick Pferdewagen zur Raffinerie mit dem besten Preis und überbiete deine Rivalen bei Landauktionen. Zehn Städte, wachsende Konkurrenz und ein Saloon voller Upgrades.',
      controls:[['Maus ziehen', 'Rohr bohren'], ['Mausrad / A D', 'Kamera bewegen'], ['Leertaste', 'Pause'], ['1 – 3', 'Spieltempo']],
      accent:'#ff8a3d', featured:true, cover:coverOil, logo:logoOil},
    {id:'tycoon', file:'spiele/tycoon.html', title:'Tycoon Imperium', tagline:'Vom Limonadenstand zur Mars-Kolonie.', genres:['Strategie', 'Idle'],
      desc:'Baue ein Wirtschaftsimperium aus 15 Branchen auf. Stelle Manager ein, handle an der Börse, sammle Manager-Karten, überhole 16 Rivalen und starte mit Investoren immer wieder stärker neu.',
      controls:[['Klick', 'Produzieren'], ['Schnell klicken', 'Fieber-Modus']],
      accent:'#c45cff', featured:true, cover:coverTycoon, logo:logoTycoon},
    {id:'blockfall', file:'spiele/blockfall.html', title:'Blockfall', tagline:'Der zeitlose Klassiker – perfektioniert.', genres:['Puzzle', 'Arcade'],
      desc:'Drehe und platziere fallende Blöcke, räume Reihen ab und jage Combos. Mit Halten-Funktion, Geisterteil, Vorschau und immer schneller werdenden Levels.',
      controls:[['← →', 'Bewegen'], ['↑ / X', 'Drehen'], ['Leertaste', 'Fallen lassen'], ['C', 'Halten']], accent:'#7c6cff', cover:coverBlock, logo:logoBlock, legacy:'blockfall'},
    {id:'snake', file:'spiele/snake.html', title:'Neon-Snake', tagline:'Schnell, leuchtend, gnadenlos.', genres:['Arcade'],
      desc:'Steuere die Neon-Schlange, sammle Früchte und Power-ups wie Zeitlupe und Geist-Modus – und weiche den immer mehr werdenden Felsen aus.',
      controls:[['Pfeiltasten / WASD', 'Lenken'], ['Wischen', 'Lenken (Touch)']], accent:'#18c5d8', cover:coverSnake, logo:logoSnake, legacy:'snake'},
    {id:'g2048', file:'spiele/2048.html', title:'2048', tagline:'Verschmelze dich zur 2048.', genres:['Puzzle', 'Denken'],
      desc:'Schiebe alle Kacheln gleichzeitig. Gleiche Zahlen verschmelzen. Plane voraus, nutze das Rückgängig-Joker klug und knacke die 2048.',
      controls:[['Pfeiltasten', 'Schieben'], ['Strg + Z', 'Rückgängig']], accent:'#ff4f9a', cover:cover2048, logo:logo2048, legacy:'g2048'},
    {id:'flatter', file:'spiele/flatter.html', title:'Flatter-Vogel', tagline:'Ein Klick. Ein Flügelschlag.', genres:['Arcade', 'Geschick'],
      desc:'Halte den Vogel in der Luft, flieg durch die Röhren, sammle Münzen und erkämpfe dir Bronze-, Silber-, Gold- und Diamant-Medaillen.',
      controls:[['Klick / Leertaste', 'Flattern']], accent:'#3d8bff', cover:coverFlatter, logo:logoFlatter, legacy:'flatter'},
    {id:'ziegel', file:'spiele/ziegel.html', title:'Ziegelbrecher', tagline:'Zerlege jede Mauer.', genres:['Arcade', 'Action'],
      desc:'Der Ball-und-Schläger-Klassiker mit Multiball, Feuerball, Laser, Zeitlupe und sechs Level-Layouts, die immer härter werden.',
      controls:[['Maus', 'Schläger'], ['Klick / Leertaste', 'Abschießen']], accent:'#ff4f9a', cover:coverZiegel, logo:logoZiegel, legacy:'ziegel'},
    {id:'minen', file:'spiele/minen.html', title:'Minensucher', tagline:'Logik unter Hochspannung.', genres:['Denken', 'Puzzle'],
      desc:'Decke alle sicheren Felder auf, ohne eine Mine zu treffen. Drei Schwierigkeitsstufen, Akkord-Klick und Bestzeiten.',
      controls:[['Linksklick', 'Aufdecken'], ['Rechtsklick', 'Fahne']], accent:'#3d8bff', cover:coverMinen, logo:logoMinen, lowerBetter:true},
  ];
  window.HubCatalogAdd = (entry, cover, logo) => { HubCover[entry.id] = cover; window.HubCatalog.push(Object.assign(entry, {cover, logo})); };
  window.HubArt = {uid, rng, wrap, lg, rg, logoWrap, block, tile, mine, bird};
})();
