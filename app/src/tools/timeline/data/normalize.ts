// Normalizzazione dei dati importati. Riproduce esattamente `sanitizeImportedEvent`,
// `sanitizeImportedCategory` e `migrateState` della versione 1 (js/helpers.js, js/state.js):
// un test li confronta direttamente sugli stessi file.
import {
  type Category,
  type LegacyAppState,
  type Segment,
  type Timeline,
  type TimelineEvent,
  TimelineSchema,
  defaultSegments,
} from './schema';

export function generateId(): string {
  return Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

type Raw = Record<string, any>;

export function normalizeEvent(raw: Raw): TimelineEvent {
  const evt: Raw = structuredClone(raw);
  evt.id = String(evt.id || generateId());
  if (evt.categoryIds === undefined) {
    if (evt.categoryId !== undefined && evt.categoryId !== null && evt.categoryId !== '') {
      evt.categoryIds = [String(evt.categoryId)];
    } else {
      evt.categoryIds = [];
    }
    delete evt.categoryId;
  } else if (!Array.isArray(evt.categoryIds)) {
    evt.categoryIds = [];
  } else {
    evt.categoryIds = evt.categoryIds.map((id: unknown) => String(id));
  }
  // Formato vecchissimo: un solo collegamento in `linkedEventId`. Un `null` resta dov'è.
  if (evt.linkedEventId !== null && evt.linkedEventId !== undefined) {
    evt.linkedEvents = [{ eventId: String(evt.linkedEventId), side: 'auto' }];
    delete evt.linkedEventId;
  }
  if (evt.linkedEvents && Array.isArray(evt.linkedEvents)) {
    evt.linkedEvents = evt.linkedEvents.map((l: any) => ({
      eventId: String(l.eventId || l),
      side: l.side || 'auto',
    }));
  }
  if (!evt.type) evt.type = 'event';
  return evt as TimelineEvent;
}

export function normalizeCategory(raw: Raw): Category {
  const cat: Raw = structuredClone(raw);
  cat.id = String(cat.id || generateId());
  if (cat.showConnectors === undefined) cat.showConnectors = true;
  return cat as Category;
}

export function normalizeSegments(raw: unknown): Segment[] {
  return Array.isArray(raw) && raw.length > 0 ? structuredClone(raw) : defaultSegments();
}

export function normalizeTimeline(raw: Raw): Timeline {
  return {
    ...structuredClone(raw),
    id: String(raw.id || generateId()),
    name: String(raw.name ?? ''),
    events: (raw.events || []).map(normalizeEvent),
    categories: (raw.categories || []).map(normalizeCategory),
    segments: normalizeSegments(raw.segments),
  };
}

export interface ValidationProblem {
  path: string;
  message: string;
}

/** Controlla la struttura dopo la normalizzazione. Non modifica nulla. */
export function validateTimeline(tl: Timeline): ValidationProblem[] {
  const result = TimelineSchema.safeParse(tl);
  if (result.success) return [];
  return result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

/** Legge lo stato salvato dalla versione 1 nel localStorage, se esiste e ha senso. */
export function readLegacyState(stored: string | null): LegacyAppState | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed?.timelines || !parsed.currentTimelineId || !parsed.timelines[parsed.currentTimelineId]) {
      return null;
    }
    const timelines: Record<string, Timeline> = {};
    for (const [key, tl] of Object.entries<Raw>(parsed.timelines)) {
      timelines[key] = normalizeTimeline(tl);
    }
    return { timelines, currentTimelineId: String(parsed.currentTimelineId) };
  } catch {
    return null;
  }
}
