import { describe, expect, it } from 'vitest';
import { fold, parseYear, searchEvents } from '../src/tools/timeline/data/search';
import type { Category, TimelineEvent } from '../src/tools/timeline/data/schema';

const ev = (id: string, startYear: number, title: string, extra: Partial<TimelineEvent> = {}): TimelineEvent =>
  ({ id, type: 'event', startYear, title, description: '', categoryIds: [], ...extra }) as TimelineEvent;

const cats: Category[] = [{ id: 'c', name: 'Repubbliche marinare', color: '#000', showConnectors: true }];
const events = [
  ev('3', 1162, 'Distruzione di Milano', { description: 'Il Barbarossa rade al suolo la città' }),
  ev('1', 1000, 'Anno Mille'),
  ev('2', 1135, 'Il Sacco di Amalfi', { categoryIds: ['c'] }),
  ev('4', -44, 'Morte di Cesare', { startMonth: 3, startDay: 15 }),
  ev('5', 1100, 'Età dei Comuni', { isPeriod: true, endYear: 1300 }),
];

describe('ricerca', () => {
  it('ignora maiuscole e accenti', () => {
    expect(fold('Città ÈTÀ')).toBe('citta eta');
    expect(searchEvents(events, cats, 'citta')).toEqual(['3']);
    expect(searchEvents(events, cats, 'ETA')).toEqual(['5']);
  });
  it('tutte le parole devono comparire, anche nelle categorie', () => {
    expect(searchEvents(events, cats, 'sacco marinare')).toEqual(['2']);
    expect(searchEvents(events, cats, 'sacco milano')).toEqual([]);
  });
  it('risultati in ordine cronologico', () => {
    expect(searchEvents(events, cats, 'i')).toEqual(['4', '1', '5', '2', '3']);
  });
  it('riconosce gli anni, anche a.C., e l\'anno di fine dei periodi', () => {
    expect(parseYear('1492')).toBe(1492);
    expect(parseYear('44 a.C.')).toBe(-44);
    expect(parseYear('44ac')).toBe(-44);
    expect(parseYear('-44')).toBe(-44);
    expect(parseYear('476 d.C.')).toBe(476);
    expect(parseYear('Cesare')).toBeNull();
    expect(searchEvents(events, cats, '44 a.C.')).toEqual(['4']);
    expect(searchEvents(events, cats, '1300')).toEqual(['5']);
  });
  it('una ricerca vuota non trova niente', () => {
    expect(searchEvents(events, cats, '   ')).toEqual([]);
  });
});
