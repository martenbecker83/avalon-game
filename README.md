# Avalon

Een familie-platformgame voor iPad en laptop, gewoon te spelen in de browser.

Speel alleen of met z'n tweeën. Kies een van de acht personages, elk met een eigen superkracht, en speel door vier werelden: **Oerwoud**, **Paarse Wolken**, **Onderwater** en **Lucht**. Elke wereld heeft 5 levels met checkpoints. Aan het eind van elk level wacht een mini-baas, die elk level sterker wordt. In level 5 versla je de echte eindbaas en bevrijd je de gevangen mensen.

## Personages

| Personage | Wapen | Superkracht |
|---|---|---|
| Avalon | Bordkrijtjes | Supersnel, gooit krijtjes die vanzelf op de dichtstbijzijnde vijand afgaan. Speciale knop: strikje op de dichtstbijzijnde vijand, die is dan even poeslief en ongevaarlijk |
| Fu-Chi | Klauwen + haarbal | Supersnel krabben, springt het hoogst. Speciale knop: haarbal spugen |
| Papa | Bierflesjes | Veelzijdig: gooit ver in een boogje, schuim raakt vijanden in de buurt |
| Mama | Microfoon | Veelzijdig: schreeuwgolf die door alle vijanden heen gaat |
| Oma | Appeltaart | Langzaam, kort bereik, veel kracht; de vijand staat even stil |
| Opa | Moersleutel | Langzaam, kort bereik, de meeste kracht |
| Lolo | Hamer | Langzaam, klap op de grond die alle vijanden vlak naast hem raakt |
| Lola | Rijst | Langzaam, gooit een handvol rijst: dichtbij raakt bijna elke korrel |

## Een spel

Je kiest één personage en speelt daarmee het hele spel. Je hebt 3 levens voor alle vier de werelden samen, en binnen een leven 3 hartjes. Zijn je hartjes op, dan verlies je een leven en ga je terug naar het laatste checkpoint. Bij elk nieuw level krijg je je hartjes terug.

Je kiest zelf welke wereld je speelt, maar je blijft in die wereld tot je hem hebt uitgespeeld. Daarna kies je de volgende. Uitgespeelde werelden krijgen een sticker en je krijgt er een leven bij. Het spel is afgelopen als je alle vier de werelden hebt uitgespeeld, als je levens op zijn (game over) of als je stopt via de pauzeknop. Je score wordt dan altijd geregistreerd en je ziet meteen het scorebord, met jouw nieuwe score gemarkeerd.

## Met z'n tweeën

Na **Spelen** kies je 1 of 2 spelers. Twee spelers kunnen niet hetzelfde personage kiezen en spelen samen in één beeld:

- **Op dit apparaat:** met twee controllers (bijv. SteelSeries Nimbus), of samen op één toetsenbord.
- **Ieder op een eigen apparaat:** één speler maakt een spel en krijgt een code van 4 letters, de ander kiest *Meedoen* en tikt de code in. Zit op hetzelfde wifi-netwerk. Het apparaat van speler 1 rekent het spel uit en stuurt het beeld rechtstreeks naar speler 2.

De achterste speler bepaalt waar het beeld is. Loopt de voorste vooruit, dan zoomt de camera uit, maar verder dan de rand van het beeld kan hij niet. De levens en munten zijn samen; ieder heeft eigen hartjes. Zijn de hartjes van één speler op, dan kost dat een leven en komt hij na een paar tellen terug naast de ander. Mini-bazen en eindbazen zijn met z'n tweeën wat sterker. Er is een apart scorebord voor 2 spelers, met beide personages en beide initialen.

## Vijanden

Elke wereld heeft 11 soorten vijanden (44 in totaal) en elk level een andere mix daarvan. Nieuw gedrag: duikers (toekan, uil, meeuw, haai, adelaar) duiken op je af, spinnen en ijspegels vallen naar beneden als je eronder loopt, palingen schieten uit het zand, en op zee-egels en ijspegels kun je niet springen.

## Munten

- Vijand verslaan: 1 munt
- Moeilijke vijand verslaan: 2 munten
- Groene A-token vinden (één per level, goed verstopt): 5 munten
- Mini-baas verslaan: 10 munten
- Eindbaas verslaan: 25 munten

## Besturing

- **Laptop:** pijltjes of A/D lopen, spatie of pijl omhoog springen, X of J aanvallen, C of L speciale aanval, Esc pauze
- **2 spelers op één toetsenbord:** speler 1 A/D lopen, W springen, F aanvallen, G speciaal; speler 2 pijltjes, pijl omhoog springen, K aanvallen, L speciaal
- **Controller** (zoals de SteelSeries Nimbus): stick of pijltjes lopen, A springen, B of X aanvallen, Y speciaal, Menu pauze. In de menu's kies je met de stick en A, en ga je terug met B.
- **iPad:** schuifknop links om te lopen, knoppen rechts om aan te vallen en te springen (Avalon en Fu-Chi hebben een extra roze knop voor hun speciale aanval) (speel met het scherm liggend). Zet de game via Delen > Zet op beginscherm als app op je iPad.
- In de Lucht-wereld kun je dubbel springen, onderwater kun je zwemmen door steeds op springen te drukken.

## Scores

Aan het eind van een spel typ je je initialen in. Het scorebord toont de top 10, met per score het personage, de stickers van de uitgespeelde werelden en de datum. Er is een lijst voor iedereen en een lijst van je eigen apparaat. Een lopend spel wordt op het apparaat bewaard, zodat je later verder kunt spelen.

## Techniek

- Gewone HTML, CSS en JavaScript, geen build-stap nodig. Alle personages en werelden worden in code getekend; er staan geen foto's in de game.
- Muziek en geluidseffecten worden live gemaakt met WebAudio en zijn in het hoofdmenu los aan en uit te zetten.
- Het gedeelde scorebord draait als Netlify Function (`netlify/functions/scores.mjs`) met Netlify Blobs als opslag, met een lijst voor 1 speler en een voor 2 spelers.
- Samen spelen op twee apparaten gebruikt WebRTC (rechtstreeks tussen de browsers). Alleen het eerste contact met de code loopt via `netlify/functions/rooms.mjs`.

Lokaal testen: start een eenvoudige webserver in deze map, bijvoorbeeld `python3 -m http.server`, en open `http://localhost:8000`. Het algemene scorebord en samen spelen op twee apparaten werken alleen op Netlify (of met `netlify dev`).
