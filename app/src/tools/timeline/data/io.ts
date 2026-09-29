// Import ed export dei file JSON, con gli stessi formati accettati dalla versione 1.
import { normalizeCategory, normalizeEvent, validateTimeline, type ValidationProblem } from './normalize';
import type { Category, Segment, Timeline, TimelineEvent } from './schema';

export interface ImportedData {
  name: string;
  events: TimelineEvent[];
  categories: Category[];
  /** `null` se il file non ha segmenti: chi importa decide se tenere quelli attuali. */
  segments: Segment[] | null;
}

export type ImportResult =
  | { ok: true; data: ImportedData; problems: ValidationProblem[] }
  | { ok: false; error: 'json' | 'format' };

/**
 * Formati accettati:
 * - `{ timeline: { name, events, categories, segments? }, exportDate }` (export attuale)
 * - `{ events, categories? }` (backup della prima versione)
 */
export function parseImportFile(text: string): ImportResult {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  let name: string;
  let rawEvents: any[];
  let rawCategories: any[];
  let rawSegments: unknown = null;
  if (data?.timeline?.events && data.timeline.categories) {
    rawEvents = data.timeline.events;
    rawCategories = data.timeline.categories;
    name = data.timeline.name || 'Importata';
    rawSegments = data.timeline.segments;
  } else if (Array.isArray(data?.events)) {
    rawEvents = data.events;
    rawCategories = data.categories || [];
    name = 'Importata (legacy)';
  } else {
    return { ok: false, error: 'format' };
  }
  const events = rawEvents.map(normalizeEvent);
  const categories = rawCategories.map(normalizeCategory);
  const segments = Array.isArray(rawSegments) && rawSegments.length > 0 ? (structuredClone(rawSegments) as Segment[]) : null;
  const problems = validateTimeline({
    id: 'import',
    name,
    events,
    categories,
    segments: segments ?? [{ start: 0, end: 1, density: 1, rulerStep: 1, rulerLabel: 'year' }],
  });
  return { ok: true, data: { name, events, categories, segments }, problems };
}

export function serializeExport(timeline: Timeline, now: Date = new Date()): string {
  return JSON.stringify({ timeline, exportDate: now.toISOString() }, null, 2);
}

export function exportFileName(timeline: Timeline, now: Date = new Date()): string {
  return 'timeline_' + timeline.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + now.toLocaleDateString('sv-SE') + '.json';
}
