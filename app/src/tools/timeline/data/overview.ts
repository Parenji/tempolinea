// Panoramica della timeline: quanti eventi ci sono in ogni epoca.
// Sostituisce la minimappa della v1: si calcola solo quando si apre "Vai a…", niente a ogni scroll.
import type { TimelineEvent } from './schema';

export interface Bucket {
  from: number;
  /** escluso */
  to: number;
  events: number;
  /** periodi attivi in almeno un anno del gruppo */
  periods: number;
}

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];

/** Gruppi di anni "tondi" (al massimo `maxBuckets`), dal primo all'ultimo evento. */
export function overview(events: readonly TimelineEvent[], maxBuckets = 30): { step: number; buckets: Bucket[] } {
  const points = events.filter((e) => e.type !== 'note' && !e.isPeriod);
  const periods = events.filter((e) => e.isPeriod && e.endYear != null);
  const years = [...points.map((e) => e.startYear), ...periods.flatMap((e) => [e.startYear, e.endYear!])];
  if (!years.length) return { step: 1, buckets: [] };
  const min = Math.min(...years);
  const max = Math.max(...years);
  const step = STEPS.find((s) => Math.floor(max / s) - Math.floor(min / s) + 1 <= maxBuckets) ?? STEPS[STEPS.length - 1];
  const first = Math.floor(min / step) * step;
  const buckets: Bucket[] = [];
  for (let from = first; from <= max; from += step) buckets.push({ from, to: from + step, events: 0, periods: 0 });
  for (const e of points) buckets[Math.floor((e.startYear - first) / step)].events++;
  for (const p of periods) {
    const a = Math.min(p.startYear, p.endYear!);
    const z = Math.max(p.startYear, p.endYear!);
    for (const b of buckets) if (a < b.to && z >= b.from) b.periods++;
  }
  return { step, buckets };
}

export function bucketLabel(b: Bucket, step: number): string {
  const y = (n: number) => (n < 0 ? `${-n} a.C.` : String(n));
  if (step === 1) return y(b.from);
  if (step === 100 && b.from > 0) return `${roman(b.from / 100 + 1)} secolo`;
  return `${y(b.from)} – ${y(b.to - 1)}`;
}

function roman(n: number): string {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}
