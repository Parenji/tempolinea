import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { normalizeEvent, normalizeTimeline, validateTimeline } from '../src/tools/timeline/data/normalize';
import {
  deleteCategories, deleteEvent, draftFromEvent, mergeCategories, moveEvents, newCategoryDraft, newDraft,
  saveCategory, saveDraft, validateDraft, countEvents, categoryNameTaken, type EventDraft,
} from '../src/tools/timeline/data/ops';
import type { Timeline } from '../src/tools/timeline/data/schema';

const sample = () =>
  normalizeTimeline(JSON.parse(readFileSync(resolve(import.meta.dirname, 'fixtures/compat-sample.json'), 'utf8')).timeline);

function legacySanitize(events: unknown[]) {
  const ctx: Record<string, any> = { document: {}, window: {}, Date, Math, String, Array, Object };
  runInNewContext(readFileSync(resolve(import.meta.dirname, '../../js/helpers.js'), 'utf8'), ctx);
  return ctx.sanitizeImportedEvents(structuredClone(events));
}

/** Dopo ogni modifica il file deve restare valido e identico per la v1. */
function expectCompatible(tl: Timeline) {
  expect(validateTimeline(tl)).toEqual([]);
  const plain = JSON.parse(JSON.stringify(tl));
  expect(plain.events.map((e: any) => normalizeEvent(e))).toEqual(plain.events);
  expect(legacySanitize(plain.events)).toEqual(plain.events);
}

const draft = (over: Partial<EventDraft> = {}): EventDraft => ({
  ...newDraft('event'),
  title: 'Scoperta dell\'America',
  start: { year: 1492, bc: false, month: 10, day: 12 },
  ...over,
});

describe('validazione della bozza', () => {
  it('accetta un evento completo', () => expect(validateDraft(draft())).toEqual([]));
  it('richiede titolo e anno (non per gli appunti il titolo)', () => {
    expect(validateDraft(draft({ title: ' ', start: { year: null, bc: false, month: null, day: null } })).map((e) => e.field)).toEqual(['title', 'start']);
    expect(validateDraft({ ...draft({ kind: 'note', title: '' }) })).toEqual([]);
  });
  it('controlla i giorni del mese, anche negli anni bisestili', () => {
    expect(validateDraft(draft({ start: { year: 1500, bc: false, month: 2, day: 30 } }))).toHaveLength(1);
    expect(validateDraft(draft({ start: { year: 1600, bc: false, month: 2, day: 29 } }))).toEqual([]);
    expect(validateDraft(draft({ start: { year: 1700, bc: false, month: 2, day: 29 } }))).toHaveLength(1);
  });
  it('un periodo ha bisogno della fine, e la fine non può precedere l\'inizio', () => {
    expect(validateDraft(draft({ kind: 'period' })).map((e) => e.field)).toEqual(['end']);
    expect(validateDraft(draft({ end: { year: 1491, bc: false, month: null, day: null } })).map((e) => e.field)).toEqual(['end']);
    // a.C.: 44 a.C. → 14 d.C. va bene, 14 d.C. → 44 a.C. no
    expect(validateDraft(draft({ start: { year: 44, bc: true, month: null, day: null }, end: { year: 14, bc: false, month: null, day: null } }))).toEqual([]);
    expect(validateDraft(draft({ start: { year: 14, bc: false, month: null, day: null }, end: { year: 44, bc: true, month: null, day: null } }))).toHaveLength(1);
  });
});

describe('eventi', () => {
  it('crea un evento con anno a.C. salvato come numero negativo', () => {
    const tl = sample();
    const id = saveDraft(tl, draft({ start: { year: 753, bc: true, month: 4, day: 21 }, title: 'Fondazione di Roma', categoryIds: ['c1'] }));
    expect(tl.events.find((e) => e.id === id)).toMatchObject({ startYear: -753, startMonth: 4, startDay: 21, isPeriod: false, type: 'event', categoryIds: ['c1'] });
    expectCompatible(tl);
  });

  it('modificare un evento conserva i campi sconosciuti (compatibilità)', () => {
    const tl = sample();
    (tl.events[0] as any).campoFuturo = 'x';
    const d = draftFromEvent(tl.events[0]);
    d.title = 'Nuovo titolo';
    saveDraft(tl, d);
    expect(tl.events[0]).toMatchObject({ title: 'Nuovo titolo', campoFuturo: 'x' });
    expect(tl.events).toHaveLength(sample().events.length);
    expectCompatible(tl);
  });

  it('bozza → evento → bozza è stabile', () => {
    const tl = sample();
    for (const e of tl.events) {
      const d = draftFromEvent(e);
      saveDraft(tl, d);
      expect(draftFromEvent(tl.events.find((x) => x.id === e.id)!)).toEqual(d);
    }
    expectCompatible(tl);
  });

  it('evento ↔ periodo ↔ appunto', () => {
    const tl = sample();
    const e = tl.events.find((x) => x.linkedEvents?.length)!;
    const d = draftFromEvent(e);
    saveDraft(tl, { ...d, kind: 'period', end: { year: 1600, bc: false, month: null, day: null } });
    expect(tl.events.find((x) => x.id === e.id)).toMatchObject({ isPeriod: true, endYear: 1600 });
    // i collegamenti restano nascosti ma non si perdono
    expect(tl.events.find((x) => x.id === e.id)!.linkedEvents?.length).toBeGreaterThan(0);
    saveDraft(tl, { ...draftFromEvent(tl.events.find((x) => x.id === e.id)!), kind: 'note' });
    const note = tl.events.find((x) => x.id === e.id)!;
    expect(note.type).toBe('note');
    expect(note).not.toHaveProperty('isPeriod');
    expect(note).not.toHaveProperty('endYear');
    expectCompatible(tl);
  });

  it('un evento non si collega a sé stesso e ignora categorie inesistenti', () => {
    const tl = sample();
    const e = tl.events[1];
    saveDraft(tl, { ...draftFromEvent(e), linkedEvents: [{ eventId: e.id, side: 'auto' }], categoryIds: ['c1', 'fantasma', 'c1'] });
    const saved = tl.events[1];
    expect(saved.linkedEvents).toEqual([]);
    expect(saved.categoryIds).toEqual(['c1']);
  });

  it('eliminare un evento toglie i collegamenti verso di lui', () => {
    const tl = sample();
    const target = tl.events.find((e) => tl.events.some((x) => x.linkedEvents?.some((l) => l.eventId === e.id)))!;
    deleteEvent(tl, target.id);
    expect(tl.events.some((e) => e.id === target.id)).toBe(false);
    expect(tl.events.some((e) => e.linkedEvents?.some((l) => l.eventId === target.id))).toBe(false);
    expectCompatible(tl);
  });
});

describe('categorie', () => {
  it('crea e modifica, scegliendo un colore non ancora usato', () => {
    const tl = sample();
    const d = newCategoryDraft(tl);
    expect(tl.categories.map((c) => c.color.toLowerCase())).not.toContain(d.color.toLowerCase());
    const id = saveCategory(tl, { ...d, name: 'Arte' });
    saveCategory(tl, { ...d, id, name: 'Arte e cultura', preferredSide: 'left' });
    expect(tl.categories.find((c) => c.id === id)).toMatchObject({ name: 'Arte e cultura', preferredSide: 'left', showConnectors: true });
    expect(categoryNameTaken(tl, ' arte E cultura ')).toBe(true);
    expect(categoryNameTaken(tl, 'Arte e cultura', id)).toBe(false);
    expectCompatible(tl);
  });

  it('eliminare una categoria la toglie dagli eventi ma non elimina gli eventi', () => {
    const tl = sample();
    const n = tl.events.length;
    deleteCategories(tl, ['c1']);
    expect(tl.events).toHaveLength(n);
    expect(tl.events.some((e) => e.categoryIds.includes('c1'))).toBe(false);
    expectCompatible(tl);
  });

  it('unire due categorie: niente doppioni negli eventi che le avevano entrambe', () => {
    const tl = sample();
    const both = tl.events.find((e) => e.categoryIds.includes('c1') && e.categoryIds.includes('c2'))!;
    const id = mergeCategories(tl, ['c1', 'c2'], { ...newCategoryDraft(tl), name: 'Tutto' });
    expect(tl.categories.map((c) => c.id)).not.toContain('c1');
    expect(tl.events.find((e) => e.id === both.id)!.categoryIds).toEqual([id]);
    expectCompatible(tl);
  });

  it('spostare eventi in un\'altra categoria; la categoria rimasta vuota sparisce', () => {
    const tl = sample();
    const inC2 = tl.events.filter((e) => e.categoryIds.includes('c2')).map((e) => e.id);
    const dest = saveCategory(tl, { ...newCategoryDraft(tl), name: 'Nuova' });
    moveEvents(tl, 'c2', inC2.slice(0, 1), dest);
    expect(countEvents(tl, dest)).toBe(1);
    expect(tl.categories.some((c) => c.id === 'c2')).toBe(true);
    moveEvents(tl, 'c2', inC2, dest);
    expect(tl.categories.some((c) => c.id === 'c2')).toBe(false);
    expectCompatible(tl);
  });
});
