/* ---------- Schaltungssimulation: Knotenanalyse mit Newton-Iteration ---------- */
const GMIN = 1e-10, RW = 0.05, RS = 0.01, NVT = 2 * 0.02585;
const VT = 0.02585, BJT_IS = 1e-14, BJT_BF = 200, BJT_BR = 2, MOTOR_R = 25, PWM_STEPS = 8;
const LED_TYPES = {
  rot:   { vf: 1.9, c: '#ff4a3d', n: 'Rot' },
  gelb:  { vf: 2.0, c: '#ffc531', n: 'Gelb' },
  gruen: { vf: 2.2, c: '#3ee06a', n: 'Grün' },
  blau:  { vf: 3.0, c: '#4a8dff', n: 'Blau' }
};
const TERMS = {
  psu: [[20, 20, '+'], [60, 20, '−']],
  resistor: [[-40, 0], [40, 0]],
  led: [[-40, 0, '+'], [40, 0, '−']],
  sw: [[-40, 0], [40, 0]],
  btn: [[-40, 0], [40, 0]],
  cap: [[-40, 0, '+'], [40, 0, '−']],
  meter: [[-20, 40, '+'], [20, 40, '−']],
  pot: [[-40, 40], [0, 40], [40, 40]],
  scope: [[-20, 40, '+'], [20, 40, '−']],
  npn: [[-40, 40, 'C'], [0, 40, 'B'], [40, 40, 'E']],
  motor: [[-40, 0, '+'], [40, 0, '−']],
  esp: [[-120, 40, '3V3'], [-80, 40, 'GND'], [-40, 40, 'D2'], [0, 40, 'D4'], [40, 40, 'D5'], [80, 40, 'D18'], [120, 40, 'D34']]
};
const ESP_PIN = { 2: 2, 4: 3, 5: 4, 18: 5, 34: 6 };

function ledIs(vf) { return 0.02 / Math.exp(vf / NVT); }
function pnjlim(vnew, vold, vt, vcrit) {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
    if (vold > 0) { const a = 1 + (vnew - vold) / vt; vnew = a > 0 ? vold + vt * Math.log(a) : vcrit; }
    else vnew = vt * Math.log(vnew / vt);
  }
  return vnew;
}
function solveLin(A, b, n, x) {
  for (let k = 0; k < n; k++) {
    let p = k, m = Math.abs(A[k * n + k]);
    for (let i = k + 1; i < n; i++) { const a = Math.abs(A[i * n + k]); if (a > m) { m = a; p = i; } }
    if (p !== k) {
      for (let j = k; j < n; j++) { const t = A[k * n + j]; A[k * n + j] = A[p * n + j]; A[p * n + j] = t; }
      const t = b[k]; b[k] = b[p]; b[p] = t;
    }
    const d = A[k * n + k] || 1e-30;
    for (let i = k + 1; i < n; i++) {
      const f = A[i * n + k] / d; if (f === 0) continue;
      for (let j = k + 1; j < n; j++) A[i * n + j] -= f * A[k * n + j];
      b[i] -= f * b[k];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i * n + j] * x[j];
    x[i] = s / (A[i * n + i] || 1e-30);
  }
}
function simAssign(S) {
  let n = 0;
  S.byId = new Map();
  for (const c of S.comps) { c.n = TERMS[c.type].map(() => n++); S.byId.set(c.id, c); }
  S.n = n; S.A = new Float64Array(n * n); S.b = new Float64Array(n); S.x = new Float64Array(n); S.v = new Float64Array(n);
  S.topo = false;
}
function simStep(S, dt) {
  if (S.topo || !S.v) simAssign(S);
  S.t += dt; S.k = ((S.k | 0) + 1) % PWM_STEPS;
  const n = S.n; if (!n) return;
  const A = S.A, b = S.b, x = S.x, v = S.v;
  const G = (a, c, g) => { A[a * n + a] += g; A[c * n + c] += g; A[a * n + c] -= g; A[c * n + a] -= g; };
  const I = (a, c, i) => { b[a] -= i; b[c] += i; };           // Strom i fließt im Bauteil von a nach c
  const VC = (a, c, p, q, g) => { A[a * n + p] += g; A[a * n + q] -= g; A[c * n + p] -= g; A[c * n + q] += g; };   // Strom g·(Up − Uq) von a nach c

  for (const c of S.comps) if (c.type === 'esp') {
    c.nt = (c.nt || 0) - dt; if (c.nt <= 0) { c.nt = 0.04; c.vn = Math.random() * 3.3; }
    /* PWM: eine Periode dauert PWM_STEPS Rechenschritte; der Rest der Rundung wandert in die nächste Periode */
    for (const k in c.pins) {
      const P = c.pins[k]; if (P.mode !== 'pwm') continue;
      if (S.k === 0 || P.n == null) { const f = P.duty * PWM_STEPS + (P.car || 0); P.n = Math.floor(f + 1e-9); P.car = f - P.n; }
      P.hi = S.k < P.n ? 1 : 0;
    }
  }
  const wn = [];
  for (const w of S.wires) {
    const ca = S.byId.get(w.a[0]), cb = S.byId.get(w.b[0]);
    if (ca && cb) wn.push(w, ca.n[w.a[1]], cb.n[w.b[1]]);
  }

  for (let pass = 0; pass < 4; pass++) {
    let conv = false;
    for (let it = 0; it < 80 && !conv; it++) {
      A.fill(0); b.fill(0);
      for (let i = 0; i < n; i++) A[i * n + i] = GMIN;
      for (let i = 0; i < wn.length; i += 3) G(wn[i + 1], wn[i + 2], 1 / RW);
      for (const c of S.comps) {
        const N = c.n, p = c.p;
        switch (c.type) {
          case 'resistor': if (!p.burnt) G(N[0], N[1], 1 / p.r); break;
          case 'sw': if (p.closed) G(N[0], N[1], 100); break;
          case 'btn': if (c.pressed) G(N[0], N[1], 100); break;
          case 'meter': G(N[0], N[1], p.mode === 'V' ? 1e-7 : 1 / RW); break;
          case 'scope': G(N[0], N[1], 1e-7); break;
          case 'motor': G(N[0], N[1], 1 / MOTOR_R); break;
          case 'npn': {
            /* Ebers-Moll: Dioden B-E und B-C, dazu der gesteuerte Strom von C nach E */
            if (p.burnt) break;
            const vbe = c.vbe || 0, vbc = c.vbc || 0, ebe = Math.exp(vbe / VT), ebc = Math.exp(vbc / VT);
            const gbe = BJT_IS / BJT_BF / VT * ebe + 1e-9, gbc = BJT_IS / BJT_BR / VT * ebc + 1e-9;
            G(N[1], N[2], gbe); I(N[1], N[2], BJT_IS / BJT_BF * (ebe - 1) - gbe * vbe);
            G(N[1], N[0], gbc); I(N[1], N[0], BJT_IS / BJT_BR * (ebc - 1) - gbc * vbc);
            const gmf = BJT_IS / VT * ebe, gmr = BJT_IS / VT * ebc;
            VC(N[0], N[2], N[1], N[2], gmf); VC(N[0], N[2], N[1], N[0], -gmr);
            I(N[0], N[2], BJT_IS * (ebe - ebc) - gmf * vbe + gmr * vbc);
            break;
          }
          case 'pot': G(N[0], N[1], 1 / (p.r * p.pos + 1)); G(N[1], N[2], 1 / (p.r * (1 - p.pos) + 1)); break;
          case 'cap': { const g = p.c / dt; G(N[0], N[1], g); I(N[0], N[1], -g * (c.vc || 0)); break; }
          case 'psu':
            if (!p.on) break;
            if (c.cc) { I(N[1], N[0], p.ilim); G(N[0], N[1], 1e-7); }
            else { G(N[0], N[1], 1 / RS); I(N[1], N[0], p.v / RS); }
            break;
          case 'led': {
            if (p.burnt) break;
            const is = ledIs(LED_TYPES[p.color].vf), vd = c.vd || 0, e = Math.exp(vd / NVT);
            const id = is * (e - 1), g = is * e / NVT + 1e-9;
            G(N[0], N[1], g); I(N[0], N[1], id - g * vd);
            break;
          }
          case 'esp': {
            const g0 = N[1];
            G(N[0], g0, 10); I(g0, N[0], 33);
            for (const k in c.pins) {
              const P = c.pins[k], t = N[ESP_PIN[k]];
              if (P.mode === 'out' || P.mode === 'pwm') { G(t, g0, 1 / 30); I(g0, t, (P.hi ? 3.3 : 0) / 30); }
              else if (P.mode === 'in') { G(t, g0, 1e-7); I(g0, t, (c.vn || 0) * 1e-7); }
              else if (P.mode === 'in_pullup') G(t, N[0], 1 / 45000);
            }
            break;
          }
        }
      }
      solveLin(A, b, n, x);
      conv = true;
      for (const c of S.comps) if (c.type === 'led' && !c.p.burnt) {
        const is = ledIs(LED_TYPES[c.p.color].vf), vcrit = NVT * Math.log(NVT / (1.414 * is));
        const old = c.vd || 0, vl = pnjlim(x[c.n[0]] - x[c.n[1]], old, NVT, vcrit);
        if (Math.abs(vl - old) > 1e-7) conv = false;
        c.vd = vl;
      }
      for (const c of S.comps) if (c.type === 'npn' && !c.p.burnt) {
        const N = c.n, o1 = c.vbe || 0, o2 = c.vbc || 0;
        c.vbe = pnjlim(x[N[1]] - x[N[2]], o1, VT, VT * Math.log(VT / (1.414 * BJT_IS / BJT_BF)));
        c.vbc = pnjlim(x[N[1]] - x[N[0]], o2, VT, VT * Math.log(VT / (1.414 * BJT_IS / BJT_BR)));
        if (Math.abs(c.vbe - o1) > 1e-7 || Math.abs(c.vbc - o2) > 1e-7) conv = false;
      }
    }
    let flip = false;
    for (const c of S.comps) if (c.type === 'psu' && c.p.on) {
      const vt = x[c.n[0]] - x[c.n[1]];
      if (c.cc) { if (vt > c.p.v + 1e-6) { c.cc = false; flip = true; } }
      else if ((c.p.v - vt) / RS > c.p.ilim * 1.0005) { c.cc = true; flip = true; }
    }
    if (!flip) break;
  }
  v.set(x);

  const a = 1 - Math.exp(-dt / 0.06);
  const ema = (c, i) => { c.iA = (c.iA || 0) + a * (i - (c.iA || 0)); };
  for (let i = 0; i < wn.length; i += 3) { const w = wn[i]; w.i = (v[wn[i + 1]] - v[wn[i + 2]]) / RW; w.iA = (w.iA || 0) + a * (w.i - (w.iA || 0)); }
  for (const c of S.comps) {
    const N = c.n, p = c.p, u = v[N[0]] - v[N[1]];
    c.u = u; c.ev = null;
    switch (c.type) {
      case 'resistor':
        c.i = p.burnt ? 0 : u / p.r; c.pw = c.i * u;
        c.over = Math.max(0, (c.over || 0) + (c.pw > 1 ? dt : -dt));
        if (c.over > 0.4 && !p.burnt) { p.burnt = true; c.ev = 'burn'; }
        break;
      case 'led':
        c.i = p.burnt ? 0 : ledIs(LED_TYPES[p.color].vf) * (Math.exp((c.vd || 0) / NVT) - 1); c.pw = c.i * u;
        c.over = Math.max(0, (c.over || 0) + dt * (c.i > 0.06 ? 1 : c.i > 0.035 ? 0.1 : -1));
        if (c.over > 0.15 && !p.burnt) { p.burnt = true; c.ev = 'burn'; }
        break;
      case 'sw': c.i = p.closed ? u * 100 : 0; break;
      case 'btn': c.i = c.pressed ? u * 100 : 0; break;
      case 'meter': c.i = p.mode === 'V' ? 0 : u / RW; c.val = p.mode === 'V' ? u : c.i; c.valA = (c.valA || 0) + a * (c.val - (c.valA || 0)); break;
      case 'cap': c.i = p.c / dt * (u - (c.vc || 0)); c.vc = u; break;
      case 'scope': c.i = 0; break;
      case 'motor': c.i = u / MOTOR_R; c.pw = c.i * u; break;
      case 'npn': {
        c.u = v[N[0]] - v[N[2]];
        if (p.burnt) { c.i = 0; c.ib = 0; c.ibA = 0; break; }
        const ebe = Math.exp((c.vbe || 0) / VT), ebc = Math.exp((c.vbc || 0) / VT), ibc = BJT_IS / BJT_BR * (ebc - 1);
        c.i = BJT_IS * (ebe - ebc) - ibc; c.ib = BJT_IS / BJT_BF * (ebe - 1) + ibc; c.ibA = (c.ibA || 0) + a * (c.ib - (c.ibA || 0));
        c.pw = Math.abs(c.u * c.i) + Math.abs((v[N[1]] - v[N[2]]) * c.ib);
        c.over = Math.max(0, (c.over || 0) + (c.pw > 0.8 || Math.abs(c.ib) > 0.1 || Math.abs(c.i) > 1 ? dt : -dt));
        if (c.over > 0.3) { p.burnt = true; c.ev = 'burn'; }
        break;
      }
      case 'pot': c.i = u / (p.r * p.pos + 1); c.uw = v[N[1]] - v[N[2]]; break;
      case 'psu':
        if (!p.on) { c.i = 0; c.cc = false; } else c.i = c.cc ? p.ilim : (p.v - u) / RS;
        break;
      case 'esp': {
        const g0 = v[N[1]];
        c.i = (3.3 - u) / 0.1; c.short = c.i > 0.8; c.overload = false; c.pv = c.pv || {};
        for (const k in ESP_PIN) {
          const pv = v[N[ESP_PIN[k]]] - g0, P = c.pins[k]; c.pv[k] = pv;
          if (P && (P.mode === 'out' || P.mode === 'pwm')) { P.i = ((P.hi ? 3.3 : 0) - pv) / 30; if (Math.abs(P.i) > 0.04) c.overload = true; }
        }
        break;
      }
    }
    ema(c, c.i || 0);
  }
}
if (typeof module !== 'undefined') module.exports = { simStep, LED_TYPES, TERMS };
