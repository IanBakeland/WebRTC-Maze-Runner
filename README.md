# WebRTC Media Remote
**Bedien je desktop media met je smartphone.**

---

## 📖 Development Diary

### Milestone 1: De Basis & Verbinding

Deze week ben ik gestart met het opzetten van de basisstructuur van mijn project. Ik heb de volgende stappen ondernomen:

- **Project Initialisatie:**  
  Ik heb een nieuwe map aangemaakt en de nodige pakketten geïnstalleerd (`express` en `socket.io`) via de terminal.

- **Gids gevolgd:**  
  Ik heb de GitHub gids over Websockets van de les gebruikt om te begrijpen hoe een server en een client met elkaar praten.

- **Branching:**  
  Ik ben begonnen met werken in een aparte branch `feature/initial-setup-and-server` volgens de GitHub Flow methode.

- **Signaling Server:**  
  Ik heb een basis `server.js` opgezet die verbindingen accepteert. Dit is de eerste stap om later de WebRTC-verbinding te maken.

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