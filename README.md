# Lötfrei

Ein Elektronik-Labor im Browser: Schaltungen mit Maus oder Finger zusammenstecken und dabei die Grundlagen der Elektrotechnik und den Einstieg in den ESP32 lernen.

**Direkt ausprobieren: [johjoh9.github.io/loetfrei](https://johjoh9.github.io/loetfrei/)**

*English: Lötfrei is an electronics lab in the browser for learning circuit basics and the ESP32 without buying hardware. The app is available in German and English; switch with the DE/EN control in the top bar.*

## Warum es das gibt

Die Idee war, Elektronik und den ESP32 lernen zu können, ohne erst ein Dev-Kit, ein Steckbrett und eine Tüte Bauteile kaufen zu müssen. Und auch dann üben zu können, wenn man unterwegs ist und die Hardware zu Hause liegt.

Lötfrei ersetzt dafür die Werkbank: Netzteil, Widerstände, LEDs und ein ESP32 liegen im Browser bereit, und nichts geht wirklich kaputt, wenn man etwas falsch anschließt. Die LED brennt trotzdem durch, damit man es merkt.

## Was man damit machen kann

- **Schaltungen bauen:** Bauteile aus dem Baukasten auf die Werkbank ziehen und mit Kabeln verbinden. Es gibt Labornetzteil, Widerstand, LED, Schalter, Taster, Potentiometer, Kondensator, Multimeter und ein ESP32 DevKit.
- **Sehen, was passiert:** Die Schaltung wird laufend durchgerechnet. Spannung und Strom lassen sich am Netzteil einstellen und an jedem Bauteil messen, der Stromfluss ist in den Kabeln sichtbar.
- **Fehler machen:** Zu viel Strom zerstört LEDs und Widerstände, ein offener Eingang am ESP32 liefert zufällige Werte, ein Kurzschluss schickt das Netzteil in die Strombegrenzung.
- **Den ESP32 kennenlernen:** Drei Sketche (Blink, Taster einlesen, LED per Poti dimmen), bei denen sich Pins und Werte direkt im Code ändern lassen.
- **Schritt für Schritt lernen:** Zehn Lektionen vom ersten Stromkreis über das ohmsche Gesetz bis zu ADC und PWM, mit Zielen, die live abgehakt werden. Danach wartet ein freies Labor ohne Aufgabe.

Die Oberfläche gibt es auf Deutsch und Englisch, umschaltbar oben rechts. Beim ersten Besuch richtet sie sich nach der Browsersprache.

Die App läuft auch auf dem Smartphone: Mit zwei Fingern zoomen, mit einem Finger die Werkbank verschieben, Kabel durch Antippen zweier Anschlüsse ziehen.

## Selbst hosten oder weiterentwickeln

Lötfrei besteht nur aus HTML, CSS und JavaScript, ohne Build-Schritt, ohne Abhängigkeiten und ohne Anfragen an fremde Server. `index.html` im Browser öffnen genügt.

```
index.html          Seitengerüst und Werkbank
css/style.css       Gestaltung
js/sim.js           Schaltungssimulation
js/app.js           Bauteile, Bedienung, Ton, Sketche, Lektionen
test/sim.test.js    Rechenproben für die Simulation (node test/sim.test.js)
```

Neue Lektionen stehen im Array `LEVELS` in `js/app.js`. Ideen, Fehlerberichte und Pull Requests sind willkommen.

## Grenzen

Die ESP32-Sketche sind feste Programme mit einstellbaren Werten, frei geschriebener Code wird nicht ausgeführt. Die Simulation ist auf Gleichstrom und langsame Vorgänge ausgelegt und ersetzt kein Datenblatt.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
