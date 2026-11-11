const { simStep } = require('../js/sim.js');
const mk = (id, type, p) => ({ id, type, p });
function run(S, steps = 400, dt = 0.002) { for (let i = 0; i < steps; i++) simStep(S, dt); }
// 1: 5V - 220R - red LED
let S = { t: 0, topo: true, comps: [mk(1, 'psu', { v: 5, ilim: 0.5, on: true }), mk(2, 'resistor', { r: 220 }), mk(3, 'led', { color: 'rot' })],
  wires: [{ a: [1, 0], b: [2, 0] }, { a: [2, 1], b: [3, 0] }, { a: [3, 1], b: [1, 1] }] };
run(S); console.log('LED mA', (S.comps[2].i * 1e3).toFixed(3), 'wire mA', S.wires.map(w => (w.i * 1e3).toFixed(3)), 'psu', (S.comps[0].i * 1e3).toFixed(3), 'vd', S.comps[2].vd.toFixed(3));
// 2: CC: LED direct at 20mA limit
S = { t: 0, topo: true, comps: [mk(1, 'psu', { v: 5, ilim: 0.02, on: true }), mk(3, 'led', { color: 'rot' })], wires: [{ a: [1, 0], b: [3, 0] }, { a: [3, 1], b: [1, 1] }] };
run(S); console.log('CC', S.comps[0].cc, 'LED mA', (S.comps[1].i * 1e3).toFixed(2), 'burnt', S.comps[1].p.burnt, 'u', S.comps[0].u.toFixed(3));
// 3: direct, 0.5A -> burn
S = { t: 0, topo: true, comps: [mk(1, 'psu', { v: 5, ilim: 0.5, on: true }), mk(3, 'led', { color: 'rot' })], wires: [{ a: [1, 0], b: [3, 0] }, { a: [3, 1], b: [1, 1] }] };
run(S); console.log('burnt', S.comps[1].p.burnt, 'psu i', S.comps[0].i);
// 4: divider 5V 1k/2k, meter V over R2
S = { t: 0, topo: true, comps: [mk(1, 'psu', { v: 5, ilim: 0.5, on: true }), mk(2, 'resistor', { r: 1000 }), mk(3, 'resistor', { r: 2000 }), mk(4, 'meter', { mode: 'V' })],
  wires: [{ a: [1, 0], b: [2, 0] }, { a: [2, 1], b: [3, 0] }, { a: [3, 1], b: [1, 1] }, { a: [4, 0], b: [3, 0] }, { a: [4, 1], b: [3, 1] }] };
run(S); console.log('divider V', S.comps[3].valA.toFixed(4));
// 5: RC: 5V, sw, cap 2200u, 470R + LED
S = { t: 0, topo: true, comps: [mk(1, 'psu', { v: 5, ilim: 0.5, on: true }), mk(2, 'sw', { closed: true }), mk(3, 'cap', { c: 2200e-6 }), mk(4, 'resistor', { r: 470 }), mk(5, 'led', { color: 'rot' })],
  wires: [{ a: [1, 0], b: [2, 0] }, { a: [2, 1], b: [3, 0] }, { a: [3, 1], b: [1, 1] }, { a: [3, 0], b: [4, 0] }, { a: [4, 1], b: [5, 0] }, { a: [5, 1], b: [1, 1] }] };
run(S, 500); console.log('cap V', S.comps[2].vc.toFixed(3), 'led', (S.comps[4].i * 1e3).toFixed(2));
S.comps[1].p.closed = false; let t = 0; while (S.comps[4].i > 0.0003 && t < 20) { simStep(S, 0.002); t += 0.002; } console.log('afterglow s', t.toFixed(2));
// 6: ESP out D2 -> 220 -> LED -> GND ; floating input D4 ; pulldown
const esp = mk(1, 'esp', {}); esp.pins = { 2: { mode: 'out', hi: 1 }, 4: { mode: 'in' } };
S = { t: 0, topo: true, comps: [esp, mk(2, 'resistor', { r: 220 }), mk(3, 'led', { color: 'rot' }), mk(4, 'btn', {}), mk(5, 'resistor', { r: 10000 })],
  wires: [{ a: [1, 2], b: [2, 0] }, { a: [2, 1], b: [3, 0] }, { a: [3, 1], b: [1, 1] }, { a: [1, 0], b: [4, 0] }, { a: [4, 1], b: [1, 3] }] };
let seen = []; for (let i = 0; i < 300; i++) { simStep(S, 0.002); if (i % 30 == 0) seen.push(esp.pv[4].toFixed(2)); }
console.log('esp LED mA', (S.comps[2].i * 1e3).toFixed(2), 'floating D4', seen.join(' '));
S.wires.push({ a: [5, 0], b: [1, 3] }, { a: [5, 1], b: [1, 1] }); run(S, 100); console.log('pulldown D4', esp.pv[4].toFixed(4));
S.comps[3].pressed = true; run(S, 50); console.log('pressed D4', esp.pv[4].toFixed(3));
esp.pins[2] = { mode: 'pwm', duty: 0.25 }; run(S, 500); console.log('pwm 25% avg mA', (S.comps[2].iA * 1e3).toFixed(2));
// perf
let t0 = Date.now(); run(S, 5000); console.log('ms/step', (Date.now() - t0) / 5000);
