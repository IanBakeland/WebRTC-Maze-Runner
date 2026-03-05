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

- **Kantelen (Gyroscoop):**  
  In plaats van knoppen gebruik je de gyroscoop. Kantel je telefoon naar links → het balletje rolt naar links. Dit voelt natuurlijk voor een doolhof.

- **Blazen voor een Boost (Audio):**  
  Blaas hard in de microfoon van je smartphone → De ghosts bevriezen voor 2 seconden. Dit heeft natuurlijk een cooldown. 

---

## 📖 Development Diary

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
- De echte doolhof-gameplay bouwen (muren, munten, vijand)
- Collision detection implementeren
- Bonusfeatures: blaas-boost (audio), schud-freeze (accelerometer)

---

## 🤖 AI Reflectie

In dit project maak ik gebruik van AI (Copilot) als mijn persoonlijke assistent en tutor. Hieronder lees je hoe ik AI precies inzet:

### Waarvoor heb ik AI gebruikt?

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

### Kritische reflectie

#### Wat ging goed?
- AI helpt mij om sneller door de stof te gaan die niet diep genoeg wordt uitgelegd in de standaard documentatie.
- Bij de controller page heeft AI mij geholpen om de gaten in de guide op te vullen (HTML structuur, visuele feedback), zonder dat het de kernlogica veranderde.

#### Wat doe ik zelf?
- Elke regel code die AI voorstelt test en probeer ik eerst zelf te begrijpen voordat ik het in mijn project zet.
- De JavaScript logica heb ik zelf uit de les-gids overgenomen. AI heeft hier niets aan veranderd.

#### Waar moet ik op letten?
- Ik moet opletten dat ik niet blind code overneem. Bij de controller page heb ik bewust gevraagd wat er ontbrak aan de guide-code, zodat ik het verschil begrijp tussen wat uit de les komt en wat AI toevoegt.
- Het is belangrijk om altijd te weten welke stukken van AI komen, zodat ik dit eerlijk kan verantwoorden.