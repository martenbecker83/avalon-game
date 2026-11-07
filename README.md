# Avalon

Een familie-platformgame voor iPad en laptop, gewoon te spelen in de browser.

Kies een van de acht personages, elk met een eigen superkracht, en speel door vier werelden: **Oerwoud**, **Paarse Wolken**, **Onderwater** en **Lucht**. Elke wereld heeft 5 levels met checkpoints. Aan het eind van elk level wacht een mini-baas, die elk level sterker wordt. In level 5 versla je de echte eindbaas en bevrijd je de gevangen mensen.

## Personages

| Personage | Wapen | Superkracht |
|---|---|---|
| Avalon | Zwaard | Supersnel, snelle zwaardslagen dichtbij |
| Fu-Chi | Klauwen | Supersnel krabben, springt het hoogst |
| Papa | Bierflesjes | Veelzijdig: gooit ver in een boogje, schuim raakt vijanden in de buurt |
| Mama | Microfoon | Veelzijdig: schreeuwgolf die door alle vijanden heen gaat |
| Oma | Appeltaart | Langzaam, kort bereik, veel kracht; de vijand staat even stil |
| Opa | Moersleutel | Langzaam, kort bereik, de meeste kracht |
| Lolo | Hamer | Langzaam, klap op de grond die alle vijanden vlak naast hem raakt |
| Lola | Pannenkoeken | Langzaam, korte pannenkoek-boemerang die twee keer raakt |

## Een spel

Je kiest één personage en speelt daarmee het hele spel. Je hebt 3 levens voor alle vier de werelden samen, en binnen een leven 3 hartjes. Zijn je hartjes op, dan verlies je een leven en ga je terug naar het laatste checkpoint. Bij elk nieuw level krijg je je hartjes terug.

Je kiest zelf welke wereld je speelt, maar je blijft in die wereld tot je hem hebt uitgespeeld. Daarna kies je de volgende. Uitgespeelde werelden krijgen een sticker. Het spel is afgelopen als je alle vier de werelden hebt uitgespeeld, als je levens op zijn (game over) of als je stopt via de pauzeknop. Je score wordt dan altijd geregistreerd en je ziet meteen het scorebord, met jouw nieuwe score gemarkeerd.

## Munten

- Vijand verslaan: 1 munt
- Moeilijke vijand verslaan: 2 munten
- Groene A-token vinden (één per level, goed verstopt): 5 munten
- Mini-baas verslaan: 10 munten
- Eindbaas verslaan: 25 munten

## Besturing

- **Laptop:** pijltjes of A/D lopen, spatie of pijl omhoog springen, X of J aanvallen, Esc pauze
- **iPad:** joystick links om te lopen (omhoog duwen is springen), knoppen rechts om aan te vallen en te springen (speel met het scherm liggend). Zet de game via Delen > Zet op beginscherm als app op je iPad.
- In de Lucht-wereld kun je dubbel springen, onderwater kun je zwemmen door steeds op springen te drukken.

## Scores

Aan het eind van een spel typ je je initialen in. Het scorebord toont de top 10, met per score het personage, de stickers van de uitgespeelde werelden en de datum. Er is een lijst voor iedereen en een lijst van je eigen apparaat. Een lopend spel wordt op het apparaat bewaard, zodat je later verder kunt spelen.

## Techniek

- Gewone HTML, CSS en JavaScript, geen build-stap nodig. Alle personages en werelden worden in code getekend; er staan geen foto's in de game.
- Muziek en geluidseffecten worden live gemaakt met WebAudio en zijn in het hoofdmenu los aan en uit te zetten.
- Het gedeelde scorebord draait als Netlify Function (`netlify/functions/scores.mjs`) met Netlify Blobs als opslag.

Lokaal testen: start een eenvoudige webserver in deze map, bijvoorbeeld `python3 -m http.server`, en open `http://localhost:8000`. Het algemene scorebord werkt alleen op Netlify (of met `netlify dev`).
