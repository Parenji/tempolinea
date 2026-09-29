// Scala temporale: da una data ai pixel, con densità diverse per epoca ("segmenti").
// Stessa matematica della v1 (yearToPixels in js/helpers.js), così le timeline hanno le stesse proporzioni.
import type { Segment } from '../data/schema';
import type { PartialDate } from '../data/dates';

export const DEFAULT_ZOOM = 20; // pixel per anno "di riferimento", come nella v1
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 80;

/** Posizione "grezza" della data, prima degli spazi inseriti dal layout. Cresce sempre con la data. */
export function basePx(date: PartialDate, segments: readonly Segment[], zoom = DEFAULT_ZOOM): number {
  const zf = zoom / DEFAULT_ZOOM;
  const { year, month, day } = date;
  let pos = 0;
  for (const seg of segments) {
    if (year >= seg.end) pos += (seg.end - seg.start) * seg.density * zf;
    else if (year >= seg.start) pos += (year - seg.start) * seg.density * zf;
  }
  if (month) {
    const seg = segments.find((s) => year >= s.start && year < s.end) ?? segments[segments.length - 1];
    const local = seg.density * zf;
    pos += (month - 1) * (local / 12);
    if (day) pos += (day - 1) * (local / 365);
  }
  return pos;
}

/** Anno (intero) più grande la cui posizione non supera `px`. */
export function yearAtBasePx(px: number, segments: readonly Segment[], zoom = DEFAULT_ZOOM): number {
  let lo = segments[0].start;
  let hi = segments[segments.length - 1].end;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (basePx({ year: mid }, segments, zoom) <= px) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** Il passo "tondo" più piccolo, multiplo di `min`, che occupa almeno `minPx` pixel. */
export function niceStep(min: number, pxPerYear: number, minPx: number): number {
  for (const n of NICE) {
    if (n >= min && n % min === 0 && n * pxPerYear >= minPx) return n;
  }
  return NICE[NICE.length - 1];
}
