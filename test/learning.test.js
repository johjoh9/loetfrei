const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Learning = require('../js/learning.js');
const { simStep } = require('../js/sim.js');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const lessonIds = [...app.matchAll(/\{ id: '([^']+)', ch:/g)].map(m => m[1]);
for (const id of lessonIds.filter(id => id !== 'labor')) {
  assert.ok(Learning.has(id), `Missing learning material: ${id}`);
  for (const lang of ['de', 'en']) {
    const { svg, steps } = Learning.render(id, lang);
    assert.match(svg, /<path /);
    assert.ok((steps.match(/<li>/g) || []).length >= 3, `${id}/${lang}: incomplete solution`);
    assert.doesNotMatch(svg + steps, /undefined|NaN/);
  }
}
assert.equal(Learning.has('labor'), false);
// Check proposed resistor choices against the actual nonlinear simulator, including
// source/wire resistance. Rounded hand calculations must still meet lesson targets.
function series(voltage, resistance, color) {
  const comps = [{ id: 1, type: 'psu', p: {v: voltage, ilim: .5, on: true} },
    { id: 2, type: 'resistor', p: {r: resistance} },
    { id: 3, type: color ? 'led' : 'meter', p: color ? {color} : {mode: 'A'} }];
  const state = {t: 0, topo: true, comps, wires: [
    {a: [1, 0], b: [2, 0]}, {a: [2, 1], b: [3, 0]}, {a: [3, 1], b: [1, 1]}
  ]};
  for (let n = 0; n < 400; n++) simStep(state, .002);
  assert.ok(!comps.some(c => c.p.burnt), 'Reference must not burn components');
  return Math.abs(comps[2].iA || comps[2].valA);
}
for (const r of [450, 470]) {
  const i = series(9, r); assert.ok(i > .019 && i < .021, `Ohm example ${r} Ω: ${i} A`);
}
const blue = series(9, 330, 'blau'); assert.ok(blue >= .015 && blue <= .020);
const red = series(5, 220, 'rot'); assert.ok(red >= .005 && red <= .025);
console.log('PASS: all lesson references in DE/EN; resistor examples meet simulated lesson targets.');
