# Lötfrei

Ein interaktives Elektronik-Labor im Browser. Du baust Schaltungen mit der Maus auf einer Werkbank zusammen und lernst dabei die Grundlagen der Elektrotechnik und den Einstieg in den ESP32.

Die App besteht nur aus HTML, CSS und JavaScript. Sie braucht keinen Server, keinen Build-Schritt und lädt nichts von fremden Servern nach.

## Was drin ist

- **Werkbank mit Baukasten:** Labornetzteil, Widerstand, LED, Schalter, Taster, Potentiometer, Kondensator, Multimeter, ESP32 DevKit.
- **Echte Schaltungssimulation:** Knotenanalyse mit Newton-Iteration und LED-Kennlinie. Das Netzteil regelt wie ein echtes zwischen Konstantspannung (CV) und Konstantstrom (CC). LEDs und Widerstände brennen bei Überlast durch, Kondensatoren laden und entladen sich in Echtzeit.
- **ESP32:** 3,3-V-Logik, GPIO-Ausgänge mit Innenwiderstand, offene Eingänge mit Störsignal, Pull-up, ADC und PWM. Drei Sketche (Blink, Taster, Poti-Dimmer) mit einstellbaren Pins und Werten.
- **Zehn Lektionen** mit live geprüften Zielen und Tipps, dazu ein freies Labor.
- **Ton und Effekte:** Klick- und Steckgeräusche, Funken, sichtbarer Stromfluss in den Kabeln.

## Bedienung

| Aktion | So geht's |
| --- | --- |
| Bauteil platzieren | Aus dem Baukasten auf die Matte ziehen oder anklicken |
| Kabel ziehen | Von Anschluss zu Anschluss ziehen, oder beide nacheinander anklicken |
| Bauteil einstellen | Anklicken, dann rechts im Inspektor |
| Drehen | `R` |
| Entfernen | `Entf`, Rechtsklick, oder Doppelklick auf ein Kabel |
| Rückgängig | `Strg Z` |

## Lokal starten

`index.html` im Browser öffnen. Wer lieber einen lokalen Server nutzt:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` aufrufen.

## Auf GitHub Pages veröffentlichen

1. Dieses Verzeichnis als öffentliches Repository hochladen.
2. Unter *Settings → Pages* als Quelle den Branch `main` und den Ordner `/ (root)` wählen.
3. Nach kurzer Zeit ist die App unter `https://<name>.github.io/<repository>/` erreichbar.

Jedes andere statische Hosting funktioniert genauso.

## Aufbau

```
index.html          Seitengerüst und SVG-Werkbank
css/style.css       Gestaltung, helles und dunkles Farbschema
js/sim.js           Schaltungssimulation, ohne Abhängigkeit vom Browser
js/app.js           Bauteil-Grafik, Bedienung, Ton, Sketche, Lektionen
test/sim.test.js    Rechenproben für die Simulation
```

### Tests

```sh
node test/sim.test.js
```

Das Skript rechnet einige Referenzschaltungen durch (LED mit Vorwiderstand, Strombegrenzung, Spannungsteiler, RC-Entladung, ESP32-Pins) und gibt die Werte aus.

### Eine Lektion hinzufügen

Lektionen stehen in `js/app.js` im Array `LEVELS`. Ein Eintrag enthält:

- `id`, `ch` (Kapitel), `title`, `text` (HTML)
- `tray`: Bauteiltypen im Baukasten
- `build()`: Bauteile, die zu Beginn auf der Werkbank liegen
- `goals`: Paare aus Beschreibung und Prüffunktion; die Lektion gilt als geschafft, wenn alle Funktionen gleichzeitig wahr liefern
- `hints`: Tipps in der Reihenfolge, in der sie erscheinen

### Ein Bauteil hinzufügen

1. In `js/sim.js` die Anschlüsse in `TERMS` eintragen und in `simStep` das elektrische Verhalten ergänzen.
2. In `js/app.js` Name, Erklärung, Größe, Standardwerte (`NAMES`, `INFO`, `BOX`, `DEF`) und die Zeichnung in `DRAW` ergänzen.
3. Bei Bedarf Regler in `renderInspector` hinzufügen.

## Grenzen

- Die ESP32-Sketche sind feste Programme mit einstellbaren Werten. Frei geschriebener Code wird nicht ausgeführt.
- Die Simulation rechnet Gleichstrom und langsame Vorgänge. PWM wird zeitlich gestreckt nachgebildet, die mittlere Helligkeit stimmt.
- Der Lernfortschritt liegt im `localStorage` des Browsers.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
