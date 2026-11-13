/* Reference circuits and worked examples. Deliberately independent of live simulation:
   values below describe the lesson example, not a measurement of the user's wiring. */
const Learning = (() => {
  const pick = (v, lang) => Array.isArray(v) ? v[lang === 'en' ? 1 : 0] : v;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const examples = {
    kreis: [
      ['Gegeben: 5 V, 220 Ω und eine rote LED mit ungefähr 1,9 V Durchlassspannung.', 'Given: 5 V, 220 Ω and a red LED with an approximate forward voltage of 1.9 V.'],
      ['Am Widerstand bleiben U_R = 5 V − 1,9 V = 3,1 V.', 'The resistor drops V_R = 5 V − 1.9 V = 3.1 V.'],
      ['I = U_R / R = 3,1 V / 220 Ω ≈ 0,0141 A = 14,1 mA. Das liegt im Zielbereich.', 'I = V_R / R = 3.1 V / 220 Ω ≈ 0.0141 A = 14.1 mA. This is within the target range.']
    ],
    ohm: [
      ['Gegeben: U = 9 V; gesucht: R für I = 20 mA. Erst umrechnen: 20 mA = 0,020 A.', 'Given: V = 9 V; find R for I = 20 mA. Convert first: 20 mA = 0.020 A.'],
      ['I = U / R nach R umstellen: R = U / I.', 'Rearrange I = V / R to find R: R = V / I.'],
      ['Einsetzen: R = 9 V / 0,020 A = 450 Ω.', 'Substitute: R = 9 V / 0.020 A = 450 Ω.'],
      ['450 Ω direkt eingeben oder 470 Ω wählen: I = 9 / 470 A ≈ 19,1 mA. Beides erfüllt das Ziel (19–21 mA).', 'Enter 450 Ω directly or choose 470 Ω: I = 9 / 470 A ≈ 19.1 mA. Both meet the target (19–21 mA).'],
      ['Belastung prüfen: P = U · I = 9 V · 0,020 A = 0,18 W, unter 0,25 W.', 'Check power: P = V · I = 9 V · 0.020 A = 0.18 W, below 0.25 W.']
    ],
    vorw: [
      ['Gegeben: 9 V Versorgung, blaue LED mit ungefähr 3 V; Zielstrom: 18 mA = 0,018 A.', 'Given: 9 V supply, blue LED at approximately 3 V; target current: 18 mA = 0.018 A.'],
      ['Die LED nimmt etwa 3 V auf. Am Widerstand bleiben U_R = 9 − 3 = 6 V.', 'The LED drops about 3 V. The resistor must drop V_R = 9 − 3 = 6 V.'],
      ['R = U_R / I = 6 V / 0,018 A ≈ 333 Ω. Normwert: 330 Ω.', 'R = V_R / I = 6 V / 0.018 A ≈ 333 Ω. Standard value: 330 Ω.'],
      ['Kontrolle: I ≈ 6 / 330 A = 18,2 mA; P_R ≈ 6² / 330 W = 0,109 W. Erst 330 Ω einstellen, dann verbinden.', 'Check: I ≈ 6 / 330 A = 18.2 mA; P_R ≈ 6² / 330 W = 0.109 W. Set 330 Ω before connecting.']
    ],
    teiler: [
      ['Gegeben: U = 5 V, U₂ = 3,3 V. Wähle R₁ = 1 kΩ. Das Multimeter misst parallel zu R₂.', 'Given: V = 5 V, V₂ = 3.3 V. Choose R₁ = 1 kΩ. The voltmeter measures across R₂.'],
      ['U₂ = U · R₂ / (R₁ + R₂). Umstellen: R₂ = U₂ · R₁ / (U − U₂).', 'V₂ = V · R₂ / (R₁ + R₂). Rearrange: R₂ = V₂ · R₁ / (V − V₂).'],
      ['R₂ = 3,3 · 1000 / (5 − 3,3) Ω ≈ 1941 Ω. Mit 2 kΩ ergibt sich U₂ ≈ 3,33 V.', 'R₂ = 3.3 · 1000 / (5 − 3.3) Ω ≈ 1941 Ω. With 2 kΩ, V₂ ≈ 3.33 V.'],
      ['Kontrolle: I = 5 V / 3000 Ω ≈ 1,67 mA. 3,33 V erfüllt die Übung; für echte GPIOs Grenzwerte und Toleranzen beachten. Die Formel gilt unbelastet.', 'Check: I = 5 V / 3000 Ω ≈ 1.67 mA. 3.33 V meets this exercise; real GPIOs require checking limits and tolerances. This formula assumes no load.']
    ],
    parallel: [
      ['Beispiel: 5 V, je 220 Ω; rote LED etwa 1,9 V, grüne etwa 2,2 V.', 'Example: 5 V, 220 Ω per branch; red LED about 1.9 V, green about 2.2 V.'],
      ['Roter Zweig: I₁ ≈ (5 − 1,9) / 220 A = 14,1 mA.', 'Red branch: I₁ ≈ (5 − 1.9) / 220 A = 14.1 mA.'],
      ['Grüner Zweig: I₂ ≈ (5 − 2,2) / 220 A = 12,7 mA.', 'Green branch: I₂ ≈ (5 − 2.2) / 220 A = 12.7 mA.'],
      ['Gesamt: I = I₁ + I₂ ≈ 26,8 mA. Jeder Zweig braucht seinen eigenen Vorwiderstand.', 'Total: I = I₁ + I₂ ≈ 26.8 mA. Each branch needs its own series resistor.']
    ],
    cc: [
      ['Zuerst bei ausgeschaltetem Ausgang I_max = 20 mA = 0,020 A einstellen.', 'First set I_max = 20 mA = 0.020 A with the output off.'],
      ['Im CC-Modus begrenzt das Netzteil den Strom und senkt seine Ausgangsspannung auf ungefähr die LED-Spannung: 1,9 V.', 'In CC mode the supply limits current and reduces its output voltage to approximately the LED voltage: 1.9 V.'],
      ['LED-Leistung: P ≈ U_LED · I = 1,9 V · 0,020 A = 0,038 W = 38 mW. Ohne aktive Strombegrenzung braucht die LED einen Vorwiderstand.', 'LED power: P ≈ V_LED · I = 1.9 V · 0.020 A = 0.038 W = 38 mW. Without active current limiting the LED needs a series resistor.']
    ],
    rc: [
      ['Gegeben: R = 470 Ω, C = 2200 µF = 0,0022 F.', 'Given: R = 470 Ω, C = 2200 µF = 0.0022 F.'],
      ['Zeitkonstante: τ = R · C = 470 · 0,0022 s = 1,034 s.', 'Time constant: τ = R · C = 470 · 0.0022 s = 1.034 s.'],
      ['Anfangsstrom der LED näherungsweise: I₀ = (5 − 1,9) / 470 A ≈ 6,6 mA.', 'Approximate initial LED current: I₀ = (5 − 1.9) / 470 A ≈ 6.6 mA.'],
      ['Nach einer Zeitkonstante fällt der Strom im vereinfachten Modell auf etwa 37 %: rund 2,4 mA. τ ist nicht die Nachleuchtdauer; die hängt auch von LED-Kennlinie und Helligkeitsschwelle ab.', 'After one time constant the simplified model predicts about 37% of the initial current: roughly 2.4 mA. τ is not the glow duration; that also depends on the LED curve and brightness threshold.']
    ],
    blink: [
      ['Bei HIGH: U = 3,3 V, rote LED ungefähr 1,9 V, R = 220 Ω.', 'At HIGH: V = 3.3 V, red LED approximately 1.9 V, R = 220 Ω.'],
      ['I ≈ (3,3 − 1,9) / 220 A = 6,4 mA. Bei LOW fließt praktisch kein LED-Strom.', 'I ≈ (3.3 − 1.9) / 220 A = 6.4 mA. At LOW virtually no LED current flows.'],
      ['Bei gleichen Ein- und Auszeiten gilt T = 2 · Pause und f = 1 / T. Beispiel: 500 ms je Phase → T = 1 s → f = 1 Hz.', 'For equal on/off times, T = 2 · delay and f = 1 / T. Example: 500 ms per phase → T = 1 s → f = 1 Hz.']
    ],
    taster: [
      ['Der Pull-down hat 10 kΩ = 10 000 Ω. Bei gedrücktem Taster liegen 3,3 V daran.', 'The pull-down is 10 kΩ = 10,000 Ω. Pressing the button applies 3.3 V across it.'],
      ['I = 3,3 V / 10 000 Ω = 0,00033 A = 0,33 mA.', 'I = 3.3 V / 10,000 Ω = 0.00033 A = 0.33 mA.'],
      ['Losgelassen zieht der Widerstand D4 auf 0 V. Der LED-Zweig an D2 hat separat 220 Ω: I_LED ≈ (3,3 − 1,9) / 220 A = 6,4 mA.', 'When released, the resistor pulls D4 to 0 V. The LED branch on D2 has a separate 220 Ω resistor: I_LED ≈ (3.3 − 1.9) / 220 A = 6.4 mA.']
    ],
    dimmer: [
      ['Poti in Mittelstellung: U_ADC ≈ 3,3 V · 0,5 = 1,65 V.', 'Pot at midpoint: V_ADC ≈ 3.3 V · 0.5 = 1.65 V.'],
      ['ADC ≈ U_ADC / 3,3 V · 4095 ≈ 2048 (gerundet).', 'ADC ≈ V_ADC / 3.3 V · 4095 ≈ 2048 (rounded).'],
      ['Tastgrad D ≈ 2048 / 4095 ≈ 50 %. Mittlere Pinspannung: U_mittel = D · 3,3 V ≈ 1,65 V. Während jedes Pulses liegen weiterhin 3,3 V an.', 'Duty cycle D ≈ 2048 / 4095 ≈ 50%. Mean pin voltage: V_mean = D · 3.3 V ≈ 1.65 V. Each on-pulse still reaches 3.3 V.']
    ],
    pwm: [
      ['Tastgrad D = t_ein / T. Beispiel: 5 ms ein bei 20 ms Periodendauer → D = 25 %.', 'Duty cycle D = t_on / T. Example: 5 ms on in a 20 ms period → D = 25%.'],
      ['Mittlere Spannung: U_mittel = D · 3,3 V = 0,25 · 3,3 V = 0,825 V.', 'Mean voltage: V_mean = D · 3.3 V = 0.25 · 3.3 V = 0.825 V.'],
      ['Bei 75 %: U_mittel = 2,475 V. Die Pulshöhe bleibt 3,3 V; nur die Breite ändert sich. Das Beispiel ist keine Messung deiner aktuellen Einstellung.', 'At 75%: V_mean = 2.475 V. Pulse height stays at 3.3 V; only width changes. This example is not a measurement of your current setting.']
    ],
    transistor: [
      ['Beispiel: HIGH = 3,3 V, Basiswiderstand 1 kΩ, Basis-Emitter-Spannung ungefähr 0,7 V.', 'Example: HIGH = 3.3 V, base resistor 1 kΩ, base-emitter voltage approximately 0.7 V.'],
      ['Basisstrom: I_B ≈ (3,3 − 0,7) / 1000 A = 2,6 mA. Damit bleibt der GPIO unter dem Übungsziel von 10 mA.', 'Base current: I_B ≈ (3.3 − 0.7) / 1000 A = 2.6 mA. This keeps the GPIO below the exercise target of 10 mA.'],
      ['Der Motorstrom kommt aus dem 5-V-Netzteil. Bei etwa 200 mA gilt P ≈ 5 V · 0,2 A = 1 W. Für echte Hardware Transistor, Sättigung und Freilaufdiode passend auslegen.', 'Motor current comes from the 5 V supply. At about 200 mA, P ≈ 5 V · 0.2 A = 1 W. Real hardware needs a suitable transistor, saturation design and flyback diode.']
    ]
  };

  // Symbols use horizontal terminals at x ± 40. Wires are explicit, dots are junctions.
  const path = d => `<path d="${d}"/>`;
  const text = (x, y, s, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${escape(s)}</text>`;
  const dot = (x, y) => `<circle class="junction" cx="${x}" cy="${y}" r="4"/>`;
  function symbol(kind, x, y, label) {
    const shapes = {
      resistor: '<path d="M-40 0H-24M24 0H40"/><rect x="-24" y="-9" width="48" height="18"/>',
      led: '<path d="M-40 0H-13M13 0H40M-13 -14L13 0 -13 14ZM13 -14V14M0 -22l13 -13m-6 0h6v6M15 -18l13 -13m-6 0h6v6"/>',
      sw: '<path d="M-40 0H-18L15 -18M18 0H40"/><circle cx="18" cy="0" r="2"/>',
      cap: '<path d="M-40 0H-5M-5 -18V18M5 -18V18M5 0H40"/>',
      meter: '<path d="M-40 0H-19M19 0H40"/><circle r="19"/>' + text(0, 5, label),
      motor: '<path d="M-40 0H-19M19 0H40"/><circle r="19"/>' + text(0, 5, 'M')
    };
    return `<g transform="translate(${x} ${y})">${shapes[kind]}${kind === 'meter' ? '' : text(0, 43, label)}</g>`;
  }
  const terminal = (x, y, label) => `<circle cx="${x}" cy="${y}" r="4"/>` + text(x, y - 15, label);
  function ledBranch(y, pin = 'D2', resistor = '220 Ω') {
    return terminal(80, y, pin) + path(`M84 ${y}H180M260 ${y}H380M460 ${y}H556`) + symbol('resistor', 220, y, resistor) + symbol('led', 420, y, 'LED  + → −') + terminal(560, y, 'GND');
  }
  function circuit(id, lang) {
    const t = (de, en) => lang === 'en' ? en : de;
    let body = '', height = 310;
    if (['kreis', 'ohm', 'vorw', 'cc'].includes(id)) {
      const cc = id === 'cc', ohm = id === 'ohm';
      body = terminal(80, 95, (id === 'kreis' || cc ? '5 V' : '9 V') + ' +') + terminal(80, 235, '−') + path('M84 95H180M460 95H560V235H84');
      if (cc) body += path('M180 95H380') + text(290, 200, t('Zuerst Stromlimit: 15–20 mA', 'Set current limit first: 15–20 mA'));
      else body += symbol('resistor', 220, 95, ohm ? '450 Ω / 470 Ω' : id === 'vorw' ? '330 Ω' : '220 Ω') + path('M260 95H380');
      body += symbol(ohm ? 'meter' : 'led', 420, 95, ohm ? 'A' : 'LED  + → −');
    } else if (id === 'teiler') {
      body = terminal(65, 80, '5 V +') + path('M69 80H180M260 80H360V175H380M460 175H560V260H69M360 175V95H470M550 95H560V175') + terminal(65, 260, '−') + symbol('resistor', 220, 80, 'R₁ = 1 kΩ') + symbol('resistor', 420, 175, 'R₂ = 2 kΩ') + symbol('meter', 510, 95, 'V') + dot(360, 95) + dot(560, 175) + text(445, 30, 'U₂ ≈ 3,33 V');
    } else if (id === 'parallel' || id === 'rc') {
      body = terminal(60, 65, '5 V +') + path('M64 65H100M180 65H230V115H280M360 115H440M520 115H570V270H64M230 115V215H280M520 215H570') + terminal(60, 270, '−') + symbol('sw', 140, 65, t('Schalter', 'Switch')) + symbol('resistor', 320, 115, id === 'rc' ? '470 Ω' : '220 Ω') + symbol('led', 480, 115, t('LED rot', 'Red LED')) + dot(230, 115) + dot(570, 215);
      if (id === 'rc') body += path('M280 215H350M430 215H520') + symbol('cap', 390, 215, '2200 µF  + → −');
      else body += symbol('resistor', 320, 215, '220 Ω') + path('M360 215H440') + symbol('led', 480, 215, t('LED grün', 'Green LED'));
    } else if (id === 'blink') {
      body = ledBranch(130) + text(320, 230, t('ESP32 über USB versorgt · Standardpin D2', 'ESP32 powered by USB · default pin D2'));
    } else if (id === 'taster') {
      height = 380;
      body = terminal(65, 70, '3V3') + path('M69 70H130M210 70H280V140H340M420 140H556M280 70H556') + symbol('sw', 170, 70, t('Taster', 'Button')) + terminal(560, 70, 'D4') + symbol('resistor', 380, 140, '10 kΩ') + terminal(560, 140, 'GND') + dot(280, 70) + ledBranch(270);
    } else if (id === 'dimmer' || id === 'pwm') {
      height = 390;
      body = terminal(65, 80, '3V3') + path('M69 80H280M360 80H556M320 160V89m-5 8 5 -8 5 8') + symbol('resistor', 320, 80, '') + terminal(560, 80, 'GND') + terminal(320, 160, '') + text(320, 190, 'D34 · ADC') + text(320, 35, t('Poti 10 kΩ · Schleifer → D34', '10 kΩ pot · wiper → D34')) + ledBranch(265, 'D5');
      if (id === 'pwm') body += text(320, 350, t('Oszilloskop: Rot → D5 · Schwarz → GND', 'Oscilloscope: red → D5 · black → GND'));
    } else if (id === 'transistor') {
      height = 370;
      body = terminal(70, 180, 'D2') + path('M74 180H140M220 180H330M330 155V205M330 167L375 140V80H420M500 80H556M330 193L375 220V290H84M375 290H556M362 204l13 16 -17 -5') + symbol('resistor', 180, 180, '1 kΩ') + symbol('motor', 460, 80, t('Motor', 'Motor')) + terminal(560, 80, '5 V +') + terminal(80, 290, 'ESP32 GND') + terminal(560, 290, t('Netzteil −', 'Supply −')) + dot(375, 290) + text(310, 165, 'B') + text(392, 140, 'C') + text(395, 225, 'E') + text(440, 180, 'NPN') + text(320, 345, t('Realer Motor: zusätzliche Freilaufdiode nötig.', 'Real motor: add a flyback diode.'));
    }
    return `<svg class="schematic" viewBox="0 0 640 ${height}" role="img" aria-label="${escape(t('Referenzschaltplan', 'Reference schematic'))}">${body}</svg>`;
  }
  function render(id, lang) {
    return { svg: circuit(id, lang), steps: (examples[id] || []).map(step => `<li>${escape(pick(step, lang))}</li>`).join('') };
  }
  return { render, has: id => Object.hasOwn(examples, id) };
})();
if (typeof module !== 'undefined') module.exports = Learning;
