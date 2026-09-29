import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bucketLabel, overview } from '../src/tools/timeline/data/overview';
import { normalizeTimeline } from '../src/tools/timeline/data/normalize';
import type { TimelineEvent } from '../src/tools/timeline/data/schema';

const ev = (startYear: number, extra: Partial<TimelineEvent> = {}): TimelineEvent =>
  ({ id: String(Math.random()), type: 'event', startYear, title: 'x', categoryIds: [], ...extra }) as TimelineEvent;

describe('panoramica', () => {
  it('raggruppa per passi tondi e conta tutti gli eventi (non gli appunti)', () => {
    const { step, buckets } = overview([ev(1001), ev(1049), ev(1250), ev(1499), ev(1300, { type: 'note' })], 10);
    expect(step).toBe(50);
    expect(buckets[0]).toMatchObject({ from: 1000, to: 1050, events: 2 });
    expect(buckets.reduce((s, b) => s + b.events, 0)).toBe(4);
    expect(buckets.at(-1)!.from).toBe(1450);
  });
  it('funziona con gli anni a.C.', () => {
    const { step, buckets } = overview([ev(-753), ev(-44), ev(476)], 20);
    expect(step).toBe(100);
    expect(buckets[0].from).toBe(-800);
    expect(bucketLabel(buckets[0], step)).toBe('800 a.C. – 701 a.C.');
    expect(bucketLabel(buckets.at(-1)!, step)).toBe('V secolo');
  });
  it('conta i periodi in ogni gruppo che attraversano', () => {
    const { buckets } = overview([ev(1000), ev(1100, { isPeriod: true, endYear: 1300 }), ev(1400)], 5);
    expect(buckets.map((b) => b.periods)).toEqual([0, 1, 1, 1, 0]);
  });
  it('timeline vuota', () => expect(overview([]).buckets).toEqual([]));

  const real = resolve(import.meta.dirname, 'fixtures/private/storia.json');
  it.runIf(existsSync(real))('sul file reale: pochi gruppi, nessun evento perso', () => {
    const tl = normalizeTimeline(JSON.parse(readFileSync(real, 'utf8')).timeline);
    const { buckets } = overview(tl.events, 30);
    expect(buckets.length).toBeLessThanOrEqual(30);
    expect(buckets.reduce((s, b) => s + b.events, 0)).toBe(tl.events.filter((e) => e.type !== 'note' && !e.isPeriod).length);
  });
});
