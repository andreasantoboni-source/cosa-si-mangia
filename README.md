# Cosa si mangia

Il menu settimanale di famiglia con la lista della spesa condivisa.
Tutti aprono lo stesso link dal telefono: se qualcuno cambia un pasto o spunta la spesa, gli altri lo vedono entro pochi secondi.

## Come è fatto

- `public/index.html`: l'app (una sola pagina, funziona anche aggiunta alla schermata Home).
- `netlify/functions/state.mjs`: una piccola funzione che salva menu, spesa e piatti in **Netlify Blobs**, l'archivio gratuito di Netlify.
- Per leggere e modificare serve il **codice di famiglia**, impostato nella variabile `FAMILY_PIN`. Maiuscole, minuscole e spazi all'inizio o alla fine non contano.
- Al primo avvio il ricettario e il menu di partenza vengono caricati da `netlify/functions/seed-piatti.json` e `seed-menu.json`.

## Messa online (una volta sola, circa 15 minuti)

1. **Netlify**: accedi a app.netlify.com con il tuo account GitHub → *Add new project* → *Import an existing project* → *GitHub* → scegli il repository `cosa-si-mangia`. Lascia le impostazioni di build come sono (le legge da `netlify.toml`) e premi *Deploy*.
2. **Codice di famiglia**: nel sito appena creato vai su *Site configuration* → *Environment variables* → *Add a variable*. Nome: `FAMILY_PIN`. Valore: una frase facile da ricordare, di almeno 8 caratteri (per esempio `pasta e ceci della nonna`).
3. **Ripubblica** perché la variabile venga letta: *Deploys* → *Trigger deploy* → *Deploy site*.
4. **Nome del sito** (facoltativo): *Site configuration* → *Change site name*, per esempio `cosa-si-mangia-famiglia` → l'indirizzo diventa `cosa-si-mangia-famiglia.netlify.app`.
5. **Condividi** nel gruppo WhatsApp di famiglia il link e, in un messaggio separato, il codice. Dal telefono: apri il link → inserisci il codice → *Condividi* → *Aggiungi alla schermata Home* (iPhone) oppure menu ⋮ → *Aggiungi a schermata Home* (Android).

Le voci dei menu di Netlify possono cambiare leggermente nel tempo.

## Aggiornamenti

Ogni modifica caricata su GitHub viene pubblicata da Netlify in automatico.
I dati (menu, spesa, piatti aggiunti) restano salvati: non vengono cancellati dagli aggiornamenti.

## Cambiare il codice di famiglia

Modifica `FAMILY_PIN` su Netlify e ripubblica. A chi ha già l'app verrà chiesto il nuovo codice.
