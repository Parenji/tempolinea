// Copia la versione 1 (tempolinea classica, nella radice del repo) in dist/legacy/,
// così resta raggiungibile su /legacy/ accanto alla nuova app. I file originali non vengono toccati.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(import.meta.dirname, '../dist/legacy');
mkdirSync(out, { recursive: true });
for (const dir of ['css', 'js', 'images']) cpSync(resolve(root, dir), resolve(out, dir), { recursive: true });
cpSync(resolve(root, 'manifest.json'), resolve(out, 'manifest.json'));

// La v1 registrava /sw.js (che non esisteva): ora /sw.js è quello della nuova app, quindi lo togliamo.
let html = readFileSync(resolve(root, 'index.html'), 'utf8');
html = html.replace(/<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/, '<!-- service worker della v1 rimosso nella copia /legacy/ -->');
if (html.includes("serviceWorker.register('/sw.js')")) throw new Error('copy-legacy: registrazione del service worker non rimossa');
writeFileSync(resolve(out, 'index.html'), html);
if (!existsSync(resolve(out, 'js/init.js'))) throw new Error('copy-legacy: copia incompleta');
console.log('v1 copiata in dist/legacy/');
