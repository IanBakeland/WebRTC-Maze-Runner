# WebRTC Maze Runner
**Bestuur een balletje door een doolhof met je smartphone.**

---

## 🎮 Het Concept: Maze Runner

### Het Doel
Jij bent een **groen balletje**. Verzamel alle witte muntjes in het doolhof.

### De Vijand
Een **rood balletje** (de "Ghost") beweegt automatisch door het doolhof. Als hij je raakt, ben je af.

### De Besturing
Je smartphone is de controller. Kantel je telefoon naar links → het balletje rolt naar links. Dit voelt natuurlijk voor een doolhof.

### Bonusfeatures (extra punten)

- **Blazen voor een Boost (Audio):**  
  Blaas hard in de microfoon van je smartphone → De ghosts bevriezen voor 2 seconden. Dit heeft natuurlijk een cooldown. 

---

## 📅 Planning & Voortgang

> **Startdatum:** 19 februari 2025 · **Deadline:** 22 maart 2025

### Overzicht per MVP

| Week | Fase                           | Status    | Branch                  | Geschatte tijd | Deadline     |
| ---- | ------------------------------ | --------- | ----------------------- | -------------- | ------------ |
| 1    | **MVP 1** — Signaling & Setup  | ✅ Klaar   | `main`                  | ~6 uur         | ~~28 feb~~   |
| 2    | **MVP 2** — WebRTC & Interface | ✅ Klaar   | `feature/mazerunner-ui` | ~10 uur        | ~~7 maart~~  |
| 3    | **MVP 3** — Maze Game          | ✅ Klaar   | `feature/maze-game`     | ~5 uur         | ~~14 maart~~ |
| 4    | **MVP 4** — Bonus & Polish     | 🔲 Gepland | `feature/audio-freeze`  | ~5 uur         | 21 maart     |

### MVP 1 — Signaling & Setup ✅

| Taak                                  | Tijd | Deadline | Status  |
| ------------------------------------- | ---- | -------- | ------- |
| Express + Socket.io server opzetten   | 1,5u | 21 feb   | ✅ Klaar |
| Desktop page met QR code              | 1,5u | 23 feb   | ✅ Klaar |
| Controller page via querystring       | 1,5u | 25 feb   | ✅ Klaar |
| Self-signed HTTPS certificaat         | 1u   | 27 feb   | ✅ Klaar |
| 1-op-1 communicatie testen & debuggen | 0,5u | 28 feb   | ✅ Klaar |

**Oplevering:** Werkende signaling flow — telefoon scant QR → verbinding met desktop.

### MVP 2 — WebRTC & Interface ✅

| Taak                                                 | Tijd | Deadline | Status  |
| ---------------------------------------------------- | ---- | -------- | ------- |
| WebRTC Data Channel implementeren (offer/answer/ICE) | 2,5u | 2 maart  | ✅ Klaar |
| Futuristische desktop UI (landing, instructies, QR)  | 2u   | 3 maart  | ✅ Klaar |
| Controller UI (meerdere schermen)                    | 2u   | 4 maart  | ✅ Klaar |
| Countdown timer (gesynchroniseerd via data channel)  | 1u   | 5 maart  | ✅ Klaar |
| Gyroscoop-besturing + iOS permissie-knop             | 1,5u | 6 maart  | ✅ Klaar |
| Disconnect-afhandeling met overlay                   | 0,5u | 6 maart  | ✅ Klaar |
| Tijdelijk game-scherm met beweegbaar balletje        | 0,5u | 7 maart  | ✅ Klaar |

**Oplevering:** Telefoon kantelen → balletje beweegt op desktop via peer-to-peer data channel.

### MVP 3 — Maze Game ✅

| Taak                                           | Tijd  | Deadline | Status  |
| ---------------------------------------------- | ----- | -------- | ------- |
| Canvas-based doolhof tekenen (grid + muren)    | 1u    | 7 maart  | ✅ Klaar |
| Speler (groen balletje) met wall-collision     | 0,75u | 9 maart  | ✅ Klaar |
| Muntjes plaatsen + verzamelen met score-teller | 0,75u | 10 maart | ✅ Klaar |
| Enemy AI — automatisch bewegen door doolhof    | 1,5u  | 12 maart | ✅ Klaar |
| Game over (enemy-hit) + win (alle muntjes)     | 0,5u  | 13 maart | ✅ Klaar |
| Game flow: countdown → spel → eindscherm       | 0,5u  | 14 maart | ✅ Klaar |

**Oplevering:** Volledig speelbaar doolhof-spel bestuurd met smartphone gyroscoop.

### MVP 4 — Bonus & Polish 🔲

| Taak                                               | Tijd  | Deadline | Status    |
| -------------------------------------------------- | ----- | -------- | --------- |
| Microfoon-input via `getUserMedia` + Web Audio API | 1u    | 16 maart | 🔲 Gepland |
| Blazen detecteren → enemy freeze (2s) + cooldown   | 1u    | 17 maart | 🔲 Gepland |
| UI/UX afwerking: game over/win scherm, HUD         | 0,75u | 18 maart | 🔲 Gepland |
| Testen op iPhone + Android                         | 1u    | 19 maart | 🔲 Gepland |
| README, AI reflectie en documentatie afronden      | 0,75u | 20 maart | 🔲 Gepland |
| Zip klaarmaken en inleveren                        | 0,2u  | 21 maart | 🔲 Gepland |

**Oplevering:** Bonuspunten — audio channel integratie + gepolijste eindversie.

> 📌 **Buffer:** 21 maart alles af → 1 dag buffer vóór de deadline van 22 maart.



---

## Development Diary

### MVP 1: Socket.io Signaling & 1-op-1 Controle

Deze week heb ik de volledige basis neergezet: een werkende 1-op-1 verbinding tussen desktop en smartphone via Socket.io.

- **Project Initialisatie:**  
  Nieuwe map aangemaakt, `express` en `socket.io` geïnstalleerd via `npm install`. `.gitignore` aangemaakt zodat `node_modules/` niet in de repo zit. `npm start` script toegevoegd aan `package.json`.

- **Gids gevolgd:**  
  Ik heb de Websockets gids uit de les gevolgd, specifiek de secties "One to one communication", "Controller client" en "QR Code".

- **Signaling Server (`index.js`):**  
  Express server met Socket.io die 1-op-1 forwarding doet. De server houdt verbonden users bij in een `users` object en forwardt `update` events naar een specifiek `targetSocketId` via `socket.to(targetSocketId).emit()`.

- **Desktop Page (`public/index.html`):**  
  Maakt een Socket.io verbinding, toont het Socket ID en de controller URL. Luistert naar `update` events en beweegt een rode cursor (`<div>` met class `.cursor`) op basis van de ontvangen x/y coördinaten. QR code wordt gegenereerd met de `qrcode-generator` CDN library.

- **Controller Page (`public/controller.html`):**  
  Leest het desktop Socket ID uit de querystring (`?id=`). Stuurt `mousemove` en `touchmove` events naar de server met het `targetSocketId` en relatieve x/y coördinaten.

- **QR Code:**  
  De desktop page toont een QR code met de controller URL. Zo kan je met je smartphone de URL scannen in plaats van overtypen.

- **HTTPS:**  
  Self-signed SSL certificaat aangemaakt via `openssl` (`localhost.key` + `localhost.crt`). De server draait nu op HTTPS in plaats van HTTP. 

- **Branching:**  
  Ik werk met de GitHub Flow methode: feature branches per onderdeel, merge naar `main` voor een werkende MVP.

#### Plan voor volgende week (MVP 2)
- WebRTC Data Channel implementeren voor de aansturing (in plaats van Socket.io)
- Socket.io wordt dan enkel nog gebruikt als signaling layer (offer/answer/ICE candidates uitwisselen)
- Desktop experience uitbreiden: een simpel iets besturen met de smartphone (bijv. een bal, een game element)
- Duidelijke instructies toevoegen op de controller page

### MVP 2: WebRTC Data Channels & Game Interface

Deze week heb ik de applicatie uitgebreid van een Socket.io-gestuurde verbinding naar een volledige WebRTC Data Channel setup, en de eerste versie van de game-interface gebouwd.

---

- **WebRTC Data Channels voor de besturing:**  
  De besturing van het spel verloopt nu volledig via een WebRTC Data Channel in plaats van via Socket.io. Socket.io wordt enkel nog gebruikt als **signaling layer**: de server (`index.js`) forwardt alleen `peerOffer`, `peerAnswer` en `peerIce` events tussen de twee clients. Zodra de WebRTC-verbinding is opgebouwd (via SDP offer/answer en ICE candidates), communiceren desktop en smartphone **peer-to-peer** zonder de server. De controller stuurt gyroscoop-data (beta/gamma waarden) rechtstreeks via `dataChannel.send()` naar de desktop. Dit zorgt voor minimale latency omdat de data niet meer via de server hoeft.

  <details>
  <summary>🤖 AI Prompt — Verschil WebSockets vs WebRTC</summary>

  > **Mijn prompt:**  
  > *"Zou je het verschil kunnen gaan uitleggen tussen websockets en webrtc?"*

  **Gemini antwoordde:**  
  Het grootste verschil zit in hoe de data reist. Bij **WebSockets** gaat alles via een centrale server, terwijl **WebRTC** probeert om apparaten rechtstreeks met elkaar te laten praten.

  | Kenmerk    | WebSockets        | WebRTC (Data Channel)             |
  | ---------- | ----------------- | --------------------------------- |
  | Verbinding | Client-Server     | Peer-to-Peer (Direct)             |
  | Snelheid   | Snel              | Razendsnel (Real-time)            |
  | Opzet      | Makkelijk         | Complex (Signaling nodig)         |
  | Protocol   | TCP (Betrouwbaar) | UDP-achtig (Snelheid boven alles) |

  - **WebSockets** = de "Tussenpersoon": Telefoon ➔ Server ➔ Desktop. Ideaal voor de signaling layer.
  - **WebRTC** = de "Directe Lijn": Telefoon ➔ Desktop. Perfect voor games waar elke milliseconde telt.

  Je hebt ze allebei nodig: WebSockets als de "matchmaker" (telefoon en desktop geven via de server door wie ze zijn), en zodra ze elkaars adres hebben praten ze verder via WebRTC.
  </details>

  <details>
  <summary>🤖 AI Prompt — Signaling code toepassen in mijn project</summary>

  > **Mijn prompt:**  
  > *"In de les hebben we dit zo gezien: [signaling server code uit de les]. Hoe moet ik dit het best gaan toepassen in mijn project?"*

  **Gemini antwoordde:**  
  De code uit de les is het "telefoonboek" van je applicatie. De QR-code is de sleutel — die bevat de `socket.id` van de desktop. Wanneer de smartphone de code scant, weet hij direct naar welk `peerId` hij de Offer moet sturen.

  - **Op de Desktop (de 'Host'):** Maak verbinding met de Socket server, genereer een QR-code met de `socket.id`, luister naar `peerOffer`, maak een `peerAnswer` en stuur die terug. Maak hier het `RTCDataChannel` aan.
  - **Op de Smartphone (de 'Controller'):** Scan de QR-code, haal het `peerId` uit de URL, stuur een `peerOffer` naar het `peerId` van de desktop, luister naar de `peerAnswer`.
  - **Data Channel:** In plaats van een video stream, stream je tekst/commando's via `peerConnection.createDataChannel("controlChannel")`.
  </details>

  <details>
  <summary>🤖 AI Prompt — QR-code generatie</summary>

  > **Mijn prompt:**  
  > *"Ja graag"* (als reactie op: "Zal ik je helpen met een simpele functie om die QR-code te genereren op basis van de socket.id?")

  **Gemini antwoordde:**  
  Gemini gaf een voorbeeld met de `qrcode` npm library om de `socket.id` in een scanbare URL te zetten:

  ```js
  socket.on('connect', () => {
      const desktopId = socket.id;
      const url = `${window.location.origin}/mobile.html?id=${desktopId}`;
      QRCode.toCanvas(canvas, url, (error) => {
          if (error) console.error(error);
      });
  });
  ```

  Op de smartphone wordt de `id` uit de URL gehaald met `new URLSearchParams(window.location.search).get('id')` om te weten naar wie de WebRTC Offer gestuurd moet worden.
  </details>

---

- **Desktop interface met uitleg:**  
  De desktop page (`public/index.html`) heeft een volledige landing page gekregen in een donker, futuristisch thema met de Orbitron-font. De pagina bevat een hero-sectie met uitleg ("Navigeer het doolhof met je smartphone"), een "Hoe werkt het?"-kaart met 3 stappen (QR scannen, certificaat accepteren, kantelen om te spelen), een QR-code kaart om je telefoon te verbinden, en onderaan drie feature-highlights (Real-time WebRTC, Gyroscoop-besturing, Geen app nodig). Er is ook een geanimeerde maze-achtergrond en zwevende particles voor sfeer.

  <details>
  <summary>🤖 AI Prompt — Desktop interface ontwerp</summary>

  > **Mijn prompt:**  
  > *"Maak een interface die een game vibe heeft maar nog altijd mooie design. Met duidelijke instructies en zorg dat de QR code nog altijd mooi getoond wordt."*

  **Copilot antwoordde:**  
  Copilot heeft de volledige `index.html` aangepast met een donker futuristisch thema:
  - **Kleuren:** Donkere achtergrond (`#0a0a12`) met cyan (`#00e5ff`) en paars (`#7c4dff`) accenten.
  - **Fonts:** Orbitron (titels) en Inter (body tekst) via Google Fonts.
  - **Layout:** Een hero-sectie met gradient-titel, een grid met "Hoe werkt het?"-kaart (3 genummerde stappen) en een QR-code kaart met hoek-accenten.
  - **Sfeer:** Geanimeerde maze-achtergrond SVG, zwevende particles, en glow-effecten bij hover.
  - **Features:** Drie feature-pills onderaan (Real-time WebRTC, Gyroscoop-besturing, Geen app nodig).
  </details>

---

- **Controller interface (telefoon):**  
  De controller page (`public/controller.html`) heeft dezelfde visuele stijl gekregen als de desktop — hetzelfde donkere kleurenschema, dezelfde fonts en particle-effecten. De controller doorloopt meerdere schermen: een verbindingsscherm met spinner, een permissie-scherm (voor iOS), een countdown-scherm, een actief besturingsscherm met een tilt-visualisatie (een bolletje dat meebeweegt met de kanteling van je telefoon), en een disconnected-scherm.

  <details>
  <summary>🤖 AI Prompt — Controller interface</summary>

  > **Mijn prompt:**  
  > *"Maak dezelfde mooie interface maar dan voor de controller."*

  **Copilot antwoordde:**  
  Copilot heeft `controller.html` aangepast met dezelfde visuele stijl als de desktop (kleuren, fonts, particles). De controller werd opgebouwd met meerdere schermen die elk een andere fase van de verbinding tonen:
  1. **Verbindingsscherm** — spinner + "Verbinden met desktop…"
  2. **Permissie-scherm** — uitleg over bewegingssensor + "Start spel"-knop (voor iOS)
  3. **Countdown-scherm** — 3… 2… 1… GO! met geanimeerde ring
  4. **Controls-scherm** — tilt-visualisatie met beweegbare dot
  5. **Disconnected-scherm** — foutmelding met automatische terugkeer
  </details>

---

- **Countdown timer bij verbinding:**  
  Wanneer de controller verbinding maakt met de desktop via het data channel, start er een countdown-overlay (3… 2… 1… GO!) op zowel desktop als smartphone. Dit geeft de speler de tijd om zich klaar te maken en het toestel goed vast te pakken voordat het spel begint. De countdown wordt gesynchroniseerd doordat de controller een `countdown-ready` bericht stuurt via het data channel, waarna beide kanten beginnen af te tellen. Op de desktop is dit een groot overlay-scherm met een geanimeerde ring en grote nummers, op de controller een vergelijkbaar scherm.

  <details>
  <summary>🤖 AI Prompt — Countdown timer</summary>

  > **Mijn prompt:**  
  > *"Maak een countdown timer zodat de gebruiker tijd krijgt om te gaan starten, dan mag je switchen naar de game zelf, deze moet nog niet werken. Het mag leeg zijn."*

  **Copilot antwoordde:**  
  Copilot heeft een countdown-overlay gemaakt op zowel desktop als controller:
  - Een groot getal dat aftelt van 3 naar 1, gevolgd door "GO!".
  - Een circulaire SVG-ring die mee-animeert met de countdown (`stroke-dashoffset`).
  - Na de countdown wordt er automatisch geswitcht naar het (lege) game-scherm.
  - De countdown wordt gesynchroniseerd via het data channel: de controller stuurt een `countdown-ready` bericht, waarna beide kanten tegelijk beginnen.
  </details>

---

- **Disconnect-afhandeling:**  
  Wanneer de verbinding tussen desktop en telefoon wegvalt (bijv. wifi verlies, slaapstand), wordt dit gedetecteerd via `peerConnection.onconnectionstatechange`. Bij een `disconnected`, `failed` of `closed` status verschijnt er een overlay met een duidelijke foutmelding ("Verbinding verbroken"), een uitleg, en een automatische timer die de gebruiker terugbrengt naar het startscherm. Op de controller wordt dezelfde flow toegepast via `dataChannel.onclose`.

  <details>
  <summary>🤖 AI Prompt — Disconnect afhandeling</summary>

  > **Mijn prompt:**  
  > *"Als de connectie verloren geraakt tussen desktop en telefoon hoe pas ik dit het best toe?"*

  **Gemini antwoordde:**  
  Gemini gaf drie manieren om een verbroken verbinding te detecteren:

  1. **`oniceconnectionstatechange` (WebRTC):** Luister naar de `iceConnectionState` op de `RTCPeerConnection`. Bij `"disconnected"`, `"failed"` of `"closed"` toon je een foutmelding.
  2. **Reconnection flow (UX):** Op de desktop — toon opnieuw de QR-code. Op de smartphone — automatisch terug naar de startpagina.
  3. **Socket.io `disconnect` event:** De server weet wanneer een apparaat wegvalt en kan de andere partij waarschuwen via een `peer-left` event.

  > **Mijn vervolgprompt:**  
  > *"Ja zou je een error voorbeeld kunnen gaan maken in code?"*

  **Gemini antwoordde:**  
  Gemini gaf een compleet voorbeeld met een error-overlay:
  - **HTML:** Een `<div id="connection-error">` overlay met titel, uitleg en een "Reset Game"-knop.
  - **CSS:** Fullscreen overlay met donkere achtergrond (`rgba(0,0,0,0.8)`), gecentreerde kaart met rode rand.
  - **JavaScript:** Een `showConnectionError()` functie die de overlay toont, gekoppeld aan `peerConnection.oniceconnectionstatechange`.

  ```js
  peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "disconnected" || 
          peerConnection.iceConnectionState === "failed") {
          showConnectionError();
      }
  };
  ```
  </details>

---

- **Tijdelijke game interface (desktop & telefoon):**  
  Zowel op de desktop als op de controller is er een tijdelijk game-scherm aangemaakt. De desktop toont een speelveld (`game-playground`) met een beweegbaar balletje (`game-ball`) en een HUD die de kantelhoek toont. Op de controller is het actieve controlsScreen met tilt-dot de game-weergave. De echte maze-gameplay (doolhof, munten, vijand) moet nog gebouwd worden — dit is een placeholder om de besturing te testen.

  <details>
  <summary>🤖 AI Prompt — Tijdelijke game interface</summary>

  > **Mijn prompt:**  
  > *"Maak een countdown timer zodat de gebruiker tijd krijgt om te gaan starten, dan mag je switchen naar de game zelf, deze moet nog niet werken. Het mag leeg zijn."*

  Dit was dezelfde prompt als bij de countdown timer hierboven. Copilot heeft naast de countdown ook direct een leeg game-scherm aangemaakt waar na de countdown naartoe geswitcht wordt:
  - **Desktop:** Een `game-screen` div met een `game-playground` container, een beweegbaar balletje (`.game-ball`) en een HUD bovenaan die de tilt-hoek toont.
  - **Controller:** Het `controlsScreen` met een tilt-visualisatie (`.tilt-visual` met `.tilt-dot`) als game-weergave op de telefoon.
  - Beide schermen zijn bewust leeg gehouden als placeholder — de echte maze moet nog gebouwd worden.
  </details>

---

- **Gyroscoop-besturing getest:**  
  De `DeviceOrientationEvent` wordt gebruikt om beta (voor/achter kanteling) en gamma (links/rechts kanteling) uit te lezen op de smartphone. Deze waarden worden genormaliseerd en via het data channel als JSON (`{ type: 'tilt', beta, gamma }`) naar de desktop gestuurd, waar ze het balletje in het speelveld aansturen.

  <details>
  <summary>🤖 AI Prompt — Gyroscoop toepassen via MDN guide</summary>

  > **Mijn prompt:**  
  > *"Ik heb volgende guide van MDN [DeviceOrientationEvent documentatie]. Hoe pas ik dit toe aan mijn project?"*
  **Gemini antwoordde:**  
  Gemini legde uit hoe je de MDN `DeviceOrientationEvent` implementeert voor het project:

  1. **Permissie vragen (verplicht voor iOS):** `DeviceOrientationEvent.requestPermission()` moet in een `click`-event staan. Zonder user gesture blokkeert iOS het.
  2. **Sensor data lezen:** Gebruik `event.beta` (voor/achter kanteling) en `event.gamma` (links/rechts kanteling).
  3. **Data versturen via Data Channel** (niet via Socket.io!):

  ```js
  window.addEventListener("deviceorientation", (event) => {
      const data = {
          type: 'orientation',
          beta: Math.round(event.beta),
          gamma: Math.round(event.gamma)
      };
      if (dataChannel && dataChannel.readyState === "open") {
          dataChannel.send(JSON.stringify(data));
      }
  });
  ```

  4. **Op de desktop ontvangen:** Via `dataChannel.onmessage` de beta/gamma waarden uitlezen en het balletje verplaatsen.
  </details>

---

- **iOS permissie-knop voor gyroscoop:**  
  Op iOS-apparaten moet je expliciet toestemming vragen om de gyroscoop te gebruiken via `DeviceOrientationEvent.requestPermission()`. Zonder deze toestemming werkt de sensor simpelweg niet. Daarom is er een apart permissie-scherm (`permScreen`) toegevoegd met een duidelijke uitleg ("Bewegingssensor nodig") en een "Start spel"-knop. Als de gebruiker op Android of desktop zit, wordt dit scherm overgeslagen omdat daar geen permissie nodig is.

  <details>
  <summary>🤖 AI Prompt — iPhone gyroscoop werkt niet</summary>

  > **Mijn prompt:**  
  > *"Op mijn iPhone werkt dit nog niet, hoe fix ik dit?"*

  **Gemini antwoordde:**  
  Er zijn drie redenen waarom het niet werkt op iPhone:

  1. **HTTPS is verplicht:** Apple staat geen toegang tot sensoren toe over een onbeveiligde `http://` verbinding. Je moet je server via HTTPS draaien (self-signed certificaat of ngrok).
  2. **User Gesture vereiste:** `DeviceOrientationEvent.requestPermission()` **moet** worden aangeroepen door een directe klik van de gebruiker. Automatisch bij page load werkt niet:

  ```js
  startBtn.onclick = () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission()
              .then(permissionState => {
                  if (permissionState === 'granted') {
                      window.addEventListener('deviceorientation', handleOrientation);
                  }
              })
              .catch(console.error);
      } else {
          window.addEventListener('deviceorientation', handleOrientation);
      }
  };
  ```

  3. **Safari instellingen:** Ga naar *Instellingen > Safari > Privacy en beveiliging* en controleer dat "Toegang tot beweging en oriëntatie" aan staat.
  </details>

---

- **Bal bestuurbaar via gyroscoop:**  
  Op de desktop beweegt een groen balletje (`.game-ball`) over het speelveld op basis van de ontvangen tilt-data van de controller. Op de controller zelf is er een visuele tilt-dot die laat zien hoe de telefoon gekanteld wordt, zodat de speler feedback krijgt op het controller-scherm.

  <details>
  <summary>🤖 AI Prompt — Bal besturen met gyroscoop data</summary>

  > **Mijn prompt:**  
  > *"Ik heb volgende guide van MDN [DeviceOrientationEvent documentatie]. Hoe pas ik dit toe aan mijn project?"*

  Dit was dezelfde prompt als bij de gyroscoop-besturing hierboven. Naast het uitlezen en versturen van de sensor data, legde Gemini ook uit hoe je de ontvangen data op de desktop gebruikt om een element te verplaatsen:

  ```js
  dataChannel.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'orientation') {
          // Gebruik msg.beta en msg.gamma om je personage te verplaatsen
          updatePlayerMovement(msg.beta, msg.gamma);
      }
  };
  ```

  Copilot heeft dit vervolgens geïmplementeerd: de desktop luistert naar `tilt`-berichten via het data channel en verplaatst het balletje (`.game-ball`) in het speelveld op basis van de `beta` en `gamma` waarden. Op de controller beweegt een visuele dot (`.tilt-dot`) mee met de kanteling als feedback.
  </details>

#### Plan voor volgende week (MVP 3)
Zie de [Week 3 planning](#week-3--mvp-3-het-doolhof-spel) hierboven: doolhof bouwen op canvas, speler + muntjes + ghost met collision detection, score-systeem en game over flow.

<details>
<summary>🤖 AI Prompt — README schrijven voor week 2</summary>

> **Mijn prompt:**  
> *"Kan je de readme gaan aanpassen, voor week 2. Voeg volgende toe aan mijn Readme: WebRTC Data Channels voor de besturing, Desktop interface met uitleg, Controller interface (telefoon), Countdown timer bij verbinding, Disconnect-afhandeling, Tijdelijke game interface (desktop & telefoon), Gyroscoop-besturing getest, iOS permissie-knop voor gyroscoop, Bal bestuurbaar via gyroscoop. Ik heb gebruik gemaakt van volgende prompts en heb ook volgende antwoorden gekregen: ..."*

**Copilot antwoordde:**  
Omdat ik zelf niet goed ben in Markdown, heb ik Copilot gevraagd om de development diary voor week 2 te structureren. Ik gaf de punten die ik wilde behandelen en de AI-prompts die ik had gebruikt, en Copilot heeft dit omgezet naar een gestructureerde diary met:
- Een beschrijving per onderdeel van wat ik heb gedaan en hoe het technisch werkt
- Inklapbare `<details>` blokken met de exacte prompts die ik aan Gemini/Copilot had gesteld en hun antwoorden
- Een logische volgorde van de werkzaamheden

Ik heb de tekst doorgelezen en waar nodig bijgestuurd op correctheid.
</details>

---

### MVP 3: Maze Game, Orbs, Enemies & Audio

Deze week heb ik het echte speelbare doolhof-spel gebouwd: een recursief gegenereerd labyrint, verzamelbare orbs, intelligente vijanden met pathfinding, en audio-feedback.

---

- **Refactoring: Inline JS naar aparte files & onnodige code verwijderd**  
  Alle game-logica zat nog inline in `desktop.js`. Dit maakte het bestand onleesbaar (500+ regels). Ik heb de code opgeschoond en onnodige globale variabelen verwijderd.

  <details>
  <summary>🤖 AI Prompt — window._dataChannel: wat doet dit?</summary>

  > **Mijn prompt:**  
  > *"Wat doet dit en heeft dit nut in mijn code? `window._dataChannel = null;`"*

  **Copilot antwoordde:**  
  `window._dataChannel` wordt gezet op `null` wanneer de controller disconnect (na de 4-seconden countdown). Op desktop-connection.js:68 wordt het weer gevuld met het actieve channel wanneer een nieuwe verbinding opkomt.

  **Maar: het wordt nergens anders gelezen.** Geen enkel ander script in je project leest `window._dataChannel`. Het wordt opgeslagen op `window` (als globale variabele), wat suggereert dat het bedoeld was om vanuit andere bestanden (bijv. `desktop-ball.js` of `desktop-countdown.js`) het data channel te kunnen gebruiken — maar dat gebeurt momenteel niet.

  **Conclusie:** In de huidige code heeft het **geen nut**. Het is ofwel:
  - Overblijfsel van een eerdere opzet, of
  - Voorbereid voor toekomstig gebruik dat er nooit gekomen is.

  Als je nergens anders `window._dataChannel` nodig hebt, kun je beide regels (27 en 68) veilig verwijderen.
  </details>

  <details>
  <summary>🤖 AI Prompt — Mag ik dataChannel ook verwijderen?</summary>

  > **Mijn vervolgprompt:**  
  > *"Soms zie ik dataChannel. Zou het erg zijn als ik het verwijder?"*

  **Copilot antwoordde:**  
  Nee, `dataChannel` mag je **absoluut niet** verwijderen! Dit is een **andere** variabele dan de `window._dataChannel` die we eerder verwijderd hebben.

  Deze `dataChannel` is het kernstuk van de communicatie tussen controller en desktop. Het wordt overal actief gebruikt:

  | Locatie           | Wat het doet                              |
  | ----------------- | ----------------------------------------- |
  | controller.js:2   | Declaratie als gedeelde variabele         |
  | controller.js:63  | Tilt-data versturen naar desktop          |
  | controller.js:96  | `countdown-ready` bericht sturen          |
  | controller.js:155 | Op `null` zetten bij disconnect (cleanup) |
  | controller.js:164 | Aanmaken van het WebRTC data channel      |
  | controller.js:200 | Cursor-data sturen bij mouse/touch        |

  Zonder `dataChannel` kan de controller **niets** naar de desktop sturen — geen tilt-data, geen countdown-signaal, geen cursor-positie. Het hele spel zou niet werken.

  **Samengevat:** De vorige `window._dataChannel` was een ongebruikte kopie die nergens gelezen werd. Deze `dataChannel` is de echte — laat die staan.

  **Gebruikte code (controller.js):**
  ```js
  // Declaratie bovenaan — gedeelde variabele voor de hele controller
  let socket, peerConnection, dataChannel, targetSocketId;

  // Tilt-data versturen via datachannel
  if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({ type: 'tilt', beta, gamma }));
  }

  // Countdown-ready bericht sturen
  if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({ type: 'countdown-ready' }));
  }

  // Aanmaken van het WebRTC data channel
  dataChannel = peerConnection.createDataChannel('control');
  ```
  </details>

---

- **Code cleanup & performance optimalisaties**
  
  De AI wees op vijf verbeteringen. Ik heb ze allemaal doorgevoerd:

  <details>
  <summary>🤖 Code Review — Performance improvements</summary>

  > **Mijn prompt:**  
  > *"Als je de code bekijkt kan er iets beter of opgeschoond worden?"*

  **Copilot antwoordde:**  
  De code is al vrij clean, maar er zijn een paar dingen die beter kunnen:

  **1. Bug: status wordt direct overschreven (desktop.js:169-171)**  
  "Controller verbonden!" is **nooit zichtbaar** omdat het synchroon meteen weer overschreven wordt. Je moet ofwel de eerste regel verwijderen, ofwel een korte setTimeout gebruiken als je het even wil tonen.

  **2. getUrlParameter kan simpeler (controller.js:12-17)**  
  Je gebruikt een complexe regex, maar `URLSearchParams` doet hetzelfde in 1 regel.

  **3. Herhaalde DOM-lookups in hot paths**  
  In `handleTilt` worden `gamePlayground`, `gameBall` en `tiltDebug` **elke keer opnieuw opgezocht** — dit wordt tientallen keren per seconde aangeroepen. Beter om ze bovenaan éénmalig te cachen. Hetzelfde voor `tiltDot` in de orientationHandler (controller.js:55).

  **4. Ongebruikt clients object (index.js:22)**  
  Dit wordt alleen gevuld en verwijderd, maar **nergens gelezen**. Het heeft momenteel geen functie en kan weg.

  **5. startCountdown parameter ongebruikt (desktop.js:74)**  
  `startCountdown` ontvangt `channel` als parameter, maar doet er niets mee. De parameter kan weg.

  | #   | Issue                        | Impact                                  |
  | --- | ---------------------------- | --------------------------------------- |
  | 1   | Status direct overschreven   | Bug — tekst nooit zichtbaar             |
  | 2   | DOM lookups in hot path      | Performance — onnodige queries 30-60x/s |
  | 3   | getUrlParameter moderniseren | Leesbaarheid                            |
  | 4   | clients object verwijderen   | Dode code                               |
  | 5   | Ongebruikte channel param    | Cleanup                                 |

  **Wat ik deed (toegevoegde/aangepaste code):**

  DOM caching — eenmalig bovenaan (desktop.js):
  ```js
  const $gamePlayground = document.getElementById('gamePlayground');
  const $gameBall = document.getElementById('gameBall');
  const $tiltDebug = document.getElementById('tiltDebug');
  ```

  DOM caching — controller (controller.js):
  ```js
  const $tiltDot = document.getElementById('tiltDot');
  ```

  URLSearchParams i.p.v. regex (controller.js):
  ```js
  const getUrlParameter = name => new URLSearchParams(location.search).get(name) || false;
  ```

  Clients object verwijderd uit index.js — de server forwardt nu alleen nog events:
  ```js
  io.on('connection', socket => {
      console.log(`Connection: ${socket.id}`);

      socket.on('peerOffer', (peerId, offer) => {
          io.to(peerId).emit('peerOffer', peerId, offer, socket.id);
      });

      socket.on('peerAnswer', (peerId, answer) => {
          io.to(peerId).emit('peerAnswer', peerId, answer, socket.id);
      });

      socket.on('peerIce', (peerId, candidate) => {
          io.to(peerId).emit('peerIce', peerId, candidate, socket.id);
      });

      socket.on('disconnect', () => {
          console.log(`Disconnected: ${socket.id}`);
      });
  });
  ```
  </details>

---

- **Doolhof-generatie met Recursive Backtracking**
  
  De kern van het spel: een uniek, volledig oplosbaar doolhof gegenereerd via het **Recursive Backtracking algoritme**. Dit algoritme graveert zich als ontdekkingsreiziger een weg door een vol rooster muren heen, waarbij het altijd terugkruipt als het vastloopt. Het resultaat is een "perfect maze" met één pad tussen welke twee punten ook.

  <details>
  <summary>🤖 AI Prompt — Hoe begin je aan een doolhof?</summary>

  > **Mijn prompt:**  
  > *"Ik zou graag een doolhof gaan gebruiken in mijn code. Hoe zou ik best hieraan beginnen?"*

  **Gemini antwoordde:**  
  Om een doolhof te bouwen, is de belangrijkste keuze hoe je het opslaat in je code. Omdat je al een bewegend balletje hebt, is een **Grid-based systeem** de beste start.

  **1. De Datastructuur ("De Blauwdruk"):**  
  De simpelste manier is een **2D Array**. Elk getal in de array staat voor een type blokje (`1` = muur, `0` = pad).

  ```js
  const maze = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ];
  ```

  **2. Tekenmethode: Canvas vs. DOM**  
  Omdat je een game maakt, raad ik **HTML5 Canvas** aan. Het is sneller en je hebt meer controle over de pixels.

  **3. Collision Detection (Muren raken)**  
  Voordat je het balletje verplaatst, check je: "Is de plek waar ik naartoe ga een 0 of een 1?"

  ```js
  function canMove(newX, newY) {
      const col = Math.floor(newX / cellSize);
      const row = Math.floor(newY / cellSize);
      if (maze[row] && maze[row][col] === 1) {
          return false; // Je raakt een muur!
      }
      return true;
  }
  ```

  **4. Concreet advies:** Begin eerst statisch (hardcoded array) zodat je de besturing en collision kunt testen. Maak een `drawMaze()` functie die de array op je canvas tekent. Pas je `handleTilt` aan zodat deze de `canMove()` check gebruikt.
  </details>

  <details>
  <summary>🤖 AI Prompt — Recursive Backtracking</summary>

  > **Mijn vervolgprompt:**  
  > *"Ik zag online recursive backtrack. Zou dit niet handig zijn?"*

  **Gemini antwoordde:**  
  Dat is een uitstekend idee! **Recursive Backtracking** is een van de meest populaire algoritmes voor games omdat het altijd een "perfecte maze" genereert: een doolhof waarin elk punt bereikbaar is en er precies één pad is tussen twee willekeurige punten.

  Dit tilt je project direct naar een hoger niveau (**bonuspunten**-waardig), omdat je technologie gebruikt die buiten het standaard curriculum valt.

  **Hoe werkt het algoritme?**  
  Vergelijk het met een ontdekkingsreiziger in een donker gangenstelsel:
  1. **Start:** Kies een willekeurige cel en markeer deze als "bezocht".
  2. **Kies:** Kijk of er onbezochte buren zijn (noord, oost, zuid, west).
  3. **Bezoek:** Kies een willekeurige buur, haal de muur tussen de huidige cel en de buur weg, en ga naar die cel.
  4. **Backtrack:** Als je vastloopt (geen onbezochte buren meer), ga je een stapje terug tot je weer een cel vindt die wél onbezochte buren heeft.
  5. **Stop:** Als je weer terug bent bij het begin en alles is bezocht.

  **Waarom handig voor jouw project?**
  - **Herspeelbaarheid:** Elke refresh = nieuw doolhof.
  - **Gegarandeerde oplossing:** Nooit een onmogelijk doolhof.
  - **Performance:** Razendsnel, zelfs voor grote grids.
  </details>

  <details>
  <summary>🤖 AI Prompt — Doolhof implementeren</summary>

  > **Mijn implementatie-prompt:**  
  > *"Wanneer de telefoon verbonden is kom je op het spelgedeelte. Graag zou ik willen dat er een doolhof is. Maak gebruik van recursive backtracker voor het doolhof te gaan maken."*

  **Copilot antwoordde:**  
  Copilot implementeerde de volledige maze generation, rendering op canvas, en collision detection. Het doolhof wordt bij elke game-start opnieuw gegenereerd.
  </details>

  **Toegevoegde code — `generateMaze()` (desktop.js):**
  ```js
  const generateMaze = () => {
      if (!$gamePlayground) return;
      const w = $gamePlayground.clientWidth;
      const h = $gamePlayground.clientHeight;
      cellSize = 120;
      mazeCols = Math.floor(w / cellSize);
      mazeRows = Math.floor(h / cellSize);
      if (mazeCols < 2) mazeCols = 2;
      if (mazeRows < 2) mazeRows = 2;
      mazeOffsetX = (w - mazeCols * cellSize) / 2;
      mazeOffsetY = (h - mazeRows * cellSize) / 2;

      // Init grid — all walls present
      mazeGrid = [];
      for (let r = 0; r < mazeRows; r++) {
          mazeGrid[r] = [];
          for (let c = 0; c < mazeCols; c++) {
              mazeGrid[r][c] = { top: true, right: true, bottom: true, left: true, visited: false };
          }
      }

      // Recursive backtracker
      const stack = [{ r: 0, c: 0 }];
      mazeGrid[0][0].visited = true;

      while (stack.length > 0) {
          const cur = stack[stack.length - 1];
          const nb = [];
          if (cur.r > 0 && !mazeGrid[cur.r - 1][cur.c].visited) nb.push({ r: cur.r - 1, c: cur.c });
          if (cur.r < mazeRows - 1 && !mazeGrid[cur.r + 1][cur.c].visited) nb.push({ r: cur.r + 1, c: cur.c });
          if (cur.c > 0 && !mazeGrid[cur.r][cur.c - 1].visited) nb.push({ r: cur.r, c: cur.c - 1 });
          if (cur.c < mazeCols - 1 && !mazeGrid[cur.r][cur.c + 1].visited) nb.push({ r: cur.r, c: cur.c + 1 });

          if (nb.length === 0) {
              stack.pop();
          } else {
              const next = nb[Math.floor(Math.random() * nb.length)];
              const dr = next.r - cur.r;
              const dc = next.c - cur.c;
              if (dr === -1) { mazeGrid[cur.r][cur.c].top = false; mazeGrid[next.r][next.c].bottom = false; }
              if (dr === 1)  { mazeGrid[cur.r][cur.c].bottom = false; mazeGrid[next.r][next.c].top = false; }
              if (dc === -1) { mazeGrid[cur.r][cur.c].left = false; mazeGrid[next.r][next.c].right = false; }
              if (dc === 1)  { mazeGrid[cur.r][cur.c].right = false; mazeGrid[next.r][next.c].left = false; }
              mazeGrid[next.r][next.c].visited = true;
              stack.push(next);
          }
      }

      // Remove extra walls to create loops (multiple paths)
      const extraOpenings = Math.floor(mazeRows * mazeCols * 0.35);
      for (let i = 0; i < extraOpenings; i++) {
          const r = Math.floor(Math.random() * mazeRows);
          const c = Math.floor(Math.random() * mazeCols);
          const dir = Math.floor(Math.random() * 4);
          if (dir === 0 && r > 0)              { mazeGrid[r][c].top = false; mazeGrid[r - 1][c].bottom = false; }
          if (dir === 1 && r < mazeRows - 1)   { mazeGrid[r][c].bottom = false; mazeGrid[r + 1][c].top = false; }
          if (dir === 2 && c > 0)              { mazeGrid[r][c].left = false; mazeGrid[r][c - 1].right = false; }
          if (dir === 3 && c < mazeCols - 1)   { mazeGrid[r][c].right = false; mazeGrid[r][c + 1].left = false; }
      }

      renderMaze();
      spawnOrbs();
      spawnEnemies();
  };
  ```

---

- **Canvas rendering i.p.v. DOM (Massive performance fix)**
  
  Eerste iteratie: Ik renderde muren als 350+ `<div>` elementen, elk met `box-shadow` blur. Dit was een **disaster voor performance** — GPU-rendering van shadows verbruikt veel meer dan verwacht.

  <details>
  <summary>🤖 Problem: Lag door het doolhof</summary>

  > **Mijn probleem:**  
  > *"Er is veel lag doorheen de doolhof, waarin ligt dit en kan dit opgelost worden?"*

  **Copilot antwoordde:**  
  Twee oorzaken:
  1. **350+ DOM nodes met dure box-shadow** — elke muur is een `<div>` met blur. Dit belast de GPU.
  2. **Gyroscoop stuurt 60x/s** — elke tilt update triggert DOM repositioning.

  **Oplossing:** Muren als 1 `<canvas>` element renderen i.p.v. honderden divs. Canvas is veel sneller voor batch-rendering.
  </details>

  **Toegevoegde code — `renderMaze()` (desktop.js):**
  ```js
  const renderMaze = () => {
      const canvas = document.getElementById('mazeCanvas');
      if (!canvas) return;
      const w = $gamePlayground.clientWidth;
      const h = $gamePlayground.clientHeight;
      canvas.width = w;
      canvas.height = h;
      canvas.style.cssText = 'position:absolute;inset:0;z-index:5;';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.55)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      for (let r = 0; r < mazeRows; r++) {
          for (let c = 0; c < mazeCols; c++) {
              const cell = mazeGrid[r][c];
              const x = mazeOffsetX + c * cellSize;
              const y = mazeOffsetY + r * cellSize;
              if (cell.top)   { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
              if (cell.left)  { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
              if (c === mazeCols - 1 && cell.right)  { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
              if (r === mazeRows - 1 && cell.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
          }
      }
  };
  ```

  Resultaat: 350+ DOM divs → 1 `<canvas>` element. Lag weg, frame rate stabiel.

---

- **Collision detection (Balletje botst tegen muren)**
  
  Voor je het balletje mag verplaatsen, checken we per muur van de huidige cel: "Zit de bal te dicht bij een muur?" Als dat zo is, wordt de bal teruggeduwd en de snelheid op 0 gezet.

  **Toegevoegde code — `checkMazeCollision()` (desktop.js):**
  ```js
  const checkMazeCollision = (newX, newY, radius) => {
      if (mazeGrid.length === 0) return { x: newX, y: newY };

      let x = newX;
      let y = newY;

      // Clamp to maze outer bounds
      const left = mazeOffsetX + radius;
      const right = mazeOffsetX + mazeCols * cellSize - radius;
      const top = mazeOffsetY + radius;
      const bottom = mazeOffsetY + mazeRows * cellSize - radius;
      x = Math.max(left, Math.min(right, x));
      y = Math.max(top, Math.min(bottom, y));

      // Grid cell the ball center is in
      const col = Math.floor((x - mazeOffsetX) / cellSize);
      const row = Math.floor((y - mazeOffsetY) / cellSize);
      const safeCol = Math.max(0, Math.min(mazeCols - 1, col));
      const safeRow = Math.max(0, Math.min(mazeRows - 1, row));
      const cell = mazeGrid[safeRow][safeCol];

      const cellLeft = mazeOffsetX + safeCol * cellSize;
      const cellTop = mazeOffsetY + safeRow * cellSize;
      const cellRight = cellLeft + cellSize;
      const cellBottom = cellTop + cellSize;

      // Push ball away from walls
      if (cell.top && y - radius < cellTop) y = cellTop + radius;
      if (cell.bottom && y + radius > cellBottom) y = cellBottom - radius;
      if (cell.left && x - radius < cellLeft) x = cellLeft + radius;
      if (cell.right && x + radius > cellRight) x = cellRight - radius;

      return { x, y };
  };
  ```

  Dit wordt aangeroepen in `handleTilt()` vóór elke positie-update:
  ```js
  const clamped = checkMazeCollision(ballState.x, ballState.y, ballRadius);
  if (clamped.x !== ballState.x) ballState.vx = 0;
  if (clamped.y !== ballState.y) ballState.vy = 0;
  ballState.x = clamped.x;
  ballState.y = clamped.y;
  ```

---

- **Throttled tilt-events (Performance tuning)**
  
  De gyroscoop stuurt veel sneller dan nodig is (~100x/s). Dit belast het datachannel en de CPU. Ik throttle beide zijden:

  <details>
  <summary>🤖 Performance: Throttling tilt-data</summary>

  De AI adviseerde om tilt-events te beperken naar ~30fps omdat dat ruim genoeg is voor smooth gameplay. Dit halveert de network traffic en CPU load.
  </details>

  **Toegevoegde code — Controller-zijde throttling (controller.js):**
  ```js
  let lastSendTime = 0;
  const SEND_INTERVAL = 33; // ~30fps max over datachannel

  orientationHandler = (e) => {
      const beta = e.beta;
      const gamma = e.gamma;
      if (beta === null || gamma === null) return;

      // Throttle data channel sends
      const now = performance.now();
      if (now - lastSendTime < SEND_INTERVAL) return;
      lastSendTime = now;

      if (dataChannel && dataChannel.readyState === 'open') {
          dataChannel.send(JSON.stringify({ type: 'tilt', beta, gamma }));
      }
  };
  ```

  **Desktop-zijde throttling (desktop.js):**
  ```js
  const handleTilt = (() => {
      let lastTiltTime = 0;
      const TILT_INTERVAL = 16; // ~60fps cap

      return (beta, gamma) => {
          const now = performance.now();
          if (now - lastTiltTime < TILT_INTERVAL) return;
          lastTiltTime = now;
          // ... bal-physics en collision ...
      };
  })();
  ```

---

- **8 gele verzamelbare orbs met HUD counter**
  
  Het doel van het spel: verzamel alle 8 gele bollen ("orbs"). Ze spawnen willekeurig in het doolhof, maar nooit in de startcel van de speler.

  <details>
  <summary>🤖 AI Prompt — Orbs implementeren</summary>

  > **Mijn prompt:**  
  > *"Is het mogelijk om gele bollen te gaan plaatsen doorheen de doolhof (max 8) die je kan verzamelen? Laat dit ook tonen in de UI (bijvoorbeeld 1 van de 8)"*

  **Copilot antwoordde:**  
  Simpel systeem:
  1. Bij `resetGame()`: Spawn 8 orbs in willekeurige maze-cellen.
  2. In `handleTilt()`: Check elke frame of de bal een orb raakt.
  3. Bij contact: Verwijder de orb (met animatie), verhoog counter.
  4. HUD: Toon "3 / 8" orbs collected.
  </details>

  **Toegevoegde code — `spawnOrbs()` (desktop.js):**
  ```js
  const spawnOrbs = () => {
      $gamePlayground.querySelectorAll('.maze-orb').forEach(el => el.remove());
      orbs = [];
      orbsCollected = 0;
      if ($orbCounter) $orbCounter.textContent = `0 / ${ORB_COUNT}`;

      const centerCol = Math.floor(mazeCols / 2);
      const centerRow = Math.floor(mazeRows / 2);
      const usedCells = new Set();
      usedCells.add(`${centerRow},${centerCol}`);

      while (orbs.length < ORB_COUNT && usedCells.size < mazeRows * mazeCols) {
          const r = Math.floor(Math.random() * mazeRows);
          const c = Math.floor(Math.random() * mazeCols);
          const key = `${r},${c}`;
          if (usedCells.has(key)) continue;
          usedCells.add(key);

          const x = mazeOffsetX + c * cellSize + cellSize / 2;
          const y = mazeOffsetY + r * cellSize + cellSize / 2;

          const el = document.createElement('div');
          el.className = 'maze-orb';
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          $gamePlayground.appendChild(el);

          orbs.push({ x, y, el, collected: false });
      }
  };
  ```

  **Collision detection — `checkOrbCollision()` (desktop.js):**
  ```js
  const checkOrbCollision = () => {
      const ballRadius = 12;
      for (const orb of orbs) {
          if (orb.collected) continue;
          const dx = ballState.x - orb.x;
          const dy = ballState.y - orb.y;
          if (dx * dx + dy * dy < (ballRadius + ORB_RADIUS) * (ballRadius + ORB_RADIUS)) {
              orb.collected = true;
              orb.el.classList.add('collected');
              collectSound.currentTime = 0;
              if (soundEnabled) collectSound.play().catch(() => { });
              orbsCollected++;
              if ($orbCounter) $orbCounter.textContent = `${orbsCollected} / ${ORB_COUNT}`;
              if (orbsCollected >= ORB_COUNT) showVictory();
          }
      }
  };
  ```

---

- **Victory screen als jij alle 8 orbs hebt**
  
  Verzamel alle orbs → Victory overlay met trophy icon, gouden gradient tekst, fallende confetti deeltjes, en "Play Again" knop voor een nieuw spel.

  <details>
  <summary>🤖 AI Prompt — Victory screen design</summary>

  > **Mijn prompt:**  
  > *"Is het mogelijk wanneer je de 8 orbs hebt verzameld dat er een victory screen komt? Zorg dat dit mooi gedesigned is natuurlijk en een optie voor opnieuw te gaan spelen."*

  **Copilot antwoordde met volledige HTML, CSS, en JS:**
  - Trophy icoon met pulsarende glow.
  - Gouden kleurenpalet (#ffd600 → #ff6d00).
  - Gestaggerde animaties voor title, subtitle, confetti.
  - "Play Again" knop die `resetGame()` aanroept.
  </details>

  **Toegevoegde code — `showVictory()` en `spawnConfetti()` (desktop.js):**
  ```js
  const showVictory = () => {
      if (!$victoryOverlay) return;
      $victoryOverlay.classList.add('active');
      spawnConfetti();
  };

  const spawnConfetti = () => {
      const container = $victoryOverlay.querySelector('.victory-particles');
      if (!container) return;
      container.innerHTML = '';
      const colors = ['#ffd600', '#ff6d00', '#00e5ff', '#7c4dff', '#ff5252', '#69f0ae'];
      for (let i = 0; i < 40; i++) {
          const p = document.createElement('div');
          p.className = 'victory-particle';
          p.style.left = Math.random() * 100 + '%';
          p.style.top = -10 + Math.random() * 20 + '%';
          p.style.background = colors[Math.floor(Math.random() * colors.length)];
          p.style.animationDelay = Math.random() * 1.2 + 's';
          p.style.animationDuration = 1.8 + Math.random() * 1.5 + 's';
          container.appendChild(p);
      }
  };

  const resetGame = () => {
      if ($victoryOverlay) $victoryOverlay.classList.remove('active');
      if ($gameOverOverlay) $gameOverOverlay.classList.remove('active');
      gameOver = false;
      ballInitialized = false;
      initBall();
  };
  ```
  
  **Design details:**
  - Cyberpunk stijl consistent met de rest (noir + neon accenten).
  - Z-index 200 (boven game, onder disconnect overlay).
  - Confetti `<div>` elementen die van boven vallen met random horizontal drift.

---

- **Audio: Orb-pickup geluid + achtergrondmuziek**
  
  Spelervaring: Bij elke orb-pickup hoor je een "ding!" geluid. Achtergrondmuziek speelt zacht op de achtergrond.

  <details>
  <summary>🤖 Problem: Audio speelt niet af (NotAllowedError)</summary>

  > **Mijn probleem:**  
  > *"Ik heb audio toegevoegd maar ik hoor geen audio en ik zie deze error: `NotAllowedError: play() failed because the user didn't interact with the document first.`"*

  **Gemini antwoordde:**  
  Browser-security: `<audio>.play()` mag pas na een user-gesture (klik, toetsdruk). Omdat de desktop-pagina niet direct aangeklikt wordt (alles gebeurt via controller), moet je de audio "ontgrendelen" via een eerste interactie.

  **Oplossing:** Bij eerste klik op het scherm, zet je het geluid aan. Daarna werkt het altijd. Wrap `play()` ook in een `.catch()` voor safety.
  </details>

  <details>
  <summary>🤖 AI Prompt — Geluidstoggle-knop</summary>

  > **Mijn prompt:**  
  > *"Kan je misschien op de startpagina ergens een knopje gaan plaatsen van 'speel met geluid' en dan een knopje hiervoor?"*

  **Copilot antwoordde:**  
  Toggle-knop in de topbar:
  - Geluid AAN: Speaker icoon (🔊).
  - Geluid UIT: Muted icoon (🔇).
  - Klik ontgrendelt meteen audio + schakelt tussen aan/uit.
  </details>

  <details>
  <summary>🤖 AI Prompt — Volume regelen via JavaScript</summary>

  > **Mijn prompt:**  
  > *"Ik wil graag background muziek. Kan ik de volume hiervan stiller laten maken of moet ik zelf de audio verlagen in een audio programma?"*

  **Gemini antwoordde:**  
  Je kunt het volume uitstekend regelen via JavaScript! Je hoeft niet zelf met een audio-programma aan de slag. De meest efficiënte manier is via het `volume` attribuut van het `<audio>` element. De waarde hiervan ligt tussen **0.0** (stil) en **1.0** (volledig volume).
  </details>

  **Toegevoegde code — Audio setup (desktop.js):**
  ```js
  const collectSound = new Audio('/assets/collect.mp3');
  const selectSound = new Audio('/assets/select.mp3');
  const bgMusic = new Audio('/assets/backgroundmusic.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.6;
  let audioUnlocked = false;
  let soundEnabled = false;

  const unlockAudio = () => {
      if (audioUnlocked) return;
      collectSound.play().then(() => {
          collectSound.pause();
          collectSound.currentTime = 0;
      }).catch(() => { });
      audioUnlocked = true;
  };
  ```

  **Geluidstoggle-knop (desktop.js):**
  ```js
  if ($soundToggle) {
      $soundToggle.addEventListener('click', () => {
          unlockAudio();
          soundEnabled = !soundEnabled;
          $soundToggle.classList.toggle('muted', !soundEnabled);
          const label = $soundToggle.querySelector('.sound-label');
          if (label) label.textContent = soundEnabled ? 'Geluid aan' : 'Geluid uit';
          if (soundEnabled) {
              selectSound.currentTime = 0;
              selectSound.play().catch(() => { });
          } else {
              bgMusic.pause();
          }
      });
  }
  ```

  **Hoe het samenwerkt:**
  - Button in topbar: "🔊 Geluid aan" / "🔇 Geluid uit".
  - Bij toggle: `soundEnabled` boolean omzetten, achtergrondmuziek paussen/hervatten.
  - Collect-geluiden worden overgeslagen als `soundEnabled === false`.
  - Achtergrondmuziek start na countdown: `if (soundEnabled) bgMusic.play().catch(() => { });`

---

- **2 rode vijanden met BFS pathfinding AI**
  
  Het moeilijkste onderdeel: intelligente vijanden die je achtervolgen door het doolhof. **BFS (Breadth-First Search)** vindt het kortste pad in O(grid size) tijd.

  <details>
  <summary>🤖 AI Prompt — Vijanden implementeren</summary>

  > **Mijn prompt:**  
  > *"Zou het mogelijk zijn om 2 rode bolletjes te gaan plaatsen in het doolhof die naar de gebruiker zijn bal gaat? Wanneer het rood bolletje de gebruiker aanraakt komt er een gameover screen met de kans om opnieuw te gaan spelen."*

  **Copilot antwoordde:**  
  Twee systemen:
  1. **Spawning:** 2 vijanden op willekeurige cells (minstens 1 cel afstand van start).
  2. **Pathfinding:** BFS-algoritme → kortste pad naar speler in grid.
  3. **Movement:** Beweeg langs het pad met constante snelheid.
  4. **Collision:** Check per frame of vijand de speler raakt → Game Over.
  </details>

  **Toegevoegde code — `spawnEnemies()` (desktop.js):**
  ```js
  const spawnEnemies = () => {
      $gamePlayground.querySelectorAll('.maze-enemy').forEach(el => el.remove());
      enemies = [];
      if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }

      const centerCol = Math.floor(mazeCols / 2);
      const centerRow = Math.floor(mazeRows / 2);
      const usedCells = new Set();
      usedCells.add(`${centerRow},${centerCol}`);
      // Also avoid cells adjacent to center
      for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
              usedCells.add(`${centerRow + dr},${centerCol + dc}`);
          }
      }

      while (enemies.length < ENEMY_COUNT) {
          const r = Math.floor(Math.random() * mazeRows);
          const c = Math.floor(Math.random() * mazeCols);
          const key = `${r},${c}`;
          if (usedCells.has(key)) continue;
          usedCells.add(key);

          const x = mazeOffsetX + c * cellSize + cellSize / 2;
          const y = mazeOffsetY + r * cellSize + cellSize / 2;

          const el = document.createElement('div');
          el.className = 'maze-enemy';
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          $gamePlayground.appendChild(el);

          enemies.push({ x, y, el });
      }

      startEnemyLoop();
  };
  ```

  **BFS pathfinding — `moveEnemyTowardPlayer()` (desktop.js):**
  ```js
  const getOpenNeighbors = (row, col) => {
      const nb = [];
      const cell = mazeGrid[row][col];
      if (!cell.top && row > 0) nb.push({ r: row - 1, c: col });
      if (!cell.bottom && row < mazeRows - 1) nb.push({ r: row + 1, c: col });
      if (!cell.left && col > 0) nb.push({ r: row, c: col - 1 });
      if (!cell.right && col < mazeCols - 1) nb.push({ r: row, c: col + 1 });
      return nb;
  };

  const moveEnemyTowardPlayer = (enemy) => {
      const eCol = Math.floor((enemy.x - mazeOffsetX) / cellSize);
      const eRow = Math.floor((enemy.y - mazeOffsetY) / cellSize);
      const pCol = Math.floor((ballState.x - mazeOffsetX) / cellSize);
      const pRow = Math.floor((ballState.y - mazeOffsetY) / cellSize);
      const safeECol = Math.max(0, Math.min(mazeCols - 1, eCol));
      const safeERow = Math.max(0, Math.min(mazeRows - 1, eRow));

      // BFS to find direction toward player
      const target = `${pRow},${pCol}`;
      const start = `${safeERow},${safeECol}`;
      if (start === target) {
          const dx = ballState.x - enemy.x;
          const dy = ballState.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy.x += (dx / dist) * ENEMY_SPEED;
          enemy.y += (dy / dist) * ENEMY_SPEED;
          return;
      }

      const visited = new Set();
      const queue = [{ r: safeERow, c: safeECol, firstR: -1, firstC: -1 }];
      visited.add(start);
      let nextR = safeERow;
      let nextC = safeECol;

      while (queue.length > 0) {
          const cur = queue.shift();
          if (`${cur.r},${cur.c}` === target) {
              nextR = cur.firstR;
              nextC = cur.firstC;
              break;
          }
          for (const nb of getOpenNeighbors(cur.r, cur.c)) {
              const key = `${nb.r},${nb.c}`;
              if (visited.has(key)) continue;
              visited.add(key);
              queue.push({
                  r: nb.r, c: nb.c,
                  firstR: cur.firstR === -1 ? nb.r : cur.firstR,
                  firstC: cur.firstC === -1 ? nb.c : cur.firstC
              });
          }
      }

      // Move toward center of next cell
      const targetX = mazeOffsetX + nextC * cellSize + cellSize / 2;
      const targetY = mazeOffsetY + nextR * cellSize + cellSize / 2;
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      enemy.x += (dx / dist) * ENEMY_SPEED;
      enemy.y += (dy / dist) * ENEMY_SPEED;
  };
  ```

  **Enemy collision + game loop (desktop.js):**
  ```js
  const startEnemyLoop = () => {
      const tick = () => {
          if (gameOver || !ballInitialized) return;
          for (const enemy of enemies) {
              moveEnemyTowardPlayer(enemy);
              enemy.el.style.left = enemy.x + 'px';
              enemy.el.style.top = enemy.y + 'px';
          }
          enemyAnimId = requestAnimationFrame(tick);
      };
      enemyAnimId = requestAnimationFrame(tick);
  };

  const checkEnemyCollision = () => {
      if (gameOver) return;
      const ballRadius = 12;
      for (const enemy of enemies) {
          const dx = ballState.x - enemy.x;
          const dy = ballState.y - enemy.y;
          if (dx * dx + dy * dy < (ballRadius + ENEMY_RADIUS) * (ballRadius + ENEMY_RADIUS)) {
              triggerGameOver();
              return;
          }
      }
  };
  ```

---

- **Game Over screen**
  
  Vergelijkbaar met Victory screen. Rood X-icoon, "Game Over" titel, "Je bent gepakt!" bericht, "Try Again" knop.

  **Toegevoegde code — `triggerGameOver()` (desktop.js):**
  ```js
  const triggerGameOver = () => {
      gameOver = true;
      if (enemyAnimId) { cancelAnimationFrame(enemyAnimId); enemyAnimId = null; }
      bgMusic.pause();
      if ($gameOverOverlay) $gameOverOverlay.classList.add('active');
  };
  ```

  - Achtergrondmuziek stopt bij game over (`bgMusic.pause()`).
  - Enemy animation loop stopt (`cancelAnimationFrame`).
  - "Try Again" knop roept `resetGame()` aan → nieuw doolhof, nieuwe orbs, nieuwe vijandposities.

---

#### Plan voor volgende week (MVP 4)

Zie de [Week 4 planning](#week-4--mvp-4-bonus--polish) hierboven: 
- Audio: Microfoon-input via `getUserMedia` + Web Audio API
- "Blazen detecteren" → Vijanden bevriezen voor 2 seconden + cooldown
- UI/UX: Game over/win schermen polijsten
- Cross-device testing (iPhone/Android)
- README & AI reflectie afronden

---

## 🤖 AI Reflectie

In dit project maak ik gebruik van AI (Copilot en Gemini) als mijn persoonlijke assistent en tutor. Hieronder lees je hoe ik AI precies inzet, per week.

### Week 1 — Waarvoor heb ik AI gebruikt?

- **Uitleg van concepten:**  
  De GitHub gids uit de les legt goed uit hoe je iets typt, maar soms begreep ik niet precies waarom bepaalde stappen nodig waren. Ik heb AI gevraagd om moeilijke termen zoals **"Signaling"** en het verschil tussen **"WebSockets"** en **"WebRTC"** in simpele woorden uit te leggen.

- **Hulp bij Markdown:**  
  Omdat ik zelf niet zo goed ben in het schrijven en opmaken van Markdown-bestanden, heb ik AI gevraagd om deze README te structureren. Dit helpt mij om mijn voortgang te gaan presenteren.

- **Code begrijpen:**  
  Wanneer ik code uit de les-gids kopieerde, heb ik AI gevraagd om per regel uit te leggen wat er gebeurt, zodat ik begreep wat ik juist heb gedaan.

- **Controller page HTML structuur:**  
  De les-gids geeft voor de controller page (`controller.html`) alleen de JavaScript code, maar geen volledige HTML structuur. AI heeft de HTML eromheen gegenereerd:
  - `<h1>Controller</h1>` — titel zodat je weet op welke pagina je zit
  - `<p id="status">Connecting...</p>` — statusmelding zodat je ziet of de verbinding gelukt is
  - `document.getElementById('status').textContent = ...` — update de status tekst wanneer de socket verbindt

  Ik heb dit toegevoegd omdat de guide alleen de JS logica toont en het zonder HTML structuur niet bruikbaar is. De visuele feedback is belangrijk zodat je als gebruiker weet of je verbonden bent met de desktop.

---

### Week 1 — Kritische reflectie

#### Wat ging goed?
- AI helpt mij om sneller door de stof te gaan die niet diep genoeg wordt uitgelegd in de standaard documentatie.
- Bij de controller page heeft AI mij geholpen om de gaten in de guide op te vullen (HTML structuur, visuele feedback), zonder dat het de kernlogica veranderde.

#### Wat doe ik zelf?
- Elke regel code die AI voorstelt test en probeer ik eerst zelf te begrijpen voordat ik het in mijn project zet.
- De JavaScript logica heb ik zelf uit de les-gids overgenomen. AI heeft hier niets aan veranderd.

#### Waar moet ik op letten?
- Ik moet opletten dat ik niet blind code overneem. Bij de controller page heb ik bewust gevraagd wat er ontbrak aan de guide-code, zodat ik het verschil begrijp tussen wat uit de les komt en wat AI toevoegt.
- Het is belangrijk om altijd te weten welke stukken van AI komen, zodat ik dit eerlijk kan verantwoorden.

---

### Week 2 — Waarvoor heb ik AI gebruikt?

Tijdens de ontwikkeling van MVP 2 heb ik intensief gebruikgemaakt van generatieve AI (Gemini en Copilot) om de complexe WebRTC-handshake en de visuele game-interface te realiseren.

- **Hulp bij Markdown (README):**  
  Omdat ik zelf niet goed ben in Markdown, heb ik Copilot gevraagd om de development diary voor week 2 te schrijven en structureren. Ik gaf de punten die ik wilde behandelen en de AI-prompts die ik had gebruikt, en Copilot zette dit om naar een leesbare diary met inklapbare prompt-secties.

- **Architectuur — Van Server naar Peer-to-Peer:**  
  Gemini hielp me het conceptuele verschil te begrijpen tussen WebSockets (Signaling) en WebRTC (Data Transfer). Zie de prompts in de [MVP 2 diary](#mvp-2-webrtc-data-channels--game-interface).

- **Signaling code toepassen:**  
  Ik had de code uit de les maar wist niet hoe ik het in mijn project moest integreren. Gemini legde de flow uit (desktop = host, smartphone = controller via QR-code) en gaf een voorbeeld voor QR-code generatie.

- **Visueel ontwerp & interface:**  
  Copilot genereerde de volledige CSS voor het futuristische thema (desktop én controller) op basis van mijn korte beschrijving.

- **Countdown timer & game flow:**  
  Copilot maakte de countdown-overlay en het (lege) game-scherm, gesynchroniseerd via het data channel.

- **Gyroscoop & iOS permissies:**  
  Gemini hielp me de MDN `DeviceOrientationEvent` API toe te passen en het iOS-permissieprobleem op te lossen.

- **Disconnect-afhandeling:**  
  Gemini gaf drie methodes om verbindingsverlies te detecteren en een code-voorbeeld voor een error-overlay.

---

### Week 2 — Kritische reflectie

#### 1. Architectuur: Van Server naar Peer-to-Peer

- **Wat de AI deed:** Gemini hielp me het conceptuele verschil te begrijpen tussen WebSockets (Signaling) en WebRTC (Data Transfer).
- **Mijn bijsturing:** Hoewel de AI een standaard WebRTC-voorbeeld gaf, heb ik de code uit de les handmatig geïntegreerd in de signaling server. Ik heb de AI-code aangepast zodat de `socket.id` van de desktop specifiek via een QR-code wordt doorgegeven, in plaats van een handmatige ID-invoer. Dit was cruciaal voor de gebruiksvriendelijkheid.

#### 2. De "iOS Barrière" & UX

- **Wat de AI deed:** De AI wees me op de `DeviceOrientationEvent.requestPermission()` API voor iOS en de noodzaak voor HTTPS.
- **Mijn bijsturing:** De AI stelde voor om de permissie direct bij het laden van de pagina te vragen, maar uit eigen tests bleek dat dit door Safari werd geblokkeerd. Ik heb daarom zelf een "Start Game" flow ontworpen met een expliciet permissie-scherm op de controller. Hierdoor voldoe ik aan de "User Gesture" eis van Apple.

#### 3. Visueel Ontwerp & Feedback

- **Wat de AI deed:** Copilot genereerde de basis CSS voor het futuristische thema en de countdown-animatie.
- **Mijn bijsturing:** De gegenereerde CSS was erg zwaar. Ik heb de code opgeschoond door onnodige animaties te verwijderen die de latency op mobiele apparaten negatief beïnvloedden. Ook heb ik de "tilt-dot" visualisatie op de controller zelf toegevoegd; de AI wilde alleen de data versturen, maar ik vond dat de gebruiker visuele feedback nodig had op de telefoon zelf om te zien of de sensoren werkten.

#### 4. Foutafhandeling (Disconnects)

- **Wat de AI deed:** Gemini leverde de logica voor `oniceconnectionstatechange`.
- **Mijn bijsturing:** Ik heb deze logica uitgebreid zodat de desktop niet alleen een foutmelding geeft, maar ook direct de QR-code opnieuw genereert. Dit zorgt ervoor dat de game direct herstartbaar is zonder dat de gebruiker de browser op de desktop hoeft te verversen.

#### 5. De Verschuiving van Ontwerper naar Regisseur

- **Wat me opviel:** Een van de meest verrassende momenten was hoe Copilot, na slechts een korte beschrijving van mijn concept, een interface genereerde die direct de juiste "game-vibe" raakte. De keuze voor het Orbitron-font en het donkere kleurenschema met neon-accenten sloot naadloos aan bij wat ik in mijn hoofd had, zonder dat ik zelf uren in Figma heb gezeten.
- **Mijn reflectie:** Het voelt ergens onwerkelijk en zelfs een beetje "raar" dat ik zelf zo weinig visueel heb ontworpen, terwijl het resultaat er zo professioneel uitziet. Dit dwong me om mijn rol te herdefinieren: ik was niet de tekenaar, maar de **art director**. Ik moest de output van de AI kritisch beoordelen, de bruikbaarheid testen (waren de knoppen op mobiel groot genoeg?) en de code opschonen waar deze te complex werd. Hoewel de AI het "tekenwerk" deed, bleef ik verantwoordelijk voor de functionele samenhang en de uiteindelijke gebruikerservaring.

#### Conclusie

AI was een enorme versneller voor de boilerplate code (zoals CSS-grids en WebRTC-listeners), maar mijn eigen inbreng was essentieel voor de user experience en het oplossen van apparaat-specifieke problemen (iOS permissies).

---

### Week 3 — Kritische Reflectie

#### 1. De Shift van "Bouwen" naar "Optimaliseren"

- **Wat ik deed:** Ik bouwde eerst het doolhof als 350+ DOM divs (standaard instinct). Na performance testen bleek dit een ramp — fps droop naar ~15.
- **Wat de AI deed:** Copilot wees op het "Canvas vs. DOM" dilemma en stelde voor om op Canvas te renderen i.p.v. DOM.
- **Mijn bijsturing:** Ik heb zelf Canvas geïmplementeerd, maar eerst moest ik de native Canvas API begrijpen. Backend-rendering (Canvas) is sneller dan frontend-dom-manipulation voor grote aantallen elementen.
- **Lering:** Performance problemen vereisen soms architecturale keuzes, niet alleen CSS hacks. AI helpt de symptomen te diagnosticeren, maar ik moest zelf de remedie implementeren.

#### 2. Pathfinding: Van "Probeer alles" naar "Wees intelligent"

- **Wat ik wilde:** Vijanden die de speler "stompzinnig" achtervolgen (altijd naar de dichtsbijzijnde speler).
- **Wat de AI opperde:** BFS zou eleganter zijn — kortste pad altijd.
- **Mijn bijsturing:** Ik implementeerde BFS eerst als pure JavaScript (geen libraries). Dit was een **Aha!-moment**: BFS is niet moeilijk, je hoeft alleen maar een queue bij te houden en te controleren of je de goal hebt bereikt. Zelfs met BFS is pathfinding per-frame **nog steeds snel** omdat het grid klein is (25×14 cells).
- **Lering:** Algoritme-keuzes matter. Beginnercodeers kiezen vaak voor "brute force", maar kleine algoritme-verbeteringen geven dramatische winsten.

#### 3. Audio-ontgrendeling: Een Browserprobleempje

- **Wat ik deed:** `<audio>.play()` in `playCollectSound()` gooide een NotAllowedError.
- **Wat ik niet wist:** Moderne browsers vereisen minimaal één user-gesture voordat het geluid mag afspelen. Dit is om spamming/malware tegen te gaan.
- **Mijn oplossing:** Geluidsontgrendeling bij eerste klik op het veld (of knop druk). Daarna speelt `play()` altijd af.
- **Reflectie:** Dit voelde als "een browsergame", totdat ik besefte dat dit een **serieuze veiligheidsfeature** is. Websites moeten niet zomaar geluid afspelen zonder gebruikerstoestemming.

#### 4. Visuele Consistentie: Het Cyberpunk Thema

- **Wat ik deed:** Orbs in geel (#ffd600), vijanden in rood (#ff1744), muren in paars. Glow-effecten overal (consistent met desktops & controller van MVP 2).
- **Waarom dit telt:** Een spel voelt "professioneel" niet door mechanics, maar door **cohesie**. Alle elementen "voelen hetzelfde" omdat ze dezelfde kleurpalette en glow-effecten delen.

#### 5. Code-organisatie: Files splitsen

- **Wat ik deed:** desktop.js was 300+ regels (onleesbaar). Ik splitste in desktop-maze.js, desktop-orbs.js, desktop-enemies.js.
- **Impact:** Veel leesbaar. Elke file ~80-100 regels met één duidelijk doel. Makkelijker te debuggen en uit te breiden (MVP 4: audio-freeze in desktop-audio.js).

#### Conclusie

MVP 3 was de overgang van **prototype** naar **speelbaar spel**. De AI hielp met architektuurtips, maar de echte implementatie (BFS, Canvas rendering, event listeners) was **mijn werk**. Het voelt goed om te zeggen: "Ik heb dit zelf gebouwd, met AI als stuurman." 