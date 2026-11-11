/* ---------- Hilfen ---------- */
const $ = (s, r = document) => r.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let LANG = (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en';
try { const l = JSON.parse(localStorage.getItem('loetfrei.v1') || '{}').lang; if (l === 'de' || l === 'en') LANG = l; } catch (e) {}
const L = (d, e) => LANG === 'en' ? e : d;
const tr = x => Array.isArray(x) ? x[LANG === 'en' ? 1 : 0] : x;
const de = (x, d) => LANG === 'en' ? x.toFixed(d) : x.toFixed(d).replace('.', ',');
const fmtR = r => r >= 1e6 ? de(r / 1e6, r % 1e6 ? 1 : 0) + ' MΩ' : r >= 1000 ? de(r / 1000, r % 1000 ? 1 : 0) + ' kΩ' : de(r, r % 1 ? 1 : 0) + ' Ω';
const fmtI = i => Math.abs(i) >= 1 ? de(i, 2) + ' A' : Math.abs(i) >= 0.001 ? de(i * 1e3, Math.abs(i) >= 0.1 ? 0 : 1) + ' mA' : de(i * 1e6, 0) + ' µA';
const fmtV = v => de(Math.abs(v) < 0.005 ? 0 : v, 2) + ' V';
const fmtP = p => Math.abs(p) >= 1 ? de(p, 2) + ' W' : de(p * 1e3, 1) + ' mW';
const fmtC = c => c >= 1e-3 ? de(c * 1e6, 0) + ' µF' : de(c * 1e6, 0) + ' µF';
const E12 = []; for (let d = 1; d <= 5; d++) for (const m of [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]) E12.push(Math.round(m * 10 ** d)); E12.push(1e6);
const ILIMS = [0.005, 0.01, 0.015, 0.02, 0.03, 0.05, 0.1, 0.2, 0.5, 1];
const CAPS = [10e-6, 100e-6, 470e-6, 1000e-6, 2200e-6];

const NAMES = { psu: ['Labornetzteil', 'Bench supply'], resistor: ['Widerstand', 'Resistor'], led: ['LED', 'LED'], sw: ['Schalter', 'Switch'], btn: ['Taster', 'Push button'], cap: ['Kondensator', 'Capacitor'], meter: ['Multimeter', 'Multimeter'], pot: ['Potentiometer', 'Potentiometer'], esp: ['ESP32', 'ESP32'] };
const LEDN = { rot: ['Rot', 'Red'], gelb: ['Gelb', 'Yellow'], gruen: ['Grün', 'Green'], blau: ['Blau', 'Blue'] };
const INFO = {
  psu: ['Liefert eine feste Spannung (CV). Wird mehr Strom gezogen als die Strombegrenzung erlaubt, senkt es die Spannung und hält den Strom konstant (CC).', 'Supplies a fixed voltage (CV). If the load draws more than the current limit allows, it lowers the voltage and holds the current constant (CC).'],
  resistor: ['Begrenzt den Strom: I = U / R. Die Farbringe codieren den Wert. Belastbar bis 0,25 W.', 'Limits the current: I = V / R. The color bands encode the value. Rated for 0.25 W.'],
  led: ['Leuchtet nur in Durchlassrichtung (+ an Anode). Verträgt etwa 20 mA, darüber wird sie zerstört.', 'Lights up only when forward biased (+ on the anode). Handles about 20 mA; more than that destroys it.'],
  sw: ['Schließt oder öffnet den Stromkreis dauerhaft. Klick auf den Schieber schaltet um.', 'Closes or opens the circuit until you flip it again. Click the slider to toggle.'],
  btn: ['Leitet nur, solange du ihn gedrückt hältst.', 'Conducts only while you hold it down.'],
  cap: ['Speichert Ladung. Lädt und entlädt sich über einen Widerstand mit der Zeitkonstante τ = R · C.', 'Stores charge. Charges and discharges through a resistor with the time constant τ = R · C.'],
  meter: ['Spannung misst du parallel zum Bauteil, Strom in Reihe im Stromkreis. Klick auf die Taste wechselt den Modus.', 'Measure voltage in parallel with a part and current in series with the circuit. Click the key to switch modes.'],
  pot: ['Einstellbarer Spannungsteiler. Der mittlere Anschluss ist der Schleifer. Knopf ziehen oder Mausrad drehen.', 'Adjustable voltage divider. The middle terminal is the wiper. Drag the knob or use the mouse wheel.'],
  esp: ['Mikrocontroller mit 3,3-V-Logik, hier über USB versorgt. Ein GPIO liefert höchstens etwa 40 mA. D34 ist nur Eingang.', 'Microcontroller with 3.3 V logic, powered over USB here. A GPIO can source about 40 mA at most. D34 is input only.']
};
const BOX = { psu: [-90, -60, 90, 44], resistor: [-40, -14, 40, 14], led: [-40, -18, 40, 18], sw: [-40, -15, 40, 15], btn: [-40, -18, 40, 18], cap: [-40, -20, 40, 20], meter: [-50, -62, 50, 42], pot: [-42, -32, 42, 42], esp: [-150, -70, 156, 58] };
const DEF = {
  psu: () => ({ v: 5, ilim: 0.5, on: true }), resistor: () => ({ r: 220 }), led: () => ({ color: 'rot' }), sw: () => ({ closed: false }), btn: () => ({}),
  cap: () => ({ c: 1000e-6 }), meter: () => ({ mode: 'V' }), pot: () => ({ r: 10000, pos: 0.5 }), esp: () => ({ sketch: 'blink', params: {} })
};

/* ---------- Zeichnen der Bauteile ---------- */
const BAND = ['#1a1a1a', '#7a4a21', '#d8362b', '#f08a1c', '#f3d21b', '#2f9e44', '#2b62d9', '#8a3fc7', '#8c8c8c', '#f4f4f4'];
function bands(r) {
  let e = Math.floor(Math.log10(r)) - 1, s = Math.round(r / 10 ** e); if (s >= 100) { s = 10; e++; }
  const m = e === -1 ? '#c9a227' : e === -2 ? '#b9bcc0' : BAND[clamp(e, 0, 9)];
  return [BAND[Math.floor(s / 10)], BAND[s % 10], m];
}
const LEAD = '<path class="lead" d="M-40 0H40"/>';
const DRAW = {
  resistor(c) {
    const b = bands(c.p.r), burnt = c.p.burnt;
    return LEAD + `<rect class="rbody" x="-25" y="-9" width="50" height="18" rx="8" fill="${burnt ? '#3b2c25' : '#dcbf8f'}" stroke="${burnt ? '#1e1512' : '#a98758'}"/>` +
      (burnt ? '' : `<rect x="-17" y="-9" width="5" height="18" fill="${b[0]}"/><rect x="-8" y="-9" width="5" height="18" fill="${b[1]}"/><rect x="1" y="-9" width="5" height="18" fill="${b[2]}"/><rect x="13" y="-9" width="4" height="18" fill="#c9a227"/>`) +
      `<path d="M-19 -6.5H19" stroke="#fff" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/><text class="lbl" y="27">${burnt ? L('durchgebrannt', 'burnt out') : fmtR(c.p.r)}</text>`;
  },
  led(c) {
    const col = LED_TYPES[c.p.color].c, burnt = c.p.burnt;
    return LEAD + `<circle class="glow" r="40" fill="url(#glow-${c.p.color})" opacity="0"/>
      <circle r="15.5" fill="${burnt ? '#2a2422' : col}" fill-opacity="${burnt ? 1 : .32}" stroke="${burnt ? '#15110f' : col}" stroke-opacity=".8" stroke-width="1.5"/>
      <path d="M13.5 -7.6V7.6" stroke="${burnt ? '#15110f' : col}" stroke-width="3"/>
      <circle class="lens" r="10.5" fill="${burnt ? '#3a302c' : col}" opacity="${burnt ? 1 : .35}"/>
      <ellipse cx="-4" cy="-5" rx="4.5" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-30 -4 -5)"/>
      <text class="lbl" x="-30" y="-9">+</text>${burnt ? `<text class="lbl" y="32">${L('durchgebrannt', 'burnt out')}</text>` : ''}`;
  },
  sw(c) {
    return LEAD + `<g data-act="toggle" class="clicky"><rect x="-24" y="-12" width="48" height="24" rx="5" fill="#2b3238" stroke="#11161a"/>
      <rect x="-18" y="-6" width="36" height="12" rx="3" fill="#0f1316"/>
      <rect class="swknob" x="${c.p.closed ? 1 : -17}" y="-8" width="16" height="16" rx="3" fill="${c.p.closed ? '#f2b705' : '#aeb7bd'}"/></g>
      <text class="lbl" y="29">${c.p.closed ? L('ein', 'on') : L('aus', 'off')}</text>`;
  },
  btn(c) {
    return LEAD + `<rect x="-17" y="-17" width="34" height="34" rx="5" fill="#30373d" stroke="#11161a"/>
      <circle cx="-12" cy="-12" r="2" fill="#8d979e"/><circle cx="12" cy="-12" r="2" fill="#8d979e"/><circle cx="-12" cy="12" r="2" fill="#8d979e"/><circle cx="12" cy="12" r="2" fill="#8d979e"/>
      <g data-act="press" class="clicky"><circle r="11.5" fill="${c.pressed ? '#b8860b' : '#f2b705'}" stroke="#7d5f04"/><circle r="${c.pressed ? 7 : 8.5}" fill="#fff" opacity="${c.pressed ? .08 : .22}"/></g>`;
  },
  cap(c) {
    return LEAD + `<circle r="19" fill="#1f2c44" stroke="#0e1626" stroke-width="1.5"/><path d="M8 -17.2A19 19 0 0 1 8 17.2Z" fill="#c9d3df"/>
      <circle r="12" fill="#aab3bb"/><path d="M-9 0H9M0 -9V9" stroke="#6d767e" stroke-width="1.5"/>
      <text x="13.5" y="3.5" font-size="11" font-weight="700" fill="#1f2c44" text-anchor="middle">−</text>
      <text class="lbl" x="-30" y="-9">+</text><text class="lbl" y="35">${fmtC(c.p.c)}</text>`;
  },
  meter(c) {
    return `<path class="lead" d="M-20 20V40M20 20V40"/><rect x="-50" y="-62" width="100" height="84" rx="10" fill="#f2b705" stroke="#9c7603"/>
      <rect x="-44" y="-56" width="88" height="72" rx="6" fill="#262c31"/>
      <rect x="-38" y="-50" width="76" height="30" rx="3" fill="#c9d4b9"/><text class="lcd" x="34" y="-28" text-anchor="end">0,00 V</text>
      <g data-act="mode" class="clicky"><rect x="-38" y="-14" width="76" height="20" rx="10" fill="#3a434a"/>
      <rect x="${c.p.mode === 'V' ? -36 : 0}" y="-12" width="36" height="16" rx="8" fill="#f2b705"/>
      <text x="-18" y="0" class="mtxt" fill="${c.p.mode === 'V' ? '#1b2730' : '#c5ced4'}">V</text><text x="18" y="0" class="mtxt" fill="${c.p.mode === 'A' ? '#1b2730' : '#c5ced4'}">A</text></g>
      <circle cx="-20" cy="16" r="4" fill="#d8432e"/><circle cx="20" cy="16" r="4" fill="#111"/>`;
  },
  pot(c) {
    return `<path class="lead" d="M-24 22L-40 40M0 22V40M24 22L40 40"/><rect x="-30" y="-32" width="60" height="56" rx="7" fill="#2a4f86" stroke="#152c50"/>
      <g data-act="knob" class="clicky"><circle r="21" fill="#d5dade" stroke="#8b959c"/><circle r="15" fill="#eef1f3"/>
      <g transform="rotate(${-135 + c.p.pos * 270})"><path d="M0 -4V-19" stroke="#d8432e" stroke-width="3.5" stroke-linecap="round"/></g></g>
      <text class="lbl" y="-38">${fmtR(c.p.r)}</text>`;
  },
  psu() {
    return `<rect x="-90" y="-60" width="180" height="104" rx="9" fill="#dfe3e6" stroke="#8f9aa2"/><rect x="-90" y="-60" width="180" height="9" rx="4" fill="#f2b705"/>
      <rect x="-80" y="-42" width="82" height="62" rx="4" fill="#0c1612" stroke="#000"/>
      <text class="seg dv" x="-6" y="-17" text-anchor="end">5,00 V</text><text class="seg da" x="-6" y="9" text-anchor="end">0,000 A</text>
      <text class="pmode cv" x="14" y="-30">CV</text><text class="pmode ccm" x="40" y="-30">CC</text>
      <g data-act="power" class="clicky"><circle cx="72" cy="-34" r="9" fill="#2b3238"/><circle class="pled" cx="72" cy="-34" r="4.5" fill="#3ee06a"/></g>
      <text x="72" y="-17" font-size="7" fill="#55646f" text-anchor="middle">${L('Ausgang', 'Output')}</text>
      <circle cx="20" cy="20" r="11" fill="#d8432e" stroke="#8e2416"/><circle cx="60" cy="20" r="11" fill="#22282d" stroke="#000"/>
      <text x="20" y="1" font-size="10" font-weight="700" fill="#d8432e" text-anchor="middle">+</text><text x="60" y="1" font-size="10" font-weight="700" fill="#22282d" text-anchor="middle">−</text>`;
  },
  esp() {
    let pins = '';
    TERMS.esp.forEach(t => { pins += `<rect x="${t[0] - 8}" y="32" width="16" height="16" rx="2" fill="#c9a227"/><text x="${t[0]}" y="25" class="silk">${t[2]}</text>`; });
    return `<rect x="-150" y="-70" width="300" height="128" rx="7" fill="#17232d" stroke="#0a1118" stroke-width="1.5"/>
      <rect x="-140" y="-62" width="84" height="74" rx="3" fill="#aab2b9" stroke="#737d85"/><rect x="-134" y="-56" width="72" height="62" rx="2" fill="#c3cad0"/>
      <text x="-98" y="-28" font-size="9" font-weight="600" fill="#4b565e" text-anchor="middle">ESP32</text><text x="-98" y="-16" font-size="6.5" fill="#4b565e" text-anchor="middle">WROOM-32</text>
      <path d="M-50 -60h12v10h10v-10h10v10h10v-10h10" fill="none" stroke="#c9a227" stroke-width="2"/>
      <rect x="130" y="-34" width="26" height="30" rx="2" fill="#b4bcc3" stroke="#737d85"/><text x="141" y="6" class="silk">USB</text>
      <rect x="92" y="-58" width="12" height="9" rx="1.5" fill="#0c1218"/><rect x="92" y="6" width="12" height="9" rx="1.5" fill="#0c1218"/>
      <text x="98" y="-42" class="silk">EN</text><text x="98" y="1" class="silk">BOOT</text>
      <circle cx="40" cy="-34" r="4" fill="#12324e"/><circle class="obled" cx="40" cy="-34" r="9" fill="url(#glow-blau)" opacity="0"/><text x="40" y="-44" class="silk">LED D2</text>
      <circle cx="10" cy="-34" r="4" fill="#d8432e"/><circle cx="10" cy="-34" r="8" fill="url(#glow-rot)" opacity=".8"/><text x="10" y="-44" class="silk">PWR</text>
      <text x="-44" y="-4" font-size="13" font-weight="600" fill="#e9eef1" opacity=".9">ESP32 DevKit</text>${pins}`;
  }
};
function drawComp(c) {
  const b = BOX[c.type];
  let s = `<rect class="selbox" x="${b[0] - 6}" y="${b[1] - 6}" width="${b[2] - b[0] + 12}" height="${b[3] - b[1] + 12}" rx="8"/><g class="body">` + DRAW[c.type](c) + '</g>';
  TERMS[c.type].forEach(t => { s += `<circle class="term${t[2] === '+' || t[2] === '3V3' ? ' tp' : t[2] === '−' || t[2] === 'GND' ? ' tm' : ''}" cx="${t[0]}" cy="${t[1]}" r="${COARSE ? 7.5 : 5.5}"/>`; });
  return s;
}

/* ---------- Zustand ---------- */
const S = { comps: [], wires: [], t: 0, topo: true };
let VH = 620, UPP = 1, lastW = 0;
const view = { x: 0, y: 0, w: 1000, h: 620 }, COARSE = matchMedia('(pointer:coarse)').matches;
const maxW = r => Math.max(1000, VH * r.width / r.height);
function applyView() {
  const r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
  view.w = clamp(view.w, 260, maxW(r)); view.h = view.w * r.height / r.width; UPP = view.w / r.width;
  view.x = view.w >= 1000 ? (1000 - view.w) / 2 : clamp(view.x, 0, 1000 - view.w);
  view.y = view.h >= VH ? 0 : clamp(view.y, 0, VH - view.h);
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
}
function resetView() {
  const r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
  const narrow = r.width < 640;
  view.w = 1e9;
  if (narrow && S.comps.length) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const c of S.comps) { const b = BOX[c.type]; x0 = Math.min(x0, c.x + b[0]); x1 = Math.max(x1, c.x + b[2]); y0 = Math.min(y0, c.y + b[1]); y1 = Math.max(y1, c.y + b[3]); }
    const k = r.height / r.width;
    view.w = Math.max(r.width / 0.68, x1 - x0 + 50, (y1 - y0 + 110) / k);
    view.x = (x0 + x1) / 2 - view.w / 2; view.y = (y0 + y1) / 2 - view.w * k / 2;
  }
  applyView();
}
function fit() {
  const r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
  VH = Math.max(620, Math.min(900, Math.floor(1000 * r.height / r.width / 20) * 20));
  document.querySelectorAll('.matr').forEach(m => m.setAttribute('height', VH));
  if (Math.abs(r.width - lastW) > 1) { lastW = r.width; resetView(); } else applyView();
}
function zoomAt(f, cx, cy) {
  const r = wrap.getBoundingClientRect(), fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height, wx = view.x + fx * view.w, wy = view.y + fy * view.h;
  view.w = clamp(view.w * f, 260, maxW(r)); view.x = wx - fx * view.w; view.y = wy - fy * view.w * r.height / r.width; applyView();
}
let nextId = 1, sel = null, level = null, levelIdx = 0, mem = {}, doneHold = 0, completed = false, hintN = 0;
let undo = [];
const svg = $('#bench'), gComps = $('#gComps'), gWires = $('#gWires'), gFx = $('#gFx'), ghostWire = $('#ghostWire'), termHi = $('#termHi');
const wrap = svg.parentNode;
let store = { done: {}, mute: false, level: 0, lang: null };
try { Object.assign(store, JSON.parse(localStorage.getItem('loetfrei.v1') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('loetfrei.v1', JSON.stringify(store)); } catch (e) {} };

const comp = id => S.comps.find(c => c.id === id);
function termPos(c, k) {
  const t = TERMS[c.type][k], r = c.rot || 0;
  const [x, y] = r === 1 ? [-t[1], t[0]] : r === 2 ? [-t[0], -t[1]] : r === 3 ? [t[1], -t[0]] : [t[0], t[1]];
  return [c.x + x, c.y + y];
}
function mk(type, x, y, p) {
  const c = { id: nextId++, type, x, y, rot: 0, p: Object.assign(DEF[type](), p || {}) };
  if (type === 'esp') c.pins = {};
  return c;
}
const snap = () => JSON.stringify({ c: S.comps.map(c => ({ id: c.id, type: c.type, x: c.x, y: c.y, rot: c.rot, p: c.p })), w: S.wires.map(w => ({ id: w.id, a: w.a, b: w.b, col: w.col })) });
function restore(js) {
  const d = JSON.parse(js);
  S.comps = d.c.map(o => { const c = { ...o, p: { ...o.p } }; if (c.type === 'esp') { c.pins = {}; c.p.params = { ...c.p.params }; } return c; });
  S.wires = d.w.map(o => ({ ...o }));
  nextId = Math.max(0, ...S.comps.map(c => c.id), ...S.wires.map(w => w.id)) + 1;
  S.topo = true; sel = null; renderAll();
}
function pushUndo() { undo.push(snap()); if (undo.length > 60) undo.shift(); }
function doUndo() { if (!undo.length) return snd('err'); restore(undo.pop()); snd('del'); }

/* ---------- Rendern ---------- */
function setTf(c) { c.el.setAttribute('transform', `translate(${c.x} ${c.y}) rotate(${(c.rot || 0) * 90})`); }
function mountComp(c) {
  const g = document.createElementNS(NS, 'g'); g.dataset.comp = c.id; g.setAttribute('class', 'comp'); c.el = g;
  g.innerHTML = drawComp(c); setTf(c); gComps.appendChild(g);
}
function rerender(c) { c.el.innerHTML = drawComp(c); c.el.classList.toggle('selected', sel && sel.c === c); }
function wireD(w) {
  const a = comp(w.a[0]), b = comp(w.b[0]); if (!a || !b) return '';
  const p = termPos(a, w.a[1]), q = termPos(b, w.b[1]);
  return bez(p, q);
}
function bez(p, q) { const s = Math.min(90, 22 + Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.18); return `M${p[0]} ${p[1]}C${p[0]} ${p[1] + s} ${q[0]} ${q[1] + s} ${q[0]} ${q[1]}`; }
function mountWire(w) {
  const g = document.createElementNS(NS, 'g'); g.dataset.wire = w.id; g.setAttribute('class', 'wire'); w.el = g;
  g.innerHTML = `<path class="w-sh"/><path class="w-body" stroke="${w.col}"/><path class="w-hl"/><path class="w-flow"/>`;
  gWires.appendChild(g); updWire(w);
}
function updWire(w) { const d = wireD(w); for (const p of w.el.children) p.setAttribute('d', d); }
function renderAll() {
  gComps.innerHTML = ''; gWires.innerHTML = '';
  S.comps.forEach(mountComp); S.wires.forEach(mountWire);
  select(null); renderTray(); renderCode();
}
function select(s) {
  sel = s;
  S.comps.forEach(c => c.el && c.el.classList.toggle('selected', !!s && s.c === c));
  S.wires.forEach(w => w.el && w.el.classList.toggle('selected', !!s && s.w === w));
  renderInspector();
}

/* ---------- Effekte ---------- */
function fx(html, ms = 700) { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; gFx.appendChild(g); setTimeout(() => g.remove(), ms); }
const ripple = (x, y, col = '#f2b705') => fx(`<circle class="fx-ring" cx="${x}" cy="${y}" r="16" stroke="${col}"/>`);
function sparks(x, y) { let s = ''; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + Math.random(); s += `<path class="fx-spark" d="M${x + Math.cos(a) * 6} ${y + Math.sin(a) * 6}L${x + Math.cos(a) * 17} ${y + Math.sin(a) * 17}"/>`; } fx(s + `<circle class="fx-ring" cx="${x}" cy="${y}" r="13" stroke="#fff"/>`, 500); }
function smoke(x, y) { let s = ''; for (let i = 0; i < 6; i++) s += `<circle class="fx-smoke" cx="${x + (Math.random() - .5) * 16}" cy="${y}" r="${7 + Math.random() * 7}" style="animation-delay:${i * 90}ms"/>`; fx(s + `<circle class="fx-flash" cx="${x}" cy="${y}" r="30"/>`, 2200); }
function pop(c) { const b = c.el.querySelector('.body'); b.classList.remove('pop'); void b.getBBox(); b.classList.add('pop'); }
let toastT;
function toast(msg, kind = '') { const t = $('#toast'); t.textContent = msg; t.className = 'show ' + kind; clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 3200); }

/* ---------- Ton ---------- */
let AC = null;
function audio() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === 'suspended') AC.resume().catch(() => {}); return AC; }
function tone(f, d, type = 'sine', vol = .12, f2, t0 = 0) {
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d, vol, freq, type = 'highpass', f2) {
  const n = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = buf; f.type = type; f.frequency.value = freq;
  if (f2) f.frequency.exponentialRampToValueAtTime(f2, AC.currentTime + d);
  g.gain.value = vol; s.connect(f).connect(g).connect(AC.destination); s.start();
}
const SND = {
  pick: () => { tone(900, .04, 'triangle', .07); noise(.02, .05, 3000); },
  place: () => { tone(170, .09, 'sine', .2, 90); noise(.03, .1, 1800); },
  connect: () => { noise(.025, .12, 2500); tone(620, .05, 'triangle', .09); tone(930, .08, 'triangle', .08, null, .045); },
  toggle: () => { noise(.03, .2, 1500); tone(240, .04, 'square', .05); },
  press: () => { noise(.02, .14, 2200); tone(320, .03, 'sine', .08); },
  release: () => { noise(.015, .08, 3000); },
  tick: () => tone(1500, .015, 'square', .025),
  del: () => tone(420, .12, 'triangle', .09, 150),
  err: () => tone(130, .14, 'square', .06),
  burn: () => { noise(.5, .35, 2400, 'lowpass', 200); tone(90, .3, 'sawtooth', .1, 40); },
  goal: () => { tone(880, .09, 'sine', .1); tone(1320, .14, 'sine', .08, null, .07); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .28, 'triangle', .11, null, i * .09))
};
function snd(n) { if (store.mute || !audio()) return; try { SND[n](); } catch (e) {} }

/* ---------- Bearbeiten ---------- */
function addComp(type, x, y, p) {
  if (type === 'esp' && S.comps.some(c => c.type === 'esp')) { toast(L('Auf der Werkbank liegt schon ein ESP32.', 'There is already an ESP32 on the bench.'), 'bad'); snd('err'); return null; }
  pushUndo();
  const b = BOX[type], c = mk(type, clamp(Math.round(x / 20) * 20, -b[0] + 10, 990 - b[2]), clamp(Math.round(y / 20) * 20, -b[1] + 10, VH - 10 - b[3]), p);
  S.comps.push(c); S.topo = true; mountComp(c); pop(c); select({ c }); snd('place'); ripple(c.x, c.y); renderTray(); renderCode();
  return c;
}
function delSel() {
  if (!sel) return; pushUndo();
  if (sel.w) { S.wires = S.wires.filter(w => w !== sel.w); sel.w.el.remove(); }
  else { const c = sel.c; S.wires = S.wires.filter(w => { if (w.a[0] === c.id || w.b[0] === c.id) { w.el.remove(); return false; } return true; }); S.comps = S.comps.filter(x => x !== c); c.el.remove(); S.topo = true; }
  snd('del'); select(null); renderTray(); renderCode();
}
function rotSel() { if (!sel || !sel.c) return; pushUndo(); sel.c.rot = ((sel.c.rot || 0) + 1) % 4; setTf(sel.c); S.wires.forEach(updWire); snd('tick'); }
const WCOL = ['#f2c230', '#35c46a', '#f5f5f0', '#f08a1c', '#b98cff', '#4fb6ff']; let wcI = 0;
function addWire(a, b) {
  if (S.wires.some(w => (w.a[0] === a[0] && w.a[1] === a[1] && w.b[0] === b[0] && w.b[1] === b[1]) || (w.a[0] === b[0] && w.a[1] === b[1] && w.b[0] === a[0] && w.b[1] === a[1]))) return snd('err');
  pushUndo();
  const la = TERMS[comp(a[0]).type][a[1]][2], lb = TERMS[comp(b[0]).type][b[1]][2];
  const is = (l, s) => s.includes(l);
  const col = is(la, ['3V3']) || is(lb, ['3V3']) || ((la === '+' || lb === '+') && (comp(a[0]).type === 'psu' || comp(b[0]).type === 'psu')) ? '#e0442f'
    : is(la, ['GND']) || is(lb, ['GND']) || ((la === '−' || lb === '−') && (comp(a[0]).type === 'psu' || comp(b[0]).type === 'psu')) ? '#20262b' : WCOL[wcI++ % WCOL.length];
  const w = { id: nextId++, a, b, col }; S.wires.push(w); mountWire(w);
  const p = termPos(comp(b[0]), b[1]); sparks(p[0], p[1]); snd('connect');
}

/* ---------- Zeiger auf der Werkbank ---------- */
function pt(e) { const m = svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, p.y]; }
/* strict (Finger): ein Anschluss zählt nur, wenn der Finger ihm näher ist als der Bauteilmitte */
function nearTerm(p, strict) {
  const r = Math.max(13, (COARSE ? 24 : 10) * UPP);
  let best = null, bd = r * r;
  for (const c of S.comps) {
    const dc = (c.x - p[0]) ** 2 + (c.y - p[1]) ** 2;
    for (let k = 0; k < TERMS[c.type].length; k++) { const q = termPos(c, k), d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bd && !(strict && dc < d)) { bd = d; best = { c, k, p: q }; } }
  }
  return best;
}
function beginWire(t, p, down) {
  wiring = { c: t.c, k: t.k, p0: p, moved: false, from: t.p, down }; svg.classList.add('wiring');
  ghostWire.setAttribute('d', bez(t.p, t.p)); ghostWire.style.display = ''; snd('pick'); ripple(t.p[0], t.p[1], '#fff');
  if (!down) showHi(t);
}
let wiring = null, drag = null, knob = null, pressed = null, pan = null, pinch = null;
const ptrs = new Map();
function cancelOps() {
  if (pressed) { pressed.pressed = false; rerender(pressed); pressed = null; }
  if (drag) { drag.c.el.classList.remove('dragging'); drag = null; }
  knob = null; pan = null; endWiring(); showHi(null);
}
function pinchState() { const [a, b] = [...ptrs.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2 }; }
function showHi(t) { if (t) { termHi.setAttribute('cx', t.p[0]); termHi.setAttribute('cy', t.p[1]); termHi.style.display = ''; } else termHi.style.display = 'none'; }
function endWiring() { if (wiring) showHi(null); wiring = null; ghostWire.style.display = 'none'; svg.classList.remove('wiring'); }
svg.addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  if (ptrs.size === 2) { cancelOps(); pinch = pinchState(); return; }
  if (ptrs.size > 2) return;
  audio(); const touch = e.pointerType === 'touch', p = pt(e), t = nearTerm(p, touch && !wiring);
  if (t) {
    if (wiring) { if (t.c !== wiring.c || t.k !== wiring.k) addWire([wiring.c.id, wiring.k], [t.c.id, t.k]); endWiring(); return; }
    /* Finger: Ziehen verschiebt das Bauteil, erst ein Antippen des Anschlusses beginnt ein Kabel */
    if (touch) { drag = { c: t.c, p0: p, x0: t.c.x, y0: t.c.y, moved: false, term: t, slop: 9 * UPP }; return; }
    beginWire(t, p, true); return;
  }
  if (wiring) { endWiring(); return; }
  const wg = e.target.closest('[data-wire]'), cg = e.target.closest('[data-comp]');
  if (wg) { select({ w: S.wires.find(w => w.id == wg.dataset.wire) }); snd('tick'); return; }
  if (cg) {
    const c = comp(+cg.dataset.comp), act = e.target.closest('[data-act]')?.dataset.act;
    if (!sel || sel.c !== c) select({ c });
    if (act === 'press') { c.pressed = true; pressed = c; rerender(c); snd('press'); return; }
    if (act === 'knob') { pushUndo(); knob = { c, p0: p, pos0: c.p.pos }; return; }
    drag = { c, p0: p, x0: c.x, y0: c.y, moved: false, act, slop: touch ? 9 * UPP : 5 };
    return;
  }
  select(null); pan = { cx: e.clientX, cy: e.clientY, x: view.x, y: view.y };
});
svg.addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch) {
    if (ptrs.size < 2) return; const n = pinchState();
    view.x -= (n.mx - pinch.mx) * UPP; view.y -= (n.my - pinch.my) * UPP; zoomAt(pinch.d / n.d, n.mx, n.my); pinch = n; return;
  }
  if (pan) { view.x = pan.x - (e.clientX - pan.cx) * UPP; view.y = pan.y - (e.clientY - pan.cy) * UPP; applyView(); return; }
  const p = pt(e);
  if (wiring) {
    if (Math.hypot(p[0] - wiring.p0[0], p[1] - wiring.p0[1]) > 6) wiring.moved = true;
    const t = nearTerm(p); showHi(t && (t.c !== wiring.c || t.k !== wiring.k) ? t : null);
    ghostWire.setAttribute('d', bez(wiring.from, t ? t.p : p)); return;
  }
  if (knob) { const c = knob.c; c.p.pos = clamp(knob.pos0 + ((p[0] - knob.p0[0]) - (p[1] - knob.p0[1])) / 140, 0, 1); rerender(c); syncInspector(); return; }
  if (drag) {
    const c = drag.c, dx = p[0] - drag.p0[0], dy = p[1] - drag.p0[1];
    if (!drag.moved && Math.hypot(dx, dy) > drag.slop) { drag.moved = true; if (!sel || sel.c !== c) select({ c }); pushUndo(); snd('pick'); c.el.classList.add('dragging'); gComps.appendChild(c.el); }
    if (drag.moved) {
      const b = BOX[c.type], nx = clamp(Math.round((drag.x0 + dx) / 20) * 20, 50, 950), ny = clamp(Math.round((drag.y0 + dy) / 20) * 20, 40, VH - 40);
      if (nx !== c.x || ny !== c.y) { c.x = nx; c.y = ny; setTf(c); S.wires.forEach(w => { if (w.a[0] === c.id || w.b[0] === c.id) updWire(w); }); }
    }
    return;
  }
  showHi(nearTerm(p));
});
svg.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); cancelOps(); if (ptrs.size < 2) pinch = null; });
svg.addEventListener('pointerup', e => {
  ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; return; }
  pan = null;
  const p = pt(e);
  if (pressed) { pressed.pressed = false; rerender(pressed); pressed = null; snd('release'); }
  if (knob) { knob = null; renderInspector(); }
  if (wiring && wiring.down) {
    wiring.down = false; const t = nearTerm(p);
    if (t && (t.c !== wiring.c || t.k !== wiring.k)) { addWire([wiring.c.id, wiring.k], [t.c.id, t.k]); endWiring(); showHi(null); }
    else if (wiring.moved && !t) endWiring();
    else showHi({ p: wiring.from });
  }
  if (drag) {
    const c = drag.c;
    if (drag.moved) { c.el.classList.remove('dragging'); snd('place'); }
    else if (drag.term) beginWire(drag.term, p, false);
    else if (drag.act === 'toggle') { pushUndo(); c.p.closed = !c.p.closed; rerender(c); snd('toggle'); renderInspector(); }
    else if (drag.act === 'power') { pushUndo(); c.p.on = !c.p.on; snd('toggle'); renderInspector(); }
    else if (drag.act === 'mode') { pushUndo(); c.p.mode = c.p.mode === 'V' ? 'A' : 'V'; rerender(c); snd('toggle'); renderInspector(); }
    drag = null;
  }
});
svg.addEventListener('pointerleave', () => { if (!wiring) showHi(null); });
svg.addEventListener('wheel', e => {
  const cg = e.target.closest('[data-comp]'), c = cg && comp(+cg.dataset.comp); e.preventDefault();
  if (c && c.type === 'pot') { c.p.pos = clamp(c.p.pos - Math.sign(e.deltaY) * 0.04, 0, 1); rerender(c); snd('tick'); syncInspector(); }
  else zoomAt(Math.exp(clamp(e.deltaY, -80, 80) * 0.002), e.clientX, e.clientY);
}, { passive: false });
svg.addEventListener('dblclick', e => { const wg = e.target.closest('[data-wire]'); if (wg) { select({ w: S.wires.find(w => w.id == wg.dataset.wire) }); delSel(); } });
svg.addEventListener('contextmenu', e => { e.preventDefault(); const g = e.target.closest('[data-wire],[data-comp]'); if (!g) return; select(g.dataset.wire ? { w: S.wires.find(w => w.id == g.dataset.wire) } : { c: comp(+g.dataset.comp) }); delSel(); });
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delSel(); }
  else if (e.key === 'r' || e.key === 'R') rotSel();
  else if (e.key === 'Escape') { endWiring(); select(null); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); doUndo(); }
});

/* ---------- Baukasten ---------- */
function icon(type) {
  const b = BOX[type], c = mk(type, 0, 0); nextId--;
  return `<svg viewBox="${b[0] - 4} ${b[1] - 4} ${b[2] - b[0] + 8} ${b[3] - b[1] + 8}" aria-hidden="true">${drawComp(c)}</svg>`;
}
function renderTray() {
  const tray = $('#tray'); tray.innerHTML = '';
  for (const type of level.tray) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'part'; b.dataset.type = type;
    b.innerHTML = icon(type) + `<span>${tr(NAMES[type])}</span>`;
    if (type === 'esp' && S.comps.some(c => c.type === 'esp')) b.disabled = true;
    tray.appendChild(b);
  }
  $('#trayEmpty').hidden = level.tray.length > 0;
}
let tdrag = null;
$('#tray').addEventListener('pointerdown', e => {
  const b = e.target.closest('.part'); if (!b || b.disabled) return; audio();
  tdrag = { type: b.dataset.type, x0: e.clientX, y0: e.clientY, ghost: null }; b.setPointerCapture(e.pointerId);
});
$('#tray').addEventListener('pointermove', e => {
  if (!tdrag) return;
  if (!tdrag.ghost && Math.hypot(e.clientX - tdrag.x0, e.clientY - tdrag.y0) > 6) {
    const g = document.createElement('div'); g.className = 'dragghost'; g.innerHTML = icon(tdrag.type);
    const b = BOX[tdrag.type], k = 1 / UPP; g.style.width = (b[2] - b[0] + 8) * k + 'px';
    document.body.appendChild(g); tdrag.ghost = g; snd('pick');
  }
  if (tdrag.ghost) { tdrag.ghost.style.left = e.clientX + 'px'; tdrag.ghost.style.top = e.clientY + 'px'; }
});
$('#tray').addEventListener('pointerup', e => {
  if (!tdrag) return; const d = tdrag; tdrag = null;
  if (d.ghost) {
    d.ghost.remove(); const r = svg.getBoundingClientRect();
    if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) { const p = pt(e); addComp(d.type, p[0], p[1]); }
  } else {
    let x = Math.round((view.x + view.w / 2) / 20) * 20, y = Math.round((view.y + view.h / 2) / 20) * 20; while (S.comps.some(c => Math.abs(c.x - x) < 30 && Math.abs(c.y - y) < 30)) { x += 40; y += 40; }
    addComp(d.type, x, y);
  }
});
$('#tray').addEventListener('pointercancel', () => { if (tdrag && tdrag.ghost) tdrag.ghost.remove(); tdrag = null; });
$('#tray').addEventListener('keydown', e => { const b = e.target.closest('.part'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); addComp(b.dataset.type, 500, 300); } });

/* ---------- Inspektor ---------- */
function renderInspector() {
  const el = $('#inspector');
  if (!sel) { el.innerHTML = `<p class="muted">${L('Klick ein Bauteil an, um es einzustellen und zu messen. Kabel ziehst du von Anschluss zu Anschluss.', 'Select a part to adjust and measure it. Draw wires from terminal to terminal.')}</p>`; return; }
  if (sel.w) { el.innerHTML = `<h3>${L('Kabel', 'Wire')}</h3><p class="muted">${L('Strom im Kabel', 'Current in the wire')}: <b id="ro-i" class="num">–</b></p><div class="row"><button type="button" class="btn" data-do="del">${L('Kabel entfernen', 'Remove wire')}</button></div>`; return; }
  const c = sel.c, p = c.p, lock = level.lock || {};
  let h = `<h3>${tr(NAMES[c.type])}</h3><p class="muted">${tr(INFO[c.type])}</p>`;
  const slider = (id, label, min, max, step, val, out, dis) => `<label class="ctl" for="${id}"><span>${label}</span><output id="${id}-o">${out}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"${dis ? ' disabled' : ''}></label>`;
  if (c.type === 'psu') {
    h += slider('in-v', L('Spannung', 'Voltage') + (lock.v ? L(' (in dieser Lektion fest)', ' (fixed in this lesson)') : ''), 0, 12, 0.1, p.v, fmtV(p.v), lock.v);
    h += slider('in-il', L('Strombegrenzung', 'Current limit'), 0, ILIMS.length - 1, 1, ILIMS.indexOf(p.ilim), fmtI(p.ilim));
    h += `<div class="row"><button type="button" class="btn${p.on ? ' on' : ''}" data-do="power" aria-pressed="${p.on}">${p.on ? L('Ausgang ein', 'Output on') : L('Ausgang aus', 'Output off')}</button></div>`;
  } else if (c.type === 'resistor') {
    if (p.burnt) h += `<div class="row"><button type="button" class="btn on" data-do="fix">${L('Neuen Widerstand einsetzen', 'Fit a new resistor')}</button></div>`;
    else {
      let i = 0; E12.forEach((v, k) => { if (Math.abs(v - p.r) < Math.abs(E12[i] - p.r)) i = k; });
      h += slider('in-r', L('Wert (Normreihe E12)', 'Value (E12 series)'), 0, E12.length - 1, 1, i, fmtR(p.r));
      h += `<label class="ctl" for="in-rn"><span>${L('Oder frei eingeben, in Ohm', 'Or type any value, in ohms')}</span><input type="number" id="in-rn" min="1" max="1000000" value="${p.r}"></label>`;
    }
  } else if (c.type === 'led') {
    if (p.burnt) h += `<div class="row"><button type="button" class="btn on" data-do="fix">${L('Neue LED einsetzen', 'Fit a new LED')}</button></div>`;
    h += `<div class="seg-ctl" role="group" aria-label="${L('Farbe', 'Color')}">` + Object.entries(LED_TYPES).map(([k, t]) => `<button type="button" data-col="${k}" aria-pressed="${p.color === k}"><i style="background:${t.c}"></i>${tr(LEDN[k])}</button>`).join('') + `</div><p class="muted">${L('Durchlassspannung ca.', 'Forward voltage approx.')} ${de(LED_TYPES[p.color].vf, 1)} V</p>`;
  } else if (c.type === 'cap') h += slider('in-c', L('Kapazität', 'Capacitance'), 0, CAPS.length - 1, 1, CAPS.indexOf(p.c), fmtC(p.c));
  else if (c.type === 'pot') {
    h += slider('in-pos', L('Stellung', 'Position'), 0, 1, 0.01, p.pos, Math.round(p.pos * 100) + ' %');
    h += `<div class="seg-ctl" role="group" aria-label="${L('Gesamtwiderstand', 'Total resistance')}">` + [1000, 10000, 100000].map(v => `<button type="button" data-potr="${v}" aria-pressed="${p.r === v}">${fmtR(v)}</button>`).join('') + '</div>';
  } else if (c.type === 'meter') h += `<div class="seg-ctl" role="group" aria-label="${L('Messmodus', 'Mode')}"><button type="button" data-mode="V" aria-pressed="${p.mode === 'V'}">${L('Spannung', 'Voltage')}</button><button type="button" data-mode="A" aria-pressed="${p.mode === 'A'}">${L('Strom', 'Current')}</button></div>`;
  else if (c.type === 'sw') h += `<div class="row"><button type="button" class="btn${p.closed ? ' on' : ''}" data-do="toggle" aria-pressed="${p.closed}">${p.closed ? L('Geschlossen', 'Closed') : L('Offen', 'Open')}</button></div>`;
  if (c.type !== 'esp') h += `<dl class="ro"><div><dt>${L('Spannung', 'Voltage')}</dt><dd id="ro-v" class="num">–</dd></div><div><dt>${L('Strom', 'Current')}</dt><dd id="ro-i" class="num">–</dd></div><div><dt>${L('Leistung', 'Power')}</dt><dd id="ro-p" class="num">–</dd></div></dl>`;
  h += `<div class="row"><button type="button" class="btn" data-do="rot">${L('Drehen', 'Rotate')} <kbd>R</kbd></button><button type="button" class="btn" data-do="del">${L('Entfernen', 'Remove')} <kbd>${L('Entf', 'Del')}</kbd></button></div>`;
  el.innerHTML = h;
}
function syncInspector() { if (sel && sel.c && sel.c.type === 'pot') { const i = $('#in-pos'); if (i) { i.value = sel.c.p.pos; $('#in-pos-o').textContent = Math.round(sel.c.p.pos * 100) + ' %'; } } }
const insp = $('#inspector');
insp.addEventListener('pointerdown', () => { if (sel) pushUndo(); }, true);
insp.addEventListener('input', e => {
  const c = sel && sel.c; if (!c) return; const id = e.target.id, v = +e.target.value, o = $('#' + id + '-o');
  if (id === 'in-v') { c.p.v = v; o.textContent = fmtV(v); }
  else if (id === 'in-il') { c.p.ilim = ILIMS[v]; o.textContent = fmtI(c.p.ilim); }
  else if (id === 'in-r') { c.p.r = E12[v]; o.textContent = fmtR(c.p.r); $('#in-rn').value = c.p.r; rerender(c); }
  else if (id === 'in-rn') { if (v >= 1 && v <= 1e6) { c.p.r = v; $('#in-r-o').textContent = fmtR(v); rerender(c); } }
  else if (id === 'in-c') { c.p.c = CAPS[v]; o.textContent = fmtC(c.p.c); rerender(c); }
  else if (id === 'in-pos') { c.p.pos = v; o.textContent = Math.round(v * 100) + ' %'; rerender(c); }
  if (e.target.type === 'range') snd('tick');
});
insp.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !sel) return; const c = sel.c, d = b.dataset;
  if (d.do === 'del') return delSel();
  if (d.do === 'rot') return rotSel();
  if (d.do === 'power') c.p.on = !c.p.on;
  else if (d.do === 'toggle') c.p.closed = !c.p.closed;
  else if (d.do === 'fix') { c.p.burnt = false; c.over = 0; c.vd = 0; snd('place'); pop(c); }
  else if (d.col) { c.p.color = d.col; c.vd = 0; }
  else if (d.potr) c.p.r = +d.potr;
  else if (d.mode) c.p.mode = d.mode;
  else return;
  if (!d.do || d.do !== 'fix') snd('toggle');
  rerender(c); renderInspector();
});

/* ---------- ESP32-Sketche ---------- */
const OUTP = [2, 4, 5, 18], INP = [2, 4, 5, 18, 34];
const SK = {
  blink: {
    name: ['Blink', 'Blink'], def: { led: 2, ms: 500 },
    code: [`const int LED = {led:out};\nconst int PAUSE = {ms:num};   // Millisekunden\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  delay(PAUSE);\n  digitalWrite(LED, LOW);\n  delay(PAUSE);\n}`,
      `const int LED = {led:out};\nconst int PAUSE = {ms:num};   // milliseconds\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  delay(PAUSE);\n  digitalWrite(LED, LOW);\n  delay(PAUSE);\n}`],
    run(e, p, t) { out(e, p.led, Math.floor(t / Math.max(20, p.ms)) % 2 === 0); }
  },
  button: {
    name: ['Taster schaltet LED', 'Button switches LED'], def: { btn: 4, led: 2, mode: 'INPUT', lvl: 'HIGH' },
    code: [`const int TASTER = {btn:in};\nconst int LED = {led:out};\n\nvoid setup() {\n  pinMode(TASTER, {mode:mode});\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  if (digitalRead(TASTER) == {lvl:lvl}) {\n    digitalWrite(LED, HIGH);\n  } else {\n    digitalWrite(LED, LOW);\n  }\n}`,
      `const int BUTTON = {btn:in};\nconst int LED = {led:out};\n\nvoid setup() {\n  pinMode(BUTTON, {mode:mode});\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  if (digitalRead(BUTTON) == {lvl:lvl}) {\n    digitalWrite(LED, HIGH);\n  } else {\n    digitalWrite(LED, LOW);\n  }\n}`],
    run(e, p) { const r = rd(e, p.btn, p.mode === 'INPUT_PULLUP'); if (p.led !== p.btn) out(e, p.led, r === (p.lvl === 'HIGH' ? 1 : 0)); }
  },
  dimmer: {
    name: ['Poti dimmt LED', 'Pot dims LED'], def: { led: 5 },
    code: [`const int POTI = 34;\nconst int LED = {led:out};\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  int wert = analogRead(POTI);   // 0 bis 4095\n  analogWrite(LED, wert / 16);   // 0 bis 255\n  Serial.println(wert);\n  delay(50);\n}`,
      `const int POT = 34;\nconst int LED = {led:out};\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  int value = analogRead(POT);    // 0 to 4095\n  analogWrite(LED, value / 16);   // 0 to 255\n  Serial.println(value);\n  delay(50);\n}`],
    run(e, p, t) {
      const P = e.pins[34] || (e.pins[34] = { mode: 'in' }); P.mode = 'in';
      const a = clamp(Math.round(((e.pv && e.pv[34]) || 0) / 3.3 * 4095), 0, 4095); e.adc = a;
      const L2 = e.pins[p.led] || (e.pins[p.led] = {}); L2.mode = 'pwm'; L2.duty = Math.floor(a / 16) / 255;
      if (t - (e.st || 0) > 250) { e.st = t; e.serial.push(String(a)); if (e.serial.length > 5) e.serial.shift(); }
    }
  }
};
function out(e, pin, hi) { const P = e.pins[pin] || (e.pins[pin] = {}); P.mode = 'out'; P.hi = hi ? 1 : 0; }
function rd(e, pin, pull) { const P = e.pins[pin] || (e.pins[pin] = { last: 0 }); P.mode = pull ? 'in_pullup' : 'in'; const v = e.pv ? e.pv[pin] : 0; if (v > 1.9) P.last = 1; else if (v < 1.4) P.last = 0; return P.last; }
function espReset(e) { e.pins = {}; e.t0 = S.t; e.serial = []; e.st = 0; e.adc = 0; }
function runSketch(e) {
  const sk = SK[e.p.sketch]; if (!e.serial) espReset(e);
  sk.run(e, Object.assign({}, sk.def, e.p.params), (S.t - e.t0) * 1000);
}
function renderCode() {
  const e = S.comps.find(c => c.type === 'esp'), box = $('#codeSec'); box.hidden = !e; if (!e) return;
  const sk = SK[e.p.sketch], p = Object.assign({}, sk.def, e.p.params);
  let html = tr(sk.code).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/(\/\/.*)$/gm, '<i>$1</i>')
    .replace(/\b(const|int|void|if|else)\b/g, '<b>$1</b>')
    .replace(/\b(pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|Serial\.begin|Serial\.println)\b/g, '<u>$1</u>')
    .replace(/\{(\w+):(\w+)\}/g, (m, k, t) => {
      if (t === 'num') return `<input type="number" id="sk-${k}" data-k="${k}" min="20" max="5000" step="10" value="${p[k]}" aria-label="${L('Pause in Millisekunden', 'Pause in milliseconds')}">`;
      const opts = t === 'out' ? OUTP : t === 'in' ? INP : t === 'mode' ? ['INPUT', 'INPUT_PULLUP'] : ['HIGH', 'LOW'];
      return `<select id="sk-${k}" data-k="${k}" aria-label="${k}">` + opts.map(o => `<option${String(p[k]) === String(o) ? ' selected' : ''}>${o}</option>`).join('') + '</select>';
    });
  $('#code').innerHTML = html;
  const ss = $('#skSel'); ss.innerHTML = Object.entries(SK).map(([k, s]) => `<option value="${k}"${k === e.p.sketch ? ' selected' : ''}>${tr(s.name)}</option>`).join(''); ss.disabled = !!level.sketchLock;
}
$('#code').addEventListener('change', e => {
  const esp = S.comps.find(c => c.type === 'esp'), k = e.target.dataset.k; if (!esp || !k) return; pushUndo();
  esp.p.params[k] = /^\d+$/.test(e.target.value) ? +e.target.value : e.target.value; espReset(esp); snd('toggle'); toast(L('Sketch hochgeladen. Der ESP32 startet neu.', 'Sketch uploaded. The ESP32 restarts.'));
});
$('#skSel').addEventListener('change', e => { const esp = S.comps.find(c => c.type === 'esp'); pushUndo(); esp.p.sketch = e.target.value; esp.p.params = {}; espReset(esp); renderCode(); snd('toggle'); });

/* ---------- Lektionen ---------- */
const by = t => S.comps.filter(c => c.type === t);
const lit = (c, lo, hi) => c && !c.p.burnt && c.iA >= lo && c.iA <= hi;
const adcWired = e => S.wires.some(w => { const a = comp(w.a[0]), b = comp(w.b[0]); return (a === e && w.a[1] === 6 && b.type === 'pot' && w.b[1] === 1) || (b === e && w.b[1] === 6 && a.type === 'pot' && w.a[1] === 1); });
const ALL = ['psu', 'resistor', 'led', 'sw', 'btn', 'pot', 'cap', 'meter', 'esp'];
const CH1 = ['Grundlagen', 'Basics'], CH2 = ['ESP32', 'ESP32'], CH3 = ['Freies Labor', 'Free lab'];
const LEVELS = [
  { id: 'kreis', ch: CH1, title: ['Der erste Stromkreis', 'Your first circuit'],
    text: [`<p>Strom fließt nur im geschlossenen Kreis: vom Pluspol des Netzteils durch die Bauteile zurück zum Minuspol.</p><p>Verbinde Netzteil, Widerstand und LED zu einem Kreis. Zieh dazu ein Kabel von einem Anschluss zum nächsten. Die LED leitet nur in einer Richtung: ihr <b>+</b> gehört auf die Plus-Seite.</p>`,
      `<p>Current only flows in a closed loop: from the positive terminal of the supply, through the parts, back to the negative terminal.</p><p>Connect the supply, the resistor and the LED into a loop by drawing a wire from one terminal to the next. The LED conducts in one direction only: its <b>+</b> goes on the positive side.</p>`],
    tray: ['resistor', 'led'], lock: { v: 1 },
    build: () => [mk('psu', 180, 220, { v: 5 }), mk('resistor', 520, 140), mk('led', 720, 300)],
    goals: [[['Der Stromkreis ist geschlossen, es fließt Strom', 'The circuit is closed and current flows'], () => by('psu').some(p => p.iA > 0.001)], [['Die LED leuchtet mit 5 bis 25 mA', 'The LED is lit at 5 to 25 mA'], () => by('led').some(l => lit(l, .005, .025))]],
    hints: [['Du brauchst drei Kabel: Plus → Widerstand, Widerstand → LED-Plus, LED-Minus → Netzteil-Minus.', 'You need three wires: plus → resistor, resistor → LED plus, LED minus → supply minus.'], ['Bleibt die LED dunkel, obwohl alles verbunden ist? Dann sitzt sie verkehrt herum. Tausche ihre beiden Kabel.', 'LED stays dark although everything is connected? Then it is in backwards. Swap its two wires.']] },
  { id: 'ohm', ch: CH1, title: ['Das ohmsche Gesetz', "Ohm's law"],
    text: [`<p>Spannung, Widerstand und Strom hängen fest zusammen:</p><p class="formula">I = U / R</p><p>Das Netzteil liefert 9 V. Bau einen Kreis aus Netzteil, Widerstand und Multimeter im Strom-Modus. Wähle den Widerstand so, dass 20 mA fließen.</p>`,
      `<p>Voltage, resistance and current are tied together:</p><p class="formula">I = V / R</p><p>The supply delivers 9 V. Build a loop from the supply, the resistor and the multimeter in current mode. Choose the resistor so that 20 mA flow.</p>`],
    tray: ['resistor', 'meter'], lock: { v: 1 },
    build: () => [mk('psu', 180, 240, { v: 9 }), mk('resistor', 540, 140, { r: 1000 }), mk('meter', 740, 320, { mode: 'A' })],
    goals: [[['Das Multimeter misst im Strom-Modus in Reihe', 'The multimeter measures current in series'], () => by('meter').some(m => m.p.mode === 'A' && Math.abs(m.valA) > 0.0005)], [['Es fließen 20 mA (19 bis 21 mA)', '20 mA flow (19 to 21 mA)'], () => by('meter').some(m => m.p.mode === 'A' && Math.abs(m.valA) > .019 && Math.abs(m.valA) < .021)]],
    hints: [['Stelle die Formel um: R = U / I.', 'Rearrange the formula: R = V / I.'], ['R = 9 V / 0,020 A = 450 Ω. In der Normreihe passt 470 Ω, oder du gibst 450 frei ein.', 'R = 9 V / 0.020 A = 450 Ω. In the standard series 470 Ω fits, or type 450 directly.']] },
  { id: 'vorw', ch: CH1, title: ['Der richtige Vorwiderstand', 'The right series resistor'],
    text: [`<p>An einer leuchtenden LED fällt eine fast feste Spannung ab, bei Blau etwa 3 V. Den Rest muss der Vorwiderstand übernehmen:</p><p class="formula">R = (U − U<sub>LED</sub>) / I</p><p>Der eingesetzte 100-Ω-Widerstand ist zu klein, die LED würde nach kurzer Zeit durchbrennen. Stelle ihn so ein, dass 15 bis 20 mA fließen, und schließe dann den Kreis.</p>`,
      `<p>A lit LED drops an almost fixed voltage, about 3 V for blue. The series resistor has to take the rest:</p><p class="formula">R = (V − V<sub>LED</sub>) / I</p><p>The 100 Ω resistor on the bench is too small; the LED would burn out after a moment. Set it so that 15 to 20 mA flow, then close the loop.</p>`],
    tray: ['resistor', 'led', 'meter'], lock: { v: 1 },
    build: () => [mk('psu', 180, 240, { v: 9 }), mk('resistor', 520, 140, { r: 100 }), mk('led', 720, 300, { color: 'blau' })],
    goals: [[['Die blaue LED leuchtet', 'The blue LED is lit'], () => by('led').some(l => l.p.color === 'blau' && lit(l, .003, .06))], [['Ihr Strom liegt zwischen 15 und 20 mA', 'Its current is between 15 and 20 mA'], () => by('led').some(l => l.p.color === 'blau' && lit(l, .015, .02))]],
    hints: [['R = (9 V − 3 V) / 0,018 A ≈ 330 Ω.', 'R = (9 V − 3 V) / 0.018 A ≈ 330 Ω.'], ['LED durchgebrannt? Klick sie an und setze eine neue ein.', 'LED burnt out? Select it and fit a new one.']] },
  { id: 'teiler', ch: CH1, title: ['Der Spannungsteiler', 'The voltage divider'],
    text: [`<p>Zwei Widerstände in Reihe teilen die Spannung im Verhältnis ihrer Werte:</p><p class="formula">U<sub>2</sub> = U · R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)</p><p>Der ESP32 verträgt an seinen Pins nur 3,3 V. Mach aus 5 V mit zwei Widerständen 3,3 V und miss sie mit dem Multimeter parallel zum unteren Widerstand.</p>`,
      `<p>Two resistors in series split the voltage in proportion to their values:</p><p class="formula">V<sub>2</sub> = V · R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)</p><p>The ESP32 tolerates only 3.3 V on its pins. Turn 5 V into 3.3 V with two resistors and measure it with the multimeter in parallel with the lower resistor.</p>`],
    tray: ['resistor', 'meter'], lock: { v: 1 },
    build: () => [mk('psu', 180, 240, { v: 5 }), mk('resistor', 500, 140, { r: 1000 }), mk('resistor', 660, 260, { r: 1000 }), mk('meter', 820, 400, { mode: 'V' })],
    goals: [[['Durch beide Widerstände fließt Strom', 'Current flows through both resistors'], () => by('resistor').filter(r => Math.abs(r.iA) > 1e-5).length >= 2], [['Das Multimeter zeigt 3,2 bis 3,4 V', 'The multimeter reads 3.2 to 3.4 V'], () => by('meter').some(m => m.p.mode === 'V' && Math.abs(m.valA) > 3.2 && Math.abs(m.valA) < 3.4) && by('psu').some(p => p.iA < .05)]],
    hints: [['Reihenfolge: Plus → R1 → R2 → Minus. Das Multimeter kommt mit beiden Leitungen an R2.', 'Order: plus → R1 → R2 → minus. Both multimeter leads go across R2.'], ['Mit R1 = 1 kΩ brauchst du R2 ≈ 2 kΩ: 5 V · 2 / 3 = 3,33 V.', 'With R1 = 1 kΩ you need R2 ≈ 2 kΩ: 5 V · 2 / 3 = 3.33 V.']] },
  { id: 'parallel', ch: CH1, title: ['Parallelschaltung mit Schalter', 'Parallel circuit with a switch'],
    text: [`<p>In einer Parallelschaltung liegt an jedem Zweig dieselbe Spannung, die Ströme der Zweige addieren sich.</p><p>Baue zwei Zweige aus je einer LED mit eigenem Vorwiderstand. Der Schalter sitzt davor und schaltet beide gemeinsam.</p>`,
      `<p>In a parallel circuit every branch sees the same voltage, and the branch currents add up.</p><p>Build two branches, each an LED with its own series resistor. The switch sits in front and switches both together.</p>`],
    tray: ['resistor', 'led', 'sw', 'meter'], lock: { v: 1 },
    build: () => [mk('psu', 160, 260, { v: 5 }), mk('sw', 400, 120), mk('resistor', 600, 180), mk('led', 780, 180), mk('resistor', 600, 340), mk('led', 780, 340, { color: 'gruen' })],
    goals: [[['Schalter ein: beide LEDs leuchten', 'Switch on: both LEDs are lit'], () => { if (by('sw').some(s => s.p.closed) && by('led').filter(l => lit(l, .004, .025)).length >= 2) mem.on = 1; return mem.on; }],
      [['Schalter aus: beide LEDs sind dunkel', 'Switch off: both LEDs are dark'], () => { if (mem.on && by('sw').every(s => !s.p.closed) && by('led').every(l => l.iA < 1e-4)) mem.off = 1; return mem.off; }]],
    hints: [['Vom Schalter-Ausgang gehen zwei Kabel ab: eines zu jedem Widerstand. Mehrere Kabel am selben Anschluss sind erlaubt.', 'Two wires leave the switch output: one to each resistor. Several wires on one terminal are fine.'], ['Beide LED-Minus-Anschlüsse führen zurück zum Minuspol.', 'Both LED minus terminals lead back to the negative terminal.']] },
  { id: 'cc', ch: CH1, title: ['Strombegrenzung am Netzteil', 'Current limiting on the supply'],
    text: [`<p>Ein Labornetzteil hat zwei Regler. Solange wenig Strom fließt, hält es die Spannung (CV). Erreicht der Strom die eingestellte Grenze, senkt es die Spannung und hält den Strom (CC).</p><p>Damit darfst du eine LED ausnahmsweise ohne Vorwiderstand anschließen. Stelle <b>zuerst</b> die Strombegrenzung auf 15 oder 20 mA, verbinde die LED direkt und schalte dann den Ausgang ein.</p>`,
      `<p>A bench supply has two controls. While little current flows it holds the voltage (CV). Once the current reaches the set limit, it lowers the voltage and holds the current (CC).</p><p>That lets you connect an LED without a series resistor for once. <b>First</b> set the current limit to 15 or 20 mA, connect the LED directly, then switch the output on.</p>`],
    tray: ['led'],
    build: () => [mk('psu', 240, 240, { v: 5, ilim: 1, on: false }), mk('led', 640, 240)],
    goals: [[['Strombegrenzung steht auf 15 bis 20 mA', 'Current limit is set to 15 to 20 mA'], () => by('psu').some(p => p.p.ilim >= .015 && p.p.ilim <= .02)], [['Die LED leuchtet direkt am Netzteil', 'The LED is lit directly on the supply'], () => by('led').some(l => lit(l, .01, .025))], [['Das Netzteil regelt im CC-Modus', 'The supply regulates in CC mode'], () => by('psu').some(p => p.cc && p.p.on)]],
    hints: [['Klick das Netzteil an. Bei den Einstellungen findest du den Regler für die Strombegrenzung.', 'Select the supply. Its settings include the current limit control.'], ['Die Anzeige am Netzteil zeigt jetzt nur rund 1,9 V: mehr braucht die rote LED für 20 mA nicht.', 'The supply display now shows only about 1.9 V: the red LED needs no more for 20 mA.']] },
  { id: 'rc', ch: CH1, title: ['Kondensator als Energiespeicher', 'A capacitor stores energy'],
    text: [`<p>Ein Kondensator lädt sich auf die anliegende Spannung auf und gibt die Ladung wieder ab, wenn die Quelle fehlt. Wie lange das dauert, bestimmt die Zeitkonstante:</p><p class="formula">τ = R · C</p><p>Baue: Netzteil → Schalter → Kondensator parallel zu Widerstand plus LED. Öffnest du den Schalter, soll die LED noch mindestens eine Sekunde nachleuchten.</p>`,
      `<p>A capacitor charges up to the applied voltage and releases the charge again once the source is gone. The time constant sets how long that takes:</p><p class="formula">τ = R · C</p><p>Build: supply → switch → capacitor in parallel with resistor plus LED. When you open the switch, the LED should keep glowing for at least one second.</p>`],
    tray: ['resistor', 'led', 'sw', 'cap', 'meter'], lock: { v: 1 },
    build: () => [mk('psu', 160, 260, { v: 5 }), mk('sw', 400, 120), mk('cap', 560, 260, { c: 2200e-6 }), mk('resistor', 700, 160, { r: 470 }), mk('led', 840, 300)],
    goals: [[['Schalter ein: die LED leuchtet', 'Switch on: the LED is lit'], () => { if (by('sw').some(s => s.p.closed) && by('led').some(l => lit(l, .002, .025))) mem.on = 1; return mem.on; }],
      [['Schalter aus: die LED leuchtet 1 s nach', 'Switch off: the LED glows on for 1 s'], (dt) => { const open = by('sw').length && by('sw').every(s => !s.p.closed); mem.glow = open && mem.on && by('led').some(l => l.iA > 3e-4) ? (mem.glow || 0) + dt : 0; if (mem.glow > 1) mem.ok = 1; return mem.ok; }]],
    hints: [['Kondensator-Plus an den Schalter-Ausgang, Kondensator-Minus an den Minuspol.', 'Capacitor plus to the switch output, capacitor minus to the negative terminal.'], ['Am Kondensator-Plus zweigt der zweite Pfad ab: Widerstand → LED → Minuspol.', 'The second path branches off at capacitor plus: resistor → LED → negative terminal.']] },
  { id: 'blink', ch: CH2, title: ['Blink: der erste Sketch', 'Blink: your first sketch'],
    text: [`<p>Ein GPIO-Pin des ESP32 ist ein per Software geschalteter Ausgang: <code>HIGH</code> bedeutet 3,3 V, <code>LOW</code> bedeutet 0 V. Der Sketch im Code-Feld schaltet Pin D2 im Takt.</p><p>Schließe die LED mit Vorwiderstand zwischen D2 und GND an. Pin und Pause kannst du direkt im Code ändern.</p>`,
      `<p>A GPIO pin of the ESP32 is an output switched by software: <code>HIGH</code> means 3.3 V, <code>LOW</code> means 0 V. The sketch in the code panel toggles pin D2 in a steady rhythm.</p><p>Connect the LED with its series resistor between D2 and GND. You can change the pin and the pause right in the code.</p>`],
    tray: ['resistor', 'led'], sketch: 'blink', sketchLock: 1,
    build: () => [mk('esp', 340, 200, { sketch: 'blink' }), mk('resistor', 420, 420), mk('led', 640, 420)],
    goals: [[['Die LED geht an (3 bis 20 mA)', 'The LED turns on (3 to 20 mA)'], () => { if (by('led').some(l => lit(l, .003, .02))) mem.on = 1; return mem.on; }], [['Sie blinkt mindestens dreimal', 'It blinks at least three times'], () => { const on = by('led').some(l => l.iA > .003); if (on && !mem.was) mem.n = (mem.n || 0) + 1; mem.was = on; return mem.n >= 3; }]],
    hints: [['D2 → Widerstand → LED-Plus, LED-Minus → GND.', 'D2 → resistor → LED plus, LED minus → GND.'], ['Wählst du im Code einen anderen Pin, muss auch das Kabel an diesen Pin.', 'If you pick another pin in the code, the wire has to move to that pin too.']] },
  { id: 'taster', ch: CH2, title: ['Taster einlesen', 'Reading a push button'],
    text: [`<p>Ein Eingang ohne feste Verbindung ist <b>offen</b>: er fängt Störungen ein und liefert zufällige Werte. Probiere es aus und schließe erst nur den Taster zwischen 3V3 und D4 an: die LED flackert.</p><p>Ein Pull-down-Widerstand von 10 kΩ zwischen D4 und GND zieht den Pin sicher auf LOW, solange der Taster offen ist. Die LED hängt wie zuvor an D2.</p>`,
      `<p>An input with no fixed connection is <b>floating</b>: it picks up noise and returns random values. Try it and connect only the button between 3V3 and D4 at first: the LED flickers.</p><p>A 10 kΩ pull-down resistor between D4 and GND holds the pin safely at LOW while the button is open. The LED sits on D2 as before.</p>`],
    tray: ['resistor', 'led', 'btn', 'meter'], sketch: 'button', sketchLock: 1,
    build: () => [mk('esp', 340, 180, { sketch: 'button' }), mk('btn', 180, 400), mk('resistor', 380, 460, { r: 10000 }), mk('resistor', 620, 400), mk('led', 820, 400)],
    goals: [[['Taster gedrückt: die LED leuchtet', 'Button pressed: the LED is lit'], (dt) => { const pr = by('btn').some(b => b.pressed); mem.p = pr && by('led').some(l => l.iA > .003) ? (mem.p || 0) + dt : 0; if (mem.p > .3) mem.pok = 1; return mem.pok; }],
      [['Losgelassen: die LED bleibt 1,5 s stabil aus', 'Released: the LED stays off steadily for 1.5 s'], (dt) => { const rel = by('btn').length && by('btn').every(b => !b.pressed); mem.r = rel && mem.pok && by('led').every(l => l.iA < 2e-4) ? (mem.r || 0) + dt : 0; if (mem.r > 1.5) mem.rok = 1; return mem.rok; }]],
    hints: [['3V3 → Taster → D4. Zusätzlich D4 → 10 kΩ → GND.', '3V3 → button → D4. In addition D4 → 10 kΩ → GND.'], ['Alternative ohne Widerstand: Taster zwischen D4 und GND, im Code INPUT_PULLUP und LOW wählen.', 'Alternative without a resistor: button between D4 and GND, and choose INPUT_PULLUP and LOW in the code.']] },
  { id: 'dimmer', ch: CH2, title: ['Analog lesen, per PWM dimmen', 'Read analog, dim with PWM'],
    text: [`<p>Der ADC an D34 wandelt 0 bis 3,3 V in Zahlen von 0 bis 4095. Ein Poti zwischen 3V3 und GND liefert am Schleifer genau so eine einstellbare Spannung.</p><p>Die LED wird per PWM gedimmt: der Pin schaltet sehr schnell ein und aus, das Verhältnis bestimmt die Helligkeit. Verbinde Poti und LED und dreh den Knopf von ganz links bis ganz rechts.</p>`,
      `<p>The ADC on D34 converts 0 to 3.3 V into numbers from 0 to 4095. A potentiometer between 3V3 and GND provides exactly such an adjustable voltage at its wiper.</p><p>The LED is dimmed with PWM: the pin switches on and off very quickly, and the ratio sets the brightness. Connect the pot and the LED, then turn the knob from fully left to fully right.</p>`],
    tray: ['resistor', 'led', 'pot', 'meter'], sketch: 'dimmer', sketchLock: 1,
    build: () => [mk('esp', 340, 180, { sketch: 'dimmer' }), mk('pot', 200, 400), mk('resistor', 540, 420), mk('led', 760, 420)],
    goals: [[['ADC-Wert unter 300 gesehen', 'ADC value below 300 seen'], () => { const e = by('esp')[0]; if (e && e.adc < 300 && adcWired(e)) mem.lo = 1; return mem.lo; }],
      [['ADC-Wert über 3800 gesehen', 'ADC value above 3800 seen'], () => { const e = by('esp')[0]; if (e && e.adc > 3800 && adcWired(e)) mem.hi = 1; return mem.hi; }],
      [['Die LED folgt: einmal dunkel, einmal hell', 'The LED follows: dark once, bright once'], () => { const e = by('esp')[0]; if (!e) return 0; if (by('led').some(l => l.iA > .004) && e.adc > 3000) mem.b = 1; if (adcWired(e) && e.adc < 500 && by('led').length && by('led').every(l => l.iA < .001) && S.wires.some(w => by('led').some(l => w.a[0] === l.id || w.b[0] === l.id))) mem.d = 1; return mem.b && mem.d; }]],
    hints: [['Poti links → GND, Mitte → D34, rechts → 3V3. So steigt der Wert beim Drehen nach rechts.', 'Pot left → GND, middle → D34, right → 3V3. That way the value rises as you turn right.'], ['LED: D5 → Widerstand → LED-Plus, LED-Minus → GND.', 'LED: D5 → resistor → LED plus, LED minus → GND.']] },
  { id: 'labor', ch: CH3, title: ['Freies Labor', 'Free lab'],
    text: [`<p>Alle Bauteile, keine Aufgabe. Bau, was du willst, und probiere aus, was passiert: Kurzschluss am Netzteil, 9 V an 47 Ω, LED verkehrt herum.</p><p>Für den ESP32 wählst du den Sketch über dem Code aus.</p>`,
      `<p>Every part, no task. Build whatever you like and see what happens: a short across the supply, 9 V on 47 Ω, an LED in backwards.</p><p>For the ESP32, pick the sketch above the code.</p>`],
    tray: ALL, build: () => [mk('psu', 180, 200), mk('esp', 620, 200)], goals: [], hints: [] }
];

function loadLevel(i, keepDone) {
  levelIdx = i; level = LEVELS[i]; store.level = i; save();
  nextId = 1; S.comps = level.build(); S.wires = []; S.topo = true; S.t = 0; undo = []; mem = {}; doneHold = 0; completed = false; hintN = 0; wcI = 0;
  renderAll(); renderLesson(); renderNav(); resetView();
}
function renderNav() {
  let h = '', ch = null;
  LEVELS.forEach((l, i) => {
    if (l.ch !== ch) { if (ch) h += '</ol>'; ch = l.ch; h += (l.id === 'labor' ? '' : `<h2>${tr(ch)}</h2>`) + '<ol>'; }
    h += `<li><button type="button" data-i="${i}" title="${tr(l.title)}" class="${i === levelIdx ? 'cur' : ''}${store.done[l.id] ? ' done' : ''}"><span class="n">${l.id === 'labor' ? '∞' : i + 1}</span><span>${tr(l.title)}</span>${store.done[l.id] ? `<svg class="ck" viewBox="0 0 16 16" aria-label="${L('geschafft', 'done')}"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>` : ''}</button></li>`;
  });
  $('#nav').innerHTML = h + '</ol>';
  const n = LEVELS.filter(l => store.done[l.id]).length; $('#progress').textContent = L(`${n} von ${LEVELS.length - 1} Lektionen geschafft`, `${n} of ${LEVELS.length - 1} lessons done`); $('#bar').style.width = n / (LEVELS.length - 1) * 100 + '%';
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { audio(); snd('toggle'); loadLevel(+b.dataset.i); } });
const chipTxt = n => L(`${n} von ${level.goals.length} Zielen`, `${n} of ${level.goals.length} goals`);
function renderLesson() {
  $('#lTitle').textContent = tr(level.title); $('#lText').innerHTML = tr(level.text);
  $('#goals').innerHTML = level.goals.map((g, i) => `<li id="g${i}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg><span>${tr(g[0])}</span></li>`).join('');
  $('#goalSec').hidden = !level.goals.length; $('#hints').innerHTML = ''; $('#hintBtn').hidden = !level.hints.length; $('#hintBtn').textContent = L('Tipp zeigen', 'Show a hint');
  $('#win').hidden = true;
  const ch = $('#goalChip'); ch.hidden = !level.goals.length; ch.textContent = chipTxt(0); ch.classList.remove('ok');
}
function showWin() {
  $('#win').hidden = false; $('#nextBtn').textContent = levelIdx + 1 < LEVELS.length - 1 ? L('Nächste Lektion', 'Next lesson') : L('Ins freie Labor', 'To the free lab');
  $('#goalChip').textContent = L('Geschafft', 'Done'); $('#goalChip').classList.add('ok');
}
function addHint(i) { const p = document.createElement('p'); p.textContent = tr(level.hints[i]); $('#hints').appendChild(p); $('#hintBtn').hidden = i + 1 >= level.hints.length; $('#hintBtn').textContent = L('Noch ein Tipp', 'Another hint'); }
/* Sprache wechseln: alles neu beschriften, Zustand der Lektion bleibt erhalten */
const STATIC = {
  title: ['Lötfrei Elektronik-Labor', 'Lötfrei electronics lab'], sub: ['Elektronik und ESP32 an der Werkbank lernen', 'Learn electronics and the ESP32 at the bench'],
  undo: ['Rückgängig', 'Undo'], kbdUndo: ['Strg Z', 'Ctrl Z'], reset: ['Lektion zurücksetzen', 'Reset lesson'], tray: ['Baukasten', 'Parts'],
  trayEmpty: ['Für diese Lektion liegt alles auf der Werkbank.', 'Everything for this lesson is already on the bench.'], done: ['Geschafft', 'Done'], sketch: ['Sketch auf dem ESP32', 'Sketch on the ESP32'],
  aNav: ['Lektionen', 'Lessons'], aBench: ['Werkbank', 'Workbench'], aIn: ['Vergrößern', 'Zoom in'], aOut: ['Verkleinern', 'Zoom out'], aFit: ['Ganze Werkbank zeigen', 'Show the whole bench'],
  aSk: ['Sketch auswählen', 'Choose sketch'], aSerial: ['Serieller Monitor', 'Serial monitor'], aLang: ['Sprache', 'Language']
};
let silent = false;
function applyLang() {
  document.documentElement.lang = LANG; document.title = tr(STATIC.title);
  document.querySelectorAll('[data-i]').forEach(e => { e.textContent = tr(STATIC[e.dataset.i]); });
  document.querySelectorAll('[data-ia]').forEach(e => { const t = tr(STATIC[e.dataset.ia]); e.setAttribute('aria-label', t); if (e.tagName === 'BUTTON') e.title = t; });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG));
  syncMute();
}
function setLang(l) {
  if (l === LANG) return; LANG = l; store.lang = l; save(); applyLang();
  const keep = sel, hn = hintN;
  renderAll(); if (keep && (keep.c ? S.comps.includes(keep.c) : S.wires.includes(keep.w))) select(keep);
  renderLesson(); for (let i = 0; i < hn; i++) addHint(i);
  if (completed) { level.goals.forEach((g, i) => $('#g' + i).classList.add('ok')); showWin(); } else silent = true;
  renderNav(); snd('toggle');
}
document.querySelector('.lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { audio(); setLang(b.dataset.lang); } });
$('#hintBtn').addEventListener('click', () => { if (hintN < level.hints.length) { addHint(hintN++); snd('tick'); } });
$('#nextBtn').addEventListener('click', () => { snd('toggle'); loadLevel(Math.min(levelIdx + 1, LEVELS.length - 1)); });
$('#resetBtn').addEventListener('click', () => { snd('del'); loadLevel(levelIdx); toast(L('Lektion zurückgesetzt.', 'Lesson reset.')); });
$('#undoBtn').addEventListener('click', doUndo);
const muteBtn = $('#muteBtn'); function syncMute() { muteBtn.setAttribute('aria-pressed', !store.mute); const t = store.mute ? L('Ton aus', 'Sound off') : L('Ton an', 'Sound on'); muteBtn.querySelector('span').textContent = t; muteBtn.title = t; muteBtn.querySelector('path').setAttribute('d', 'M2.5 6v4H5l3.5 3V3L5 6z' + (store.mute ? 'M11 6l4 4M15 6l-4 4' : 'M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9')); }
muteBtn.addEventListener('click', () => { store.mute = !store.mute; save(); syncMute(); snd('goal'); });

function checkGoals(dt) {
  if (!level.goals.length || completed) return;
  let all = true, n = 0;
  level.goals.forEach((g, i) => { const ok = !!g[1](dt), el = $('#g' + i); if (ok && !el.classList.contains('ok') && !silent) snd('goal'); el.classList.toggle('ok', ok); if (ok) n++; else all = false; });
  $('#goalChip').textContent = chipTxt(n); silent = false;
  doneHold = all ? doneHold + dt : 0;
  if (doneHold > 0.6) { completed = true; store.done[level.id] = true; save(); renderNav(); showWin(); snd('win'); $('#win').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}

/* ---------- Bildschleife ---------- */
let last = 0, fr = 0;
function frame(ts) {
  const dtR = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; fr++;
  const esp = S.comps.find(c => c.type === 'esp');
  for (let k = 0; k < 8; k++) {
    if (esp) runSketch(esp);
    simStep(S, dtR / 8);
    for (const c of S.comps) if (c.ev === 'burn') { rerender(c); smoke(c.x, c.y); snd('burn'); toast(c.type === 'led' ? L('Die LED ist durchgebrannt: zu viel Strom.', 'The LED burnt out: too much current.') : L('Der Widerstand ist durchgebrannt: über 1 W an einem 0,25-W-Bauteil.', 'The resistor burnt out: more than 1 W on a 0.25 W part.'), 'bad'); if (sel && sel.c === c) renderInspector(); }
  }
  for (const c of S.comps) {
    const q = s => c.el.querySelector(s);
    if (c.type === 'led' && !c.p.burnt) { const b = clamp(c.iA / 0.02, 0, 1.3) ** 0.6; q('.glow').setAttribute('opacity', Math.min(1, b)); q('.lens').setAttribute('opacity', .35 + .65 * Math.min(1, b)); }
    else if (c.type === 'psu') {
      q('.dv').textContent = c.p.on ? fmtV(c.cc ? c.u : c.p.v) : L('aus', 'off'); q('.da').textContent = de(Math.max(0, c.iA), 3) + ' A';
      q('.cv').classList.toggle('act', c.p.on && !c.cc); q('.ccm').classList.toggle('act', c.p.on && !!c.cc); q('.pled').setAttribute('fill', c.p.on ? '#3ee06a' : '#4a545b');
    } else if (c.type === 'meter') q('.lcd').textContent = c.p.mode === 'V' ? fmtV(c.valA || 0) : fmtI(Math.abs(c.valA) < 5e-6 ? 0 : c.valA);
    else if (c.type === 'esp') { const P = c.pins[2]; c.ob = (c.ob || 0) + .3 * ((P && P.hi && P.mode !== 'in' ? 1 : 0) - (c.ob || 0)); q('.obled').setAttribute('opacity', c.ob); }
    else if (c.type === 'resistor' && !c.p.burnt) q('.rbody').classList.toggle('hot', c.pw > 0.25);
  }
  for (const w of S.wires) {
    const f = w.el.lastChild, i = w.iA || 0, m = Math.abs(i);
    if (m < 5e-5) { f.style.opacity = 0; continue; }
    w.off = (w.off || 0) - Math.sign(i) * dtR * (14 + 70 * Math.min(1, Math.sqrt(m / 0.02)));
    f.style.opacity = .35 + .5 * Math.min(1, m / 0.01); f.setAttribute('stroke-dashoffset', w.off);
  }
  if (fr % 6 === 0) {
    if (sel) { const o = sel.c || sel.w, set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
      set('#ro-i', fmtI(sel.w ? Math.abs(o.iA || 0) : (o.iA || 0)));
      if (sel.c) { set('#ro-v', fmtV(o.u || 0)); set('#ro-p', fmtP(Math.abs((o.u || 0) * (o.iA || 0)))); } }
    if (esp) {
      let h = ''; for (const k of [2, 4, 5, 18, 34]) { const P = esp.pins[k]; h += `<tr><td>D${k}</td><td>${!P ? '–' : P.mode === 'out' ? 'OUTPUT' : P.mode === 'pwm' ? 'PWM ' + Math.round(P.duty * 100) + ' %' : P.mode === 'in_pullup' ? 'INPUT_PULLUP' : k === 34 && esp.p.sketch === 'dimmer' ? 'ADC ' + esp.adc : 'INPUT'}</td><td class="num">${fmtV(esp.pv ? esp.pv[k] || 0 : 0)}</td></tr>`; }
      $('#pins').innerHTML = h; $('#serial').textContent = esp.serial && esp.serial.length ? esp.serial.join('\n') : L('Keine Ausgabe', 'No output');
    }
    let st = L('Simulation läuft', 'Simulation running'), cls = '';
    if (S.comps.some(c => c.p.burnt)) { st = L('Ein Bauteil ist durchgebrannt. Anklicken und ersetzen.', 'A part has burnt out. Select it and replace it.'); cls = 'bad'; }
    else if (esp && esp.short) { st = L('Kurzschluss an 3V3: der ESP32 würde jetzt neu starten.', 'Short on 3V3: the ESP32 would reset now.'); cls = 'bad'; }
    else if (esp && esp.overload) { st = L('Ein GPIO liefert über 40 mA: das zerstört auf Dauer den Pin.', 'A GPIO is sourcing over 40 mA: that damages the pin over time.'); cls = 'bad'; }
    else if (S.comps.some(c => c.type === 'psu' && c.cc)) { st = L('Netzteil in Strombegrenzung (CC)', 'Supply is current limiting (CC)'); cls = 'warn'; }
    else if (S.comps.some(c => c.type === 'resistor' && c.pw > 0.25)) { st = L('Ein Widerstand wird heiß: mehr als 0,25 W.', 'A resistor is getting hot: more than 0.25 W.'); cls = 'warn'; }
    const se = $('#status'); se.textContent = st; se.className = cls;
  }
  checkGoals(dtR);
  requestAnimationFrame(frame);
}

$('#goalChip').addEventListener('click', () => $('#lesson').scrollIntoView({ behavior: 'smooth' }));
const zc = f => { const r = wrap.getBoundingClientRect(); zoomAt(f, r.left + r.width / 2, r.top + r.height / 2); snd('tick'); };
$('#zIn').addEventListener('click', () => zc(0.75)); $('#zOut').addEventListener('click', () => zc(1 / 0.75)); $('#zFit').addEventListener('click', () => { view.w = 1e9; applyView(); snd('tick'); });
applyLang(); fit(); new ResizeObserver(fit).observe(wrap);
loadLevel(clamp(store.level | 0, 0, LEVELS.length - 1));
requestAnimationFrame(frame);
