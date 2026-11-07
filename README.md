# Avalon

Een familie-platformgame voor iPad en laptop, gewoon te spelen in de browser.

Kies een van de acht personages, elk met een eigen superkracht, en speel door vier werelden: **Oerwoud**, **Paarse Wolken**, **Onderwater** en **Lucht**. Elke wereld heeft 5 levels met checkpoints. Aan het eind van elk level wacht een mini-baas, die elk level sterker wordt. In level 5 versla je de echte eindbaas en bevrijd je de gevangen mensen.

## Personages

| Personage | Wapen | Superkracht |
|---|---|---|
| Avalon | Zwaard | Snelle slagen dichtbij, de meeste schade |
| Papa | Bierflesjes | Gooit in een boogje, schuim raakt vijanden in de buurt |
| Mama | Microfoon | Schreeuwgolf die door alle vijanden heen gaat |
| Fu-Chi | Klauwen | Supersnel krabben, snelste en hoogste springer |
| Oma | Appeltaart | Taart in het gezicht: de vijand staat even stil |
| Opa | Moersleutels | Draaiende sleutels ver en recht vooruit |
| Lolo | Hamer | Klap op de grond die alle vijanden dichtbij raakt |
| Lola | Pannenkoeken | Pannenkoek-boemerang die twee keer raakt |

## Munten

- Vijand verslaan: 1 munt
- Moeilijke vijand verslaan: 2 munten
- Groene A-token vinden: 5 munten
- Mini-baas verslaan: 10 munten
- Eindbaas verslaan: 25 munten

## Besturing

- **Laptop:** pijltjes of A/D lopen, spatie of pijl omhoog springen, X of J aanvallen, Esc pauze
- **iPad:** knoppen op het scherm (speel met het scherm liggend)
- In de Lucht-wereld kun je dubbel springen, onderwater kun je zwemmen door steeds op springen te drukken.

## Scores

Na een uitgespeelde wereld (of als je stopt en je score registreert) typ je je initialen in. De score komt op het algemene scorebord voor iedereen, en op de lijst van je eigen apparaat. Voortgang per wereld wordt op het apparaat bewaard, zodat je later verder kunt spelen.

## Techniek

- Gewone HTML, CSS en JavaScript, geen build-stap nodig. Alle personages en werelden worden in code getekend; er staan geen foto's in de game.
- Muziek en geluid worden live gemaakt met WebAudio.
- Het gedeelde scorebord draait als Netlify Function (`netlify/functions/scores.mjs`) met Netlify Blobs als opslag.

Lokaal testen: start een eenvoudige webserver in deze map, bijvoorbeeld `python3 -m http.server`, en open `http://localhost:8000`. Het algemene scorebord werkt alleen op Netlify (of met `netlify dev`).
