// ================================================================
//  TEST SETUP — carica l'app in jsdom
// ================================================================
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Leggi index.html
let html = readFileSync(resolve(projectRoot, 'index.html'), 'utf-8');

// Rimuovi tag <script src="..."> e <link href="..."> per evitare che jsdom tenti di
// scaricarli via HTTP (causerebbe ECONNREFUSED). CSS e JS sono comunque gestiti da noi.
html = html.replace(/<script\b[^>]*src=["'][^"']*["'][^>]*>\s*<\/script>/gi, '');
html = html.replace(/<link\b[^>]*href=["'][^"']*["'][^>]*>/gi, '');

// Crea DOM
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
});

// Esponi window/document globali
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.FocusEvent = dom.window.FocusEvent;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.navigator = dom.window.navigator;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// Esponi funzioni globali dell'app — carica ogni file come script
const scriptFiles = [
  'js/state.js',
  'js/helpers.js',
  'js/tooltip.js',
  'js/timeline.js',
  'js/categories.js',
  'js/events.js',
  'js/mini-map.js',
  'js/render.js',
  'js/search.js',
  'js/modals.js',
  'js/import-export.js',
  'js/shortcuts.js',
  // Non carichiamo init.js perché fa DOMContentLoaded init e collega tutto,
  // lo facciamo manualmente nei test
];

for (const file of scriptFiles) {
  const scriptContent = readFileSync(resolve(projectRoot, file), 'utf-8');
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = scriptContent;
  dom.window.document.body.appendChild(scriptEl);
}

// Esponi tutto dal window globale
for (const key of Object.keys(dom.window)) {
  if (typeof globalThis[key] === 'undefined') {
    globalThis[key] = dom.window[key];
  }
}

// Distruggi DOM dopo tutti i test
afterAll(() => {
  dom.window.close();
});