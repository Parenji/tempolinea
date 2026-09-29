// Stato della timeline: tutte le timeline salvate nel browser e quella aperta.
// Primo avvio: se sullo stesso indirizzo c'è la v1 (chiave `timeline_app_v3`) i dati vengono copiati da lì.
// La chiave della v1 viene solo letta, mai scritta: la vecchia app continua a funzionare con i suoi dati.
import { generateId, normalizeTimeline, readLegacyState } from './data/normalize';
import { parseImportFile, serializeExport, exportFileName, type ImportedData } from './data/io';
import { defaultSegments, type Timeline } from './data/schema';

const KEY = 'quaderno.timeline.v1';
const LEGACY_KEY = 'timeline_app_v3';

interface Saved {
  timelines: Record<string, Timeline>;
  currentId: string | null;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function load(): Saved & { fromLegacy: boolean } {
  const own = read(KEY);
  if (own) {
    try {
      const parsed = JSON.parse(own) as Saved;
      const timelines: Record<string, Timeline> = {};
      for (const [id, tl] of Object.entries(parsed.timelines ?? {})) timelines[id] = normalizeTimeline(tl);
      const currentId = parsed.currentId && timelines[parsed.currentId] ? parsed.currentId : Object.keys(timelines)[0] ?? null;
      return { timelines, currentId, fromLegacy: false };
    } catch {
      /* dati rotti: si riparte dalla v1 o da zero */
    }
  }
  const legacy = readLegacyState(read(LEGACY_KEY));
  if (legacy) return { timelines: legacy.timelines, currentId: legacy.currentTimelineId, fromLegacy: true };
  return { timelines: {}, currentId: null, fromLegacy: false };
}

const initial = load();

export const store = $state({
  timelines: initial.timelines,
  currentId: initial.currentId,
  /** true se i dati sono stati appena copiati dalla v1 */
  fromLegacy: initial.fromLegacy,
});

export function current(): Timeline | null {
  return store.currentId ? store.timelines[store.currentId] ?? null : null;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ timelines: store.timelines, currentId: store.currentId }));
    return true;
  } catch {
    return false;
  }
}

if (initial.fromLegacy) save();

function uniqueName(base: string): string {
  const taken = new Set(Object.values(store.timelines).map((t) => t.name.trim().toLowerCase()));
  let name = base;
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} (${n})`;
  return name;
}

export function addImported(data: ImportedData): Timeline {
  const id = generateId();
  const tl: Timeline = {
    id,
    name: uniqueName(data.name),
    events: data.events,
    categories: data.categories,
    segments: data.segments ?? defaultSegments(),
  };
  store.timelines[id] = tl;
  store.currentId = id;
  save();
  refreshHistory();
  return tl;
}

export function replaceCurrent(data: ImportedData) {
  const tl = current();
  if (!tl) return addImported(data);
  edit('Importa', (t) => {
    t.events = data.events;
    t.categories = data.categories;
    if (data.segments) t.segments = data.segments;
  });
  return current()!;
}

// ---------------------------------------------------------------- modifiche, annulla e ripeti
// Solo in memoria, come nella v1: ogni timeline ha la sua cronologia, che si svuota ricaricando la pagina.
const MAX_UNDO = 50;
const undoStacks = new Map<string, Timeline[]>();
const redoStacks = new Map<string, Timeline[]>();
export const history = $state({ canUndo: false, canRedo: false });

function refreshHistory() {
  const id = store.currentId ?? '';
  history.canUndo = (undoStacks.get(id)?.length ?? 0) > 0;
  history.canRedo = (redoStacks.get(id)?.length ?? 0) > 0;
}

const snap = (tl: Timeline) => structuredClone($state.snapshot(tl)) as Timeline;

/** Applica una modifica alla timeline aperta, con annulla e salvataggio. */
export function edit<T>(_label: string, fn: (tl: Timeline) => T): T | undefined {
  const tl = current();
  if (!tl) return undefined;
  const undo = undoStacks.get(tl.id) ?? [];
  undo.push(snap(tl));
  if (undo.length > MAX_UNDO) undo.shift();
  undoStacks.set(tl.id, undo);
  redoStacks.set(tl.id, []);
  const result = fn(tl);
  save();
  refreshHistory();
  return result;
}

function swap(from: Map<string, Timeline[]>, to: Map<string, Timeline[]>): boolean {
  const tl = current();
  const prev = tl && from.get(tl.id)?.pop();
  if (!tl || !prev) return false;
  to.set(tl.id, [...(to.get(tl.id) ?? []), snap(tl)]);
  store.timelines[tl.id] = prev;
  save();
  refreshHistory();
  return true;
}

export const undo = () => swap(undoStacks, redoStacks);
export const redo = () => swap(redoStacks, undoStacks);

export function switchTimeline(id: string) {
  if (!store.timelines[id]) return;
  store.currentId = id;
  save();
  refreshHistory();
}

// ---------------------------------------------------------------- timeline

export function renameCurrent(name: string) {
  edit('Rinomina timeline', (tl) => { tl.name = name.trim(); });
}

export function isNameTaken(name: string, exceptId: string | null = null) {
  const n = name.trim().toLowerCase();
  return Object.values(store.timelines).some((t) => t.id !== exceptId && t.name.trim().toLowerCase() === n);
}

export function deleteCurrent(): boolean {
  const tl = current();
  if (!tl) return false;
  delete store.timelines[tl.id];
  undoStacks.delete(tl.id);
  redoStacks.delete(tl.id);
  store.currentId = Object.keys(store.timelines)[0] ?? null;
  save();
  refreshHistory();
  return true;
}

export async function readImportFile(file: File) {
  return parseImportFile(await file.text());
}

/** Scarica la timeline aperta nello stesso formato JSON della v1. */
export function downloadCurrent() {
  const tl = current();
  if (!tl) return;
  const blob = new Blob([serializeExport($state.snapshot(tl) as Timeline)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: exportFileName(tl) });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const EXAMPLE_URL =
  'https://gist.githubusercontent.com/Parenji/02b79bb98905671eca2d5a2dd8fa5dc6/raw/14eae517171094a91a401e02010f011f5b366eb4/gistfile1.json';

export async function loadExample() {
  const res = await fetch(EXAMPLE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const parsed = parseImportFile(await res.text());
  if (!parsed.ok) throw new Error('formato non valido');
  return addImported(parsed.data);
}

export function newEmpty(name = 'Nuova timeline') {
  const tl = addImported({ name, events: [], categories: [], segments: null });
  refreshHistory();
  return tl;
}

export { normalizeTimeline };
