# Quaderno (ex Tempolinea)

Suite di strumenti per lo studio e per fare lezione (scuola media): timeline di storia, laboratori di matematica, ecc.
Pubblicata su Vercel (`tempolinea.vercel.app`). Usata da computer, iPad della scuola e proiettore.

## Struttura

- `app/`: **nuova versione** (Vite + Svelte 5 + TypeScript). Qui si lavora.
  - `src/shared/styles/`: valori di base (`tokens.css`) e stili comuni. Colori, font, spessori solo da qui.
  - `src/shared/ui/`: componenti comuni (AppHeader, Button, Segmented, Toggle, Panel, Chip).
  - `src/tools/<strumento>/`: uno strumento per cartella; ognuno ha la sua pagina HTML (`app/<strumento>/index.html`) registrata in `vite.config.ts`.
  - `src/stile/`: pagina che mostra lo stile comune.
- Radice (`index.html`, `js/`, `css/`): **versione 1 della timeline**, ancora in produzione. Non modificarla: serve come riferimento e per i test di compatibilità. Tag git: `legacy-v1`.

## Regole

- **I file JSON della timeline devono continuare a funzionare.** Il contratto è in `app/tests/compat.test.ts`: la normalizzazione nuova viene confrontata con quella della v1 (`js/helpers.js`) sugli stessi file. Mettere i file reali dell'utente in `app/tests/fixtures/private/` (ignorata da git: il repo è pubblico).
- Timeline: le posizioni si calcolano solo in `engine/layout.ts` (funzione pura, testata in `tests/layout.test.ts`); i componenti disegnano e basta. Le modifiche ai dati sono funzioni in `data/ops.ts` chiamate dentro `edit()` dello store (annulla/ripeti + salvataggio): non modificare la timeline in altri modi.
- Date storiche: mai `new Date(anno, …)` (gli anni 0–99 diventano 1900–1999). Usare `src/tools/timeline/data/dates.ts`.
- Pensare a iPad e proiettore: niente funzioni solo al passaggio del mouse, aree toccabili ≥ `var(--target)`, controllare la modalità proiettore e il tema scuro.
- Testi dell'interfaccia: scritti in italiano e passati da `t('…')` (`src/shared/i18n.ts`); la traduzione inglese va nei file `messages.en.ts`. `tests/i18n.test.ts` fallisce se una frase non ha la traduzione. Per frasi italiane uguali con significati diversi: `tc('contesto', '…')`.
- La v1 (tempolinea classica) non va eliminata né modificata finché l'utente non lo dice. La build la copia in `dist/legacy/` (`app/scripts/copy-legacy.mjs`).
- `main` = produzione su tempolinea.vercel.app (ancora la v1). Si lavora su `v2`; non fare merge su `main` senza il via esplicito dell'utente.

## Comandi (da `app/`)

```
npm run dev      # server di sviluppo
npm test         # test (vitest)
npm run check    # controllo tipi Svelte/TS
npm run build    # build in app/dist (usata da Vercel, vedi vercel.json)
```
