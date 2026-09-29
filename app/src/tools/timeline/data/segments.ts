// Spaziatura delle epoche ("segmenti" della v1): quanto spazio verticale ha un anno in ogni epoca.
// Nell'editor ogni riga dice da che anno parte un'epoca; la fine è l'inizio della riga dopo
// (l'ultima ha una fine esplicita). Così non ci possono essere buchi o sovrapposizioni.
import { t } from '$shared/i18n';
import { defaultSegments, type Segment, type TimelineEvent } from './schema';

export type RulerStep = 1 | 10 | 100;

export interface SegmentRow {
  from: number | null;
  /** pixel per anno allo zoom 100% */
  density: number;
  step: RulerStep;
}

const labelOf: Record<RulerStep, Segment['rulerLabel']> = { 1: 'year', 10: 'decade', 100: 'century' };

export function toRows(segments: readonly Segment[]): { rows: SegmentRow[]; end: number } {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  return {
    rows: sorted.map((s) => ({
      from: s.start,
      density: s.density,
      step: (s.rulerStep >= 100 ? 100 : s.rulerStep >= 10 ? 10 : 1) as RulerStep,
    })),
    end: sorted[sorted.length - 1]?.end ?? 2100,
  };
}

export function validateRows(rows: readonly SegmentRow[], end: number | null): string[] {
  const errors: string[] = [];
  if (!rows.length) errors.push(t("Serve almeno un'epoca."));
  rows.forEach((r, i) => {
    if (r.from == null || !Number.isInteger(r.from)) errors.push(t("Riga {n}: manca l'anno d'inizio.", { n: i + 1 }));
    if (!(r.density > 0 && r.density <= 500)) errors.push(t('Riga {n}: lo spazio per anno deve essere tra 0 e 500.', { n: i + 1 }));
  });
  const froms = rows.map((r) => r.from).filter((f): f is number => f != null);
  if (new Set(froms).size !== froms.length) errors.push(t('Due epoche iniziano nello stesso anno.'));
  if (end == null || !Number.isInteger(end)) errors.push(t("Manca l'anno di fine dell'ultima epoca."));
  else if (froms.some((f) => f >= end)) errors.push(t("La fine deve venire dopo l'inizio di tutte le epoche."));
  return errors;
}

/** Righe (anche in disordine) → segmenti ordinati e contigui, nel formato dei file JSON. */
export function fromRows(rows: readonly SegmentRow[], end: number): Segment[] {
  const sorted = [...rows].filter((r) => r.from != null).sort((a, b) => a.from! - b.from!);
  return sorted.map((r, i) => ({
    start: r.from!,
    end: i + 1 < sorted.length ? sorted[i + 1].from! : end,
    density: r.density,
    rulerStep: r.step,
    rulerLabel: labelOf[r.step],
  }));
}

/** Un'unica epoca uniforme attorno agli eventi (utile per timeline brevi). */
export function singleSegment(events: readonly TimelineEvent[]): Segment[] {
  const years = events.flatMap((e) => (e.endYear != null ? [e.startYear, e.endYear] : [e.startYear]));
  if (!years.length) return defaultSegments();
  const span = Math.max(...years) - Math.min(...years);
  const pad = Math.max(10, Math.round(span * 0.1));
  const start = Math.floor((Math.min(...years) - pad) / 10) * 10;
  const end = Math.ceil((Math.max(...years) + pad) / 10) * 10;
  const density = Math.max(0.5, Math.min(200, Math.round((4000 / Math.max(1, end - start)) * 10) / 10));
  const step: RulerStep = end - start > 2000 ? 100 : end - start > 200 ? 10 : 1;
  return [{ start, end, density, rulerStep: step, rulerLabel: labelOf[step] }];
}
