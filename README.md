# WebRTC Maze Runner
**Bestuur een balletje door een doolhof met je smartphone.**

---

## 🎮 Het Concept: Maze Runner

### Het Doel
Jij bent een **groen balletje**. Verzamel alle witte muntjes in het doolhof.

### De Vijand
Een **rood balletje** (de "Ghost") beweegt automatisch door het doolhof. Als hij je raakt, ben je af.

### De Besturing
Je smartphone is de controller. Je bestuurt het balletje met 4 pijltjes op je telefoon, verbonden via een WebRTC data channel.

### Bonusfeatures (extra punten)

- **Kantelen (Gyroscoop):**  
  In plaats van knoppen gebruik je de gyroscoop. Kantel je telefoon naar links → het balletje rolt naar links. Dit voelt natuurlijk voor een doolhof.

- **Blazen voor een Boost (Audio):**  
  Blaas hard in de microfoon van je smartphone → het balletje krijgt een tijdelijke snelheid-boost.

- **Schudden (Accelerometer):**  
  Schud hard met je telefoon → de vijand bevriest voor 3 seconden. Handig als je vastzit of de Ghost te dichtbij is.

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

- **Branching:**  
  Ik werk met de GitHub Flow methode: feature branches per onderdeel, merge naar `main` voor een werkende MVP.

#### Plan voor volgende week (MVP 2)
- WebRTC Data Channel implementeren voor de aansturing (in plaats van Socket.io)
- Socket.io wordt dan enkel nog gebruikt als signaling layer (offer/answer/ICE candidates uitwisselen)
- Desktop experience uitbreiden: een simpel iets besturen met de smartphone (bijv. een bal, een game element)
- Duidelijke instructies toevoegen op de controller page

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