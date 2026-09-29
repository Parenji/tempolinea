import { describe, expect, it } from 'vitest';
import { compareDates, formatDate } from '../src/tools/timeline/data/dates';

describe('compareDates', () => {
  it('ordina per anno, mese e giorno', () => {
    const dates = [
      { year: 1492, month: 10, day: 12 },
      { year: 1492, month: 3 },
      { year: 1492 },
      { year: -44, month: 3, day: 15 },
      { year: 79 },
    ];
    expect(dates.sort(compareDates)).toEqual([
      { year: -44, month: 3, day: 15 },
      { year: 79 },
      { year: 1492 },
      { year: 1492, month: 3 },
      { year: 1492, month: 10, day: 12 },
    ]);
  });

  it('non confonde gli anni 0–99 con il Novecento', () => {
    expect(compareDates({ year: 79 }, { year: 1950 })).toBeLessThan(0);
  });
});

describe('formatDate', () => {
  it('usa lo stesso formato della v1', () => {
    expect(formatDate({ year: -44, month: 3, day: 15 })).toBe('44 a.C. Mar 15');
    expect(formatDate({ year: 1492, month: 10 })).toBe('1492 Ott');
    expect(formatDate({ year: 476, month: null, day: null })).toBe('476');
  });
});
