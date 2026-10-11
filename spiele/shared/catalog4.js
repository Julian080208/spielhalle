/* =====================================================================
   Spielhalle – vierte Welle: Casino & Brettspiele (Cover + Katalog)
   ===================================================================== */
(function(){
  if (!window.HubArt || !window.HubCatalogAdd) return;
  const {uid, rng, wrap, lg, rg, logoWrap} = HubArt;
  const W = 640, H = 360;
  const card = (x, y, rot, r, s, sc = 1) => {
    const red = s === '♥' || s === '♦', col = red ? '#d42a3a' : '#1b1e26';
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><rect x="-46" y="-64" width="92" height="128" rx="9" fill="#000" opacity=".35" transform="translate(4 7)"/><rect x="-46" y="-64" width="92" height="128" rx="9" fill="#fbfbfd"/>
      <text x="-34" y="-38" font-family="Bahnschrift" font-weight="700" font-size="22" fill="${col}">${r}</text><text x="-34" y="-18" font-family="Segoe UI Symbol" font-size="18" fill="${col}">${s}</text>
      <text x="0" y="22" text-anchor="middle" font-family="Segoe UI Symbol" font-size="56" fill="${col}">${s}</text></g>`;
  };
  const chip = (x, y, col, sc = 1) => `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="8" rx="30" ry="12" fill="#000" opacity=".35"/><ellipse cx="0" cy="4" rx="30" ry="12" fill="${col}" opacity=".7"/><ellipse cx="0" cy="0" rx="30" ry="12" fill="${col}"/><ellipse cx="0" cy="0" rx="22" ry="8" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 5"/></g>`;
  const chipStack = (x, y, col, n) => Array.from({length:n}, (_, k) => chip(x, y - k * 7, col)).join('');

  // ---------- Blackjack ----------
  function coverBlackjack(){
    const u = uid();
    return wrap(u, rg(u + 'f', [[0, '#1f8a55'], [.7, '#0f5a34'], [1, '#062a18']], '50%', '30%', '80%'), `<rect width="${W}" height="${H}" fill="url(#${u}f)"/>
      <path d="M40 360 Q320 200 600 360" fill="none" stroke="#ffe6a0" stroke-opacity=".35" stroke-width="3"/>
      <text x="320" y="80" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="54" letter-spacing="8" fill="#ffe6a0" opacity=".85">BLACKJACK</text>
      ${card(250, 210, -12, 'A', '♠', 1.2)}${card(345, 205, 10, 'K', '♥', 1.2)}
      ${chipStack(130, 300, '#d42a3a', 5)}${chipStack(510, 300, '#1a1a22', 7)}${chipStack(560, 310, '#2f6bff', 3)}
      <rect x="248" y="296" width="148" height="40" rx="20" fill="url(#${u}bj)"/><text x="322" y="323" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="22" fill="#2a1c00">21!</text>`.replace(`url(#${u}bj)`, '#ffd23f'));
  }
  const logoBlackjack = () => logoWrap([[0, '#1f8a55'], [1, '#0a3a22']], `<rect x="12" y="14" width="24" height="34" rx="4" fill="#fff" transform="rotate(-12 24 31)"/><rect x="28" y="14" width="24" height="34" rx="4" fill="#fff" transform="rotate(10 40 31)"/><text x="40" y="38" text-anchor="middle" font-family="Segoe UI Symbol" font-size="16" fill="#d42a3a" transform="rotate(10 40 31)">♥</text><text x="22" y="36" font-family="Bahnschrift" font-weight="700" font-size="13" fill="#111" transform="rotate(-12 24 31)">A</text>`);

  // ---------- Buch des Pharao ----------
  function coverPharao(){
    const u = uid();
    let rays = ''; for (let k = 0; k < 18; k++) rays += `<path d="M320 170 L${320 + Math.cos(k / 18 * 6.283) * 600} ${170 + Math.sin(k / 18 * 6.283) * 600} L${320 + Math.cos((k + .5) / 18 * 6.283) * 600} ${170 + Math.sin((k + .5) / 18 * 6.283) * 600}Z" fill="#ffd23f" opacity=".07"/>`;
    return wrap(u, rg(u + 's', [[0, '#8a5a1a'], [.6, '#3a2208'], [1, '#120a02']], '50%', '45%', '75%') + lg(u + 'bk', [[0, '#8a2a14'], [1, '#4a140a']], 1, 1), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>${rays}
      <path d="M60 360 L170 120 L280 360Z" fill="#c9963a" opacity=".55"/><path d="M380 360 L520 70 L640 300 L640 360Z" fill="#b8862a" opacity=".5"/>
      <g transform="translate(320 185) rotate(-8)"><rect x="-92" y="-118" width="184" height="236" fill="#e8d6a8" transform="translate(10 8)"/><rect x="-96" y="-122" width="184" height="236" rx="6" fill="url(#${u}bk)"/>
        <rect x="-80" y="-106" width="152" height="204" fill="none" stroke="#f2c94c" stroke-width="5"/><ellipse cx="-4" cy="-6" rx="46" ry="26" fill="#f2c94c"/><circle cx="-4" cy="-6" r="16" fill="#5a1a0c"/>
        <path d="M-18 22 L-30 58 M8 22 Q30 50 44 38" stroke="#f2c94c" stroke-width="6" fill="none"/></g>
      <circle cx="320" cy="180" r="150" fill="#ffd23f" opacity=".12" filter="url(#${u}b)"/>
      <text x="320" y="345" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="30" letter-spacing="6" fill="#ffe08a">BUCH DES PHARAO</text>`);
  }
  const logoPharao = () => logoWrap([[0, '#8a2a14'], [1, '#3a0e06']], `<rect x="16" y="10" width="32" height="44" rx="3" fill="#7a2210" stroke="#f2c94c" stroke-width="3"/><ellipse cx="32" cy="30" rx="10" ry="6" fill="#f2c94c"/><circle cx="32" cy="30" r="3.5" fill="#5a1a0c"/>`);

  // ---------- Früchte-Feuer ----------
  function coverFruechte(){
    const u = uid(), em = ['🍒', '7', '🍋', '7', '🍉', '🍇', '7', '🔔', '🍒'];
    let reels = '';
    for (let r = 0; r < 3; r++) for (let y = 0; y < 3; y++){
      const e = em[r * 3 + y], x = 170 + r * 150, yy = 85 + y * 95;
      reels += e === '7' ? `<text x="${x}" y="${yy + 34}" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="78" fill="#e8101f" stroke="#600" stroke-width="3">7</text>` : `<text x="${x}" y="${yy + 26}" text-anchor="middle" font-size="62" font-family="Segoe UI Emoji">${e}</text>`;
    }
    return wrap(u, lg(u + 's', [[0, '#6a1020'], [1, '#1a0408']]) + lg(u + 'fr', [[0, '#ff8a3d'], [1, '#8a1a08']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <rect x="80" y="30" width="480" height="300" rx="24" fill="url(#${u}fr)"/><rect x="96" y="44" width="448" height="272" rx="14" fill="#1a0508"/>
      <rect x="96" y="${44 + 95}" width="448" height="92" fill="#ffd23f" opacity=".12"/>${reels}
      <line x1="96" y1="${44 + 136}" x2="544" y2="${44 + 136}" stroke="#ffd23f" stroke-width="4" opacity=".8"/>
      <path d="M0 360 Q60 260 120 330 Q160 240 220 320 Q280 220 330 330 Q390 240 440 320 Q500 230 560 330 Q600 260 640 300 L640 360Z" fill="#ff5a1f" opacity=".55" filter="url(#${u}b2)"/>`);
  }
  const logoFruechte = () => logoWrap([[0, '#ff8a3d'], [1, '#8a1a08']], `<text x="32" y="44" text-anchor="middle" font-size="30" font-family="Segoe UI Emoji">🍒</text>`);

  // ---------- Zwillingsblitz ----------
  function coverZwilling(){
    const u = uid();
    const reel = (x, glow, syms) => `<rect x="${x}" y="50" width="104" height="260" fill="${glow ? '#ffd23f' : '#fff'}" opacity="${glow ? .14 : .03}"/>` + syms.map((s, k) => s === '7' ? `<text x="${x + 52}" y="${110 + k * 86}" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="70" fill="#ff1f4f" stroke="#000" stroke-width="3">7</text>` : `<text x="${x + 52}" y="${104 + k * 86}" text-anchor="middle" font-size="54" font-family="Segoe UI Emoji">${s}</text>`).join('');
    return wrap(u, lg(u + 's', [[0, '#14244a'], [1, '#04060f']]) + lg(u + 'fr', [[0, '#5a7aff'], [1, '#1a1a5a']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <rect x="48" y="36" width="544" height="288" rx="22" fill="url(#${u}fr)"/><rect x="60" y="48" width="520" height="264" rx="12" fill="#060a18"/>
      ${reel(64, false, ['💎', '🔔', '🍒'])}${reel(168, true, ['7', '💎', '7'])}${reel(272, true, ['7', '💎', '7'])}${reel(376, true, ['7', '💎', '7'])}${reel(480, false, ['🍒', '7', '🔔'])}
      <rect x="168" y="50" width="312" height="260" fill="none" stroke="#ffd23f" stroke-width="5" filter="url(#${u}b2)"/><rect x="168" y="50" width="312" height="260" fill="none" stroke="#ffd23f" stroke-width="3"/>
      <text x="600" y="60" font-size="60" font-family="Segoe UI Emoji" opacity=".9">⚡</text>`);
  }
  const logoZwilling = () => logoWrap([[0, '#5a7aff'], [1, '#1a1a5a']], `<rect x="10" y="14" width="20" height="36" rx="3" fill="#060a18" stroke="#ffd23f" stroke-width="2"/><rect x="34" y="14" width="20" height="36" rx="3" fill="#060a18" stroke="#ffd23f" stroke-width="2"/><text x="20" y="40" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="20" fill="#ff1f4f">7</text><text x="44" y="40" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="20" fill="#ff1f4f">7</text>`);

  // ---------- Poker ----------
  function coverPoker(){
    const u = uid();
    return wrap(u, rg(u + 'f', [[0, '#2a8a5a'], [.7, '#145a38'], [1, '#08200f']], '50%', '55%', '70%'), `<rect width="${W}" height="${H}" fill="#120a1c"/>
      <ellipse cx="320" cy="250" rx="380" ry="190" fill="#3a2212"/><ellipse cx="320" cy="250" rx="360" ry="172" fill="url(#${u}f)"/>
      ${card(200, 220, -8, 'A', '♠', 1)}${card(270, 214, -3, 'A', '♥', 1)}${card(340, 214, 3, 'A', '♦', 1)}${card(410, 220, 8, 'K', '♠', 1)}${card(480, 230, 12, 'K', '♣', 1)}
      ${chipStack(90, 320, '#d42a3a', 6)}${chipStack(150, 330, '#1a1a22', 4)}${chipStack(560, 325, '#8a3cc9', 5)}
      <text x="320" y="70" text-anchor="middle" font-family="Bahnschrift" font-weight="700" font-size="44" letter-spacing="10" fill="#fff" opacity=".9">POKER</text>
      <text x="320" y="100" text-anchor="middle" font-family="Bahnschrift" font-size="16" letter-spacing="6" fill="#ffd23f" opacity=".8">TEXAS HOLD'EM</text>`);
  }
  const logoPoker = () => logoWrap([[0, '#2a1a3a'], [1, '#08050c']], `<text x="32" y="44" text-anchor="middle" font-family="Segoe UI Symbol" font-size="36" fill="#fff">♠</text>`);

  // ---------- Immobilienkönig ----------
  function coverImmo(){
    const u = uid();
    const GCc = ['#8a4a2a', '#7fd0ff', '#e0559a', '#ff9a2e', '#e8343a', '#ffd23f', '#2fbf71', '#2f5fd1'];
    let edge = '';
    for (let k = 0; k < 9; k++){ edge += `<rect x="${110 + k * 47}" y="300" width="47" height="60" fill="#e8f3ea" stroke="#333" stroke-width="1.5"/><rect x="${110 + k * 47}" y="300" width="47" height="14" fill="${GCc[k % 8]}"/>`; }
    const house = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-20 0 L0 -18 L20 0 L20 22 L-20 22Z" fill="${c}" stroke="#0a3a1a" stroke-width="2"/><rect x="-6" y="8" width="12" height="14" fill="#fff" opacity=".6"/></g>`;
    return wrap(u, lg(u + 's', [[0, '#1e2a3a'], [1, '#070a10']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <rect x="60" y="40" width="520" height="320" fill="#cfe6d4"/>${edge}
      <text x="320" y="150" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="50" fill="#c4202f" transform="rotate(-5 320 150)" style="paint-order:stroke" stroke="#fff" stroke-width="6">IMMOBILIEN</text>
      <text x="320" y="205" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="50" fill="#c4202f" transform="rotate(-5 320 205)" style="paint-order:stroke" stroke="#fff" stroke-width="6">KÖNIG</text>
      ${house(130, 250, 1.3, '#1fa04a')}${house(185, 255, 1.1, '#1fa04a')}${house(520, 245, 1.5, '#d42a3a')}
      <g transform="translate(430 250) rotate(14)"><rect x="-24" y="-24" width="48" height="48" rx="9" fill="#fff" stroke="#bbb"/><circle cx="-10" cy="-10" r="5"/><circle cx="10" cy="10" r="5"/><circle cx="0" cy="0" r="5"/></g>
      <text x="575" y="95" font-size="54" font-family="Segoe UI Emoji">🎩</text>`);
  }
  const logoImmo = () => logoWrap([[0, '#cfe6d4'], [1, '#8ab89a']], `<path d="M14 32 L32 16 L50 32 L50 52 L14 52Z" fill="#d42a3a" stroke="#6a0a14" stroke-width="2"/><rect x="27" y="38" width="10" height="14" fill="#fff"/>`);

  // ---------- Lebensweg ----------
  function coverLeben(){
    const u = uid();
    let road = 'M-20 300 C120 300 140 220 260 220 S420 300 520 230 S620 120 680 140';
    const sp = [[40, 300, '#ffd23f', '🏁'], [130, 280, '#2fbf71', '💰'], [210, 228, '#fff', '❔'], [300, 236, '#e8343a', '💍'], [390, 280, '#7ad8ff', '👶'], [470, 262, '#ff7ab8', '⭐'], [545, 205, '#e8343a', '🏠'], [610, 150, '#2fbf71', '💰']];
    return wrap(u, lg(u + 's', [[0, '#8fd0ff'], [.55, '#d6f0ff'], [.56, '#bfe8b0'], [1, '#6ab85a']]), `<rect width="${W}" height="${H}" fill="url(#${u}s)"/>
      <circle cx="540" cy="70" r="40" fill="#ffe066"/><text x="80" y="90" font-size="50" font-family="Segoe UI Emoji">☁️</text><text x="330" y="70" font-size="40" font-family="Segoe UI Emoji">☁️</text>
      <text x="40" y="200" font-size="40" font-family="Segoe UI Emoji">🌳</text><text x="560" y="330" font-size="44" font-family="Segoe UI Emoji">🌲</text><text x="250" y="340" font-size="34" font-family="Segoe UI Emoji">🌼</text>
      <path d="${road}" fill="none" stroke="#3a3e48" stroke-width="56" stroke-linecap="round"/><path d="${road}" fill="none" stroke="#5a5e68" stroke-width="48" stroke-linecap="round"/>
      ${sp.map(([x, y, c, e]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" stroke="#1b2028" stroke-width="3"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="22" font-family="Segoe UI Emoji">${e}</text>`).join('')}
      <g transform="translate(330 205)"><circle r="20" fill="#e8343a" stroke="#fff" stroke-width="4"/><text y="7" text-anchor="middle" font-size="20" font-family="Segoe UI Emoji">🚗</text></g>
      <text x="320" y="150" text-anchor="middle" font-family="Bahnschrift" font-weight="800" font-size="52" fill="#fff" style="paint-order:stroke" stroke="#c45cff" stroke-width="8">LEBENSWEG</text>`);
  }
  const logoLeben = () => logoWrap([[0, '#8fd0ff'], [1, '#6ab85a']], `<circle cx="32" cy="32" r="20" fill="#fff" stroke="#1b2028" stroke-width="3"/><path d="M32 32 L32 14" stroke="#e8343a" stroke-width="4"/><circle cx="32" cy="32" r="4" fill="#1b2028"/><text x="32" y="54" text-anchor="middle" font-size="12" font-family="Segoe UI Emoji">🚗</text>`);

  const E = [
    [{id:'blackjack', file:'spiele/blackjack.html', title:'Blackjack', tagline:'Komm der 21 so nah wie möglich.', genres:['Casino', 'Karten'], accent:'#2fbf71', isNew:true,
      desc:'Blackjack am grünen Tisch: Karte ziehen, stehen, verdoppeln und teilen gegen die Bank. Blackjack zahlt 3 zu 2. Gespielt wird mit Spielgeld-Chips aus deinem Spielhallen-Konto.',
      controls:[['H / S / D / P', 'Karte / Stehen / Verdoppeln / Teilen'], ['Leertaste', 'Geben']]}, coverBlackjack, logoBlackjack],
    [{id:'pharao', file:'spiele/pharao.html', title:'Buch des Pharao', tagline:'Das Buch öffnet die Schatzkammer.', genres:['Casino', 'Slots'], accent:'#ffd23f', isNew:true, featured:true,
      desc:'Ägyptischer Buch-Slot: Das Buch ist Joker und Scatter – 3 Bücher starten Freispiele mit einem expandierenden Spezialsymbol. Mit Risikospiel, Autospin und Turbo. Nur Spielgeld.',
      controls:[['Leertaste', 'Drehen'], ['Risiko', 'Gewinn verdoppeln']]}, coverPharao, logoPharao],
    [{id:'fruechte', file:'spiele/fruechte.html', title:'Früchte-Feuer', tagline:'Heiße Früchte, 20 Linien, Glücksrad.', genres:['Casino', 'Slots'], accent:'#ff7a1f', isNew:true,
      desc:'Der klassische Früchte-Automat mit 20 Gewinnlinien, Wild-Symbol und Stern-Scattern, die das Glücksrad mit Multiplikatoren bis ×100 starten. Nur Spielgeld.',
      controls:[['Leertaste', 'Drehen'], ['Risiko', 'Gewinn verdoppeln']]}, coverFruechte, logoFruechte],
    [{id:'zwilling', file:'spiele/zwilling.html', title:'Zwillingsblitz', tagline:'Zwei Walzen, ein Gedanke.', genres:['Casino', 'Slots'], accent:'#3fe6ff', isNew:true,
      desc:'Neon-Slot mit 243 Gewinnwegen und Zwillingswalzen: Benachbarte Walzen zeigen identische Symbole und können zu fünf gleichen Walzen wachsen. Blitze starten Freispiele. Nur Spielgeld.',
      controls:[['Leertaste', 'Drehen'], ['Risiko', 'Gewinn verdoppeln']]}, coverZwilling, logoZwilling],
    [{id:'poker', file:'spiele/poker.html', title:'Poker', tagline:'Texas Hold’em gegen vier Profis.', genres:['Casino', 'Karten'], accent:'#c45cff', isNew:true,
      desc:'Texas Hold’em am Fünfertisch gegen Computer-Gegner mit eigenem Spielstil – vom vorsichtigen Rentner bis zum wilden Bluffer. Mit Side-Pots, All-in und Showdown. Nur Spielgeld.',
      controls:[['F / C / R', 'Passen / Mitgehen / Erhöhen'], ['Schieberegler', 'Einsatzhöhe']]}, coverPoker, logoPoker],
    [{id:'immo', file:'spiele/immobilien.html', title:'Immobilienkönig', tagline:'Kaufen. Bauen. Kassieren.', genres:['Brettspiel', 'Familie', 'Wirtschaft'], accent:'#e8343a', isNew:true, featured:true,
      desc:'Das große Grundstücks-Brettspiel auf einem 3D-Spielbrett: drei Editionen (Klassik, Deutschland, Weltreise), 2–6 Spieler (Mensch oder KI in drei Stärken), Versteigerungen, echter Handel, Häuser & Hotels, Hypotheken, Hausregeln wie Frei-Parken-Topf und eine Vermögensstatistik am Ende.',
      controls:[['Klick auf Feld', 'Details'], ['Buttons', 'Würfeln, Bauen, Handeln']]}, coverImmo, logoImmo],
    [{id:'leben', file:'spiele/lebensweg.html', title:'Lebensweg', tagline:'Studium, Hochzeit, Haus – und dann?', genres:['Brettspiel', 'Familie'], accent:'#ff7ab8', isNew:true,
      desc:'Das Spiel des Lebens in einer riesigen, frei scrollbaren Welt: Studium oder Job, Familie oder Abenteuer, sicher oder riskant. 17 Berufe mit Spezialfähigkeiten, Häuser, Versicherungen, Aktien, Klagen, Wetten und am Ende Millionärsvilla oder Landhaus – für 2–6 Spieler (Mensch oder KI).',
      controls:[['Klick auf das Rad', 'Drehen'], ['Karten', 'Entscheidungen treffen']]}, coverLeben, logoLeben],
  ];
  E.forEach(([e, c, l]) => HubCatalogAdd(e, c, l));
})();
