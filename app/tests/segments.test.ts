import { describe, expect, it } from 'vitest';
import { fromRows, singleSegment, toRows, validateRows } from '../src/tools/timeline/data/segments';
import { SegmentSchema, defaultSegments, type TimelineEvent } from '../src/tools/timeline/data/schema';
import { basePx } from '../src/tools/timeline/engine/scale';

describe('spaziatura delle epoche', () => {
  it('righe ↔ segmenti è stabile sui predefiniti della v1', () => {
    const { rows, end } = toRows(defaultSegments());
    expect(fromRows(rows, end)).toEqual(defaultSegments());
  });

  it('le righe in disordine diventano segmenti ordinati e contigui', () => {
    const segs = fromRows([{ from: 1500, density: 40, step: 1 }, { from: 1000, density: 10, step: 10 }], 2000);
    expect(segs).toEqual([
      { start: 1000, end: 1500, density: 10, rulerStep: 10, rulerLabel: 'decade' },
      { start: 1500, end: 2000, density: 40, rulerStep: 1, rulerLabel: 'year' },
    ]);
    for (const s of segs) expect(SegmentSchema.safeParse(s).success).toBe(true);
  });

  it('segnala righe incomplete, doppioni e fine sbagliata', () => {
    expect(validateRows([], 2000)).toHaveLength(1);
    expect(validateRows([{ from: null, density: 10, step: 1 }], 2000)).toHaveLength(1);
    expect(validateRows([{ from: 1000, density: 0, step: 1 }], 2000)).toHaveLength(1);
    expect(validateRows([{ from: 1000, density: 5, step: 1 }, { from: 1000, density: 5, step: 1 }], 2000)).toHaveLength(1);
    expect(validateRows([{ from: 1000, density: 5, step: 1 }], 900)).toHaveLength(1);
    expect(validateRows([{ from: 1000, density: 5, step: 1 }], 2000)).toEqual([]);
  });

  it('epoca unica attorno agli eventi, con scala crescente', () => {
    const evs = [{ startYear: 1914 }, { startYear: 1939, endYear: 1945 }] as TimelineEvent[];
    const [s] = singleSegment(evs);
    expect(s.start).toBeLessThan(1914);
    expect(s.end).toBeGreaterThan(1945);
    expect(basePx({ year: 1945 }, [s])).toBeGreaterThan(basePx({ year: 1914 }, [s]));
  });
});
