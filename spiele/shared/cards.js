/* =====================================================================
   Spielhalle – gemeinsame Spielkarten (Blackjack, Poker)
   Karte = {r: 2..14, s: 0..3}  (11 = Bube, 12 = Dame, 13 = König, 14 = Ass)
   ===================================================================== */
(function(){
  const SUITS = ['♠', '♥', '♦', '♣'], RN = {11:'B', 12:'D', 13:'K', 14:'A'};
  const css = `
  .pcard{position:relative;width:var(--cw,92px);height:calc(var(--cw,92px) * 1.4);border-radius:calc(var(--cw,92px) * .09);flex:none;
    background:linear-gradient(160deg,#ffffff,#f1f2f6);box-shadow:0 1px 0 #d8dbe4,0 6px 16px rgba(0,0,0,.35);color:#1b1e26;font-family:Bahnschrift,'Segoe UI',sans-serif;
    transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s;user-select:none}
  .pcard.red{color:#d42a3a}
  .pcard .ix{position:absolute;display:flex;flex-direction:column;align-items:center;line-height:.95;font-weight:700}
  .pcard .ix b{font-size:calc(var(--cw,92px) * .24)}
  .pcard .ix i{font-style:normal;font-size:calc(var(--cw,92px) * .2);font-family:'Segoe UI Symbol',sans-serif}
  .pcard .tl{left:7%;top:5%}
  .pcard .br{right:7%;bottom:5%;transform:rotate(180deg)}
  .pcard .ce{position:absolute;inset:22% 18%;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI Symbol',sans-serif;font-size:calc(var(--cw,92px) * .5)}
  .pcard .court{position:absolute;inset:20% 17%;border-radius:6px;border:2px solid currentColor;opacity:.9;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0 4px,transparent 4px 8px)}
  .pcard .court b{font-size:calc(var(--cw,92px) * .38);line-height:1}
  .pcard .court i{font-style:normal;font-size:calc(var(--cw,92px) * .24);font-family:'Segoe UI Symbol'}
  .pcard .back{position:absolute;inset:0;border-radius:inherit;background:
      radial-gradient(circle at 50% 50%,rgba(255,255,255,.18) 0 18%,transparent 19%),
      repeating-linear-gradient(45deg,#8b1d2c 0 6px,#a8243a 6px 12px);border:calc(var(--cw,92px) * .05) solid #fff;box-shadow:inset 0 0 0 2px #8b1d2c;
    opacity:0;transition:opacity .2s}
  .pcard.down .back{opacity:1}
  .pcard.down .ix,.pcard.down .ce,.pcard.down .court{visibility:hidden}
  .pcard.win{box-shadow:0 0 0 3px #ffd23f,0 6px 20px rgba(255,210,63,.5)}
  .pcard.dim{filter:brightness(.6)}
  .chip{--c:#d42a3a;position:relative;width:52px;height:52px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-family:Bahnschrift;font-weight:700;font-size:13px;color:#fff;cursor:pointer;
    background:radial-gradient(circle,var(--c) 0 52%,#fff 53% 58%,var(--c) 59%);box-shadow:0 4px 0 rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.25);
    border:4px dashed rgba(255,255,255,.75);transition:transform .15s}
  .chip:hover{transform:translateY(-3px)}
  .chip.off{opacity:.35;pointer-events:none}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function html(c, down){
    const red = c.s === 1 || c.s === 2, r = RN[c.r] || c.r, s = SUITS[c.s];
    const mid = c.r >= 11 && c.r <= 13 ? `<div class="court"><b>${r}</b><i>${s}</i></div>` : `<div class="ce">${s}</div>`;
    return `<div class="pcard ${red ? 'red' : ''} ${down ? 'down' : ''}"><div class="ix tl"><b>${r}</b><i>${s}</i></div>${mid}<div class="ix br"><b>${r}</b><i>${s}</i></div><div class="back"></div></div>`;
  }
  function el(c, down){ const d = document.createElement('div'); d.innerHTML = html(c, down); return d.firstChild; }
  function deck(n = 1){ const d = []; for (let k = 0; k < n; k++) for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({r, s}); return shuffle(d); }
  function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const name = c => (RN[c.r] ? {B:'Bube', D:'Dame', K:'König', A:'Ass'}[RN[c.r]] : c.r) + ' ' + ['Pik', 'Herz', 'Karo', 'Kreuz'][c.s];
  const CHIPS = [[10, '#2f6bff'], [50, '#d42a3a'], [100, '#1a1a22'], [500, '#8a3cc9'], [1000, '#e0a020']];
  window.HubCards = {html, el, deck, shuffle, name, SUITS, CHIPS};
})();
