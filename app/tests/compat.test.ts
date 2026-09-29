// Contratto di compatibilità con la versione 1: i file JSON devono continuare a funzionare.
// Il codice di normalizzazione della v1 viene eseguito così com'è e confrontato con quello nuovo.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { normalizeTimeline, readLegacyState } from '../src/tools/timeline/data/normalize';
import { parseImportFile, serializeExport } from '../src/tools/timeline/data/io';

const LEGACY_HELPERS = resolve(import.meta.dirname, '../../js/helpers.js');

function loadLegacySanitizers() {
  const ctx: Record<string, any> = { document: {}, window: {}, Date, Math, String, Array, Object };
  runInNewContext(readFileSync(LEGACY_HELPERS, 'utf8'), ctx);
  return {
    events: (e: unknown[]) => ctx.sanitizeImportedEvents(structuredClone(e)),
    categories: (c: unknown[]) => ctx.sanitizeImportedCategories(structuredClone(c)),
  };
}

const privateDir = resolve(import.meta.dirname, 'fixtures/private');
const fixtures = [
  resolve(import.meta.dirname, 'fixtures/compat-sample.json'),
  ...(existsSync(privateDir)
    ? readdirSync(privateDir).filter((f) => f.endsWith('.json')).map((f) => resolve(privateDir, f))
    : []),
];

describe.each(fixtures.map((f) => [f.split('/').slice(-2).join('/'), f]))('%s', (_label, file) => {
  const text = readFileSync(file, 'utf8');
  const original = JSON.parse(text);

  it('viene importato senza errori di struttura', () => {
    const res = parseImportFile(text);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.problems).toEqual([]);
    expect(res.data.events).toHaveLength(original.timeline.events.length);
  });

  it('dà lo stesso risultato della normalizzazione della v1', () => {
    const legacy = loadLegacySanitizers();
    const res = parseImportFile(text);
    if (!res.ok) throw new Error('import fallito');
    expect(res.data.events).toEqual(legacy.events(original.timeline.events));
    expect(res.data.categories).toEqual(legacy.categories(original.timeline.categories));
  });

  it('export → import non perde nulla (andata e ritorno)', () => {
    const tl = normalizeTimeline(original.timeline);
    const again = JSON.parse(serializeExport(tl));
    expect(normalizeTimeline(again.timeline)).toEqual(tl);
  });

  it("l'export è leggibile dalla v1 (stessa forma del file)", () => {
    const exported = JSON.parse(serializeExport(normalizeTimeline(original.timeline)));
    expect(Object.keys(exported).sort()).toEqual(['exportDate', 'timeline']);
    expect(Array.isArray(exported.timeline.events)).toBe(true);
    expect(Array.isArray(exported.timeline.categories)).toBe(true);
  });

  it('la normalizzazione è idempotente', () => {
    const once = normalizeTimeline(original.timeline);
    expect(normalizeTimeline(once)).toEqual(once);
  });
});

describe('import di formati diversi', () => {
  it('accetta il backup della prima versione { events, categories }', () => {
    const res = parseImportFile(JSON.stringify({ events: [{ id: 1, startYear: 10, title: 'x', categoryId: 3 }] }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.events[0]).toMatchObject({ id: '1', categoryIds: ['3'], type: 'event' });
    expect(res.data.categories).toEqual([]);
    expect(res.data.segments).toBeNull();
  });

  it('rifiuta JSON non valido e formati sconosciuti', () => {
    expect(parseImportFile('{nope')).toEqual({ ok: false, error: 'json' });
    expect(parseImportFile('{"foo": 1}')).toEqual({ ok: false, error: 'format' });
  });

  it('segnala eventi senza anno invece di rompersi dopo', () => {
    const res = parseImportFile(JSON.stringify({ timeline: { name: 't', events: [{ id: 'a', title: 'senza anno' }], categories: [] } }));
    expect(res.ok && res.problems.map((p) => p.path)).toEqual(['events.0.startYear']);
  });
});

describe('stato salvato nel browser dalla v1', () => {
  it('viene letto e normalizzato', () => {
    const stored = JSON.stringify({
      currentTimelineId: 'default',
      timelines: { default: { id: 'default', name: 'Timeline 1', events: [{ id: 5, startYear: 1, categoryId: 'x' }], categories: [] } },
    });
    const state = readLegacyState(stored);
    expect(state?.timelines.default.events[0]).toMatchObject({ id: '5', categoryIds: ['x'] });
    expect(state?.timelines.default.segments.length).toBeGreaterThan(0);
  });

  it('ignora dati rotti', () => {
    expect(readLegacyState(null)).toBeNull();
    expect(readLegacyState('{rotto')).toBeNull();
    expect(readLegacyState('{"timelines":{},"currentTimelineId":"x"}')).toBeNull();
  });
});
