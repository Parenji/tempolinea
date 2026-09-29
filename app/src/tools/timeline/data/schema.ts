// Formato dei file JSON della timeline, compatibile con la versione 1 (tempolinea legacy).
// Gli oggetti sono "loose": i campi sconosciuti vengono conservati, così un export
// della nuova app resta leggibile dalla vecchia e viceversa.
import { z } from 'zod';

const optNum = z.number().nullish();

export const LinkSchema = z.looseObject({
  eventId: z.string(),
  side: z.enum(['auto', 'left', 'right']).catch('auto'),
});

export const EventSchema = z.looseObject({
  id: z.string(),
  type: z.enum(['event', 'note']),
  title: z.string().nullish(),
  description: z.string().nullish(),
  startYear: z.number().finite(),
  startMonth: optNum,
  startDay: optNum,
  endYear: optNum,
  endMonth: optNum,
  endDay: optNum,
  imageUrl: z.string().nullish(),
  categoryIds: z.array(z.string()),
  linkedEvents: z.array(LinkSchema).optional(),
  isPeriod: z.boolean().optional(),
});

export const CategorySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  showConnectors: z.boolean(),
  preferredSide: z.enum(['auto', 'left', 'right']).optional(),
});

export const SegmentSchema = z.looseObject({
  start: z.number(),
  end: z.number(),
  density: z.number().positive(),
  rulerStep: z.number().positive(),
  rulerLabel: z.enum(['century', 'decade', 'year']),
});

export const TimelineSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  events: z.array(EventSchema),
  categories: z.array(CategorySchema),
  segments: z.array(SegmentSchema).min(1),
});

export type Link = z.infer<typeof LinkSchema>;
export type TimelineEvent = z.infer<typeof EventSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;

/** Stato salvato nel browser dalla versione 1 (chiave `timeline_app_v3`). */
export interface LegacyAppState {
  timelines: Record<string, Timeline>;
  currentTimelineId: string;
}

export const DEFAULT_SEGMENTS: readonly Segment[] = [
  { start: -10000, end: -1500, density: 0.5, rulerStep: 100, rulerLabel: 'century' },
  { start: -1500, end: -800, density: 3, rulerStep: 10, rulerLabel: 'decade' },
  { start: -800, end: 1000, density: 10, rulerStep: 1, rulerLabel: 'year' },
  { start: 1000, end: 1700, density: 20, rulerStep: 1, rulerLabel: 'year' },
  { start: 1700, end: 1900, density: 40, rulerStep: 1, rulerLabel: 'year' },
  { start: 1900, end: 2100, density: 60, rulerStep: 1, rulerLabel: 'year' },
];

export function defaultSegments(): Segment[] {
  return DEFAULT_SEGMENTS.map((s) => ({ ...s }));
}
