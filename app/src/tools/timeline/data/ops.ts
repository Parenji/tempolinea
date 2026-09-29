// Operazioni di modifica su una timeline. Funzioni pure sui dati (modificano l'oggetto ricevuto):
// l'interfaccia le chiama dentro `edit()` dello store, che si occupa di annulla/ripeti e salvataggio.
// I campi che non conosciamo vengono conservati, così i file restano compatibili con la v1.
import { t } from '$shared/i18n';
import { generateId } from './normalize';
import type { Category, Link, Timeline, TimelineEvent } from './schema';

// ---------------------------------------------------------------- date

export interface DateParts {
  /** anno senza segno, come lo scrive una persona; null = vuoto */
  year: number | null;
  bc: boolean;
  month: number | null;
  day: number | null;
}

export const MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
].map((m) => t(m));

export function emptyDate(): DateParts {
  return { year: null, bc: false, month: null, day: null };
}

export function toParts(year: number | null | undefined, month?: number | null, day?: number | null): DateParts {
  if (year == null) return emptyDate();
  return { year: Math.abs(year), bc: year < 0, month: month ?? null, day: day ?? null };
}

export function signedYear(d: DateParts): number | null {
  return d.year == null ? null : d.bc ? -d.year : d.year;
}

function daysIn(month: number, signed: number): number {
  const leap = (signed % 4 === 0 && signed % 100 !== 0) || signed % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

// ---------------------------------------------------------------- eventi

export type EventKind = 'event' | 'period' | 'note';

export interface EventDraft {
  id: string | null;
  kind: EventKind;
  title: string;
  description: string;
  imageUrl: string;
  start: DateParts;
  end: DateParts;
  categoryIds: string[];
  linkedEvents: Link[];
}

export function kindOf(e: TimelineEvent): EventKind {
  return e.type === 'note' ? 'note' : e.isPeriod ? 'period' : 'event';
}

export function newDraft(kind: EventKind = 'event', year: number | null = null): EventDraft {
  return {
    id: null,
    kind,
    title: '',
    description: '',
    imageUrl: '',
    start: toParts(year),
    end: emptyDate(),
    categoryIds: [],
    linkedEvents: [],
  };
}

export function draftFromEvent(e: TimelineEvent): EventDraft {
  return {
    id: e.id,
    kind: kindOf(e),
    title: e.title ?? '',
    description: e.description ?? '',
    imageUrl: e.imageUrl ?? '',
    start: toParts(e.startYear, e.startMonth, e.startDay),
    end: toParts(e.endYear, e.endMonth, e.endDay),
    categoryIds: [...e.categoryIds],
    linkedEvents: (e.linkedEvents ?? []).map((l) => ({ ...l })),
  };
}

export interface DraftError {
  field: 'title' | 'start' | 'end';
  message: string;
}

export function validateDraft(d: EventDraft): DraftError[] {
  const errors: DraftError[] = [];
  const checkDate = (p: DateParts, field: 'start' | 'end', label: string) => {
    if (p.year == null) return;
    if (!Number.isInteger(p.year) || p.year < 0) errors.push({ field, message: t("{label}: l'anno deve essere un numero intero.", { label }) });
    if (p.day != null && p.month == null) errors.push({ field, message: t('{label}: se indichi il giorno serve anche il mese.', { label }) });
    if (p.month != null && p.day != null && (p.day < 1 || p.day > daysIn(p.month, signedYear(p)!))) {
      errors.push({ field, message: t('{label}: {month} non ha il giorno {day}.', { label, month: MONTHS[p.month - 1], day: p.day }) });
    }
  };
  if (d.kind !== 'note' && !d.title.trim()) errors.push({ field: 'title', message: t('Serve un titolo.') });
  if (d.start.year == null) errors.push({ field: 'start', message: t("Serve almeno l'anno.") });
  checkDate(d.start, 'start', t('Inizio'));
  if (d.kind === 'period' && d.end.year == null) errors.push({ field: 'end', message: t('Un periodo ha bisogno della data di fine.') });
  if (d.kind !== 'note' && d.end.year != null) {
    checkDate(d.end, 'end', t('Fine'));
    const a = [signedYear(d.start) ?? 0, d.start.month ?? 0, d.start.day ?? 0];
    const b = [signedYear(d.end)!, d.end.month ?? 99, d.end.day ?? 99];
    if (b[0] < a[0] || (b[0] === a[0] && (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2])))) {
      errors.push({ field: 'end', message: t("La fine viene prima dell'inizio.") });
    }
  }
  return errors;
}

/** Crea o aggiorna l'evento descritto dalla bozza. Restituisce l'id. */
export function saveDraft(tl: Timeline, d: EventDraft): string {
  const existing = d.id ? tl.events.find((e) => e.id === d.id) : undefined;
  const id = existing?.id ?? generateId();
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  const start = { startYear: signedYear(d.start)!, startMonth: d.start.month, startDay: d.start.day };
  const common = { title: d.title.trim(), description: d.description.trim(), imageUrl: d.imageUrl.trim() };

  let next: TimelineEvent;
  if (d.kind === 'note') {
    next = { ...base, id, type: 'note', startYear: start.startYear, ...common, categoryIds: [] } as TimelineEvent;
    // un appunto ha solo l'anno (serve a posizionarlo), come nella v1
    for (const k of ['isPeriod', 'startMonth', 'startDay', 'endYear', 'endMonth', 'endDay']) delete (next as Record<string, unknown>)[k];
  } else {
    const hasEnd = d.end.year != null;
    next = {
      ...base,
      id,
      type: 'event',
      ...start,
      endYear: hasEnd ? signedYear(d.end) : null,
      endMonth: hasEnd ? d.end.month : null,
      endDay: hasEnd ? d.end.day : null,
      ...common,
      categoryIds: [...new Set(d.categoryIds)].filter((c) => tl.categories.some((k) => k.id === c)),
      isPeriod: d.kind === 'period',
    } as TimelineEvent;
    // i periodi non mostrano collegamenti: quelli esistenti restano, così tornano se diventa di nuovo un evento
    if (d.kind === 'event') next.linkedEvents = d.linkedEvents.filter((l) => l.eventId !== id);
  }
  if (existing) tl.events[tl.events.indexOf(existing)] = next;
  else tl.events.push(next);
  return id;
}

/** Elimina un evento e i collegamenti che puntavano a lui. */
export function deleteEvent(tl: Timeline, id: string) {
  tl.events = tl.events.filter((e) => e.id !== id);
  for (const e of tl.events) {
    if (e.linkedEvents?.some((l) => l.eventId === id)) e.linkedEvents = e.linkedEvents.filter((l) => l.eventId !== id);
  }
}

// ---------------------------------------------------------------- categorie

export const PALETTE = [
  '#D64545', '#E07B28', '#C99A06', '#6A9E1F', '#1F9D6B', '#0E97AE',
  '#2F6FB0', '#5B5BD6', '#8B4FD8', '#C2419B', '#8A6A4F', '#6B7A99',
];

export interface CategoryDraft {
  id: string | null;
  name: string;
  color: string;
  preferredSide: 'auto' | 'left' | 'right';
  showConnectors: boolean;
}

export function newCategoryDraft(tl: Timeline): CategoryDraft {
  const used = new Set(tl.categories.map((c) => c.color.toLowerCase()));
  return {
    id: null,
    name: '',
    color: PALETTE.find((c) => !used.has(c.toLowerCase())) ?? PALETTE[tl.categories.length % PALETTE.length],
    preferredSide: 'auto',
    showConnectors: true,
  };
}

export function categoryNameTaken(tl: Timeline, name: string, exceptId: string | null = null): boolean {
  const n = name.trim().toLowerCase();
  return tl.categories.some((c) => c.id !== exceptId && c.name.trim().toLowerCase() === n);
}

export function saveCategory(tl: Timeline, d: CategoryDraft): string {
  const existing = d.id ? tl.categories.find((c) => c.id === d.id) : undefined;
  const fields = { name: d.name.trim(), color: d.color, preferredSide: d.preferredSide, showConnectors: d.showConnectors };
  if (existing) {
    Object.assign(existing, fields);
    return existing.id;
  }
  const id = generateId();
  tl.categories.push({ id, ...fields } as Category);
  return id;
}

export function countEvents(tl: Timeline, categoryId: string): number {
  return tl.events.filter((e) => e.categoryIds.includes(categoryId)).length;
}

/** Elimina le categorie e le toglie dagli eventi (gli eventi restano). */
export function deleteCategories(tl: Timeline, ids: string[]) {
  const drop = new Set(ids);
  tl.categories = tl.categories.filter((c) => !drop.has(c.id));
  for (const e of tl.events) {
    if (e.categoryIds.some((c) => drop.has(c))) e.categoryIds = e.categoryIds.filter((c) => !drop.has(c));
  }
}

/** Unisce più categorie in una nuova (come nella v1). Restituisce l'id della nuova. */
export function mergeCategories(tl: Timeline, ids: string[], into: CategoryDraft): string {
  const drop = new Set(ids);
  const newId = saveCategory(tl, { ...into, id: null });
  tl.categories = tl.categories.filter((c) => !drop.has(c.id));
  for (const e of tl.events) {
    if (!e.categoryIds.some((c) => drop.has(c))) continue;
    e.categoryIds = [...new Set(e.categoryIds.map((c) => (drop.has(c) ? newId : c)))];
  }
  return newId;
}

/**
 * Sposta alcuni eventi da una categoria a un'altra ("dividi" della v1). La posizione resta la stessa:
 * se era la categoria principale, la nuova diventa principale. Se `from` resta vuota viene eliminata.
 */
export function moveEvents(tl: Timeline, fromId: string, eventIds: string[], toId: string) {
  const move = new Set(eventIds);
  for (const e of tl.events) {
    if (!move.has(e.id) || !e.categoryIds.includes(fromId)) continue;
    e.categoryIds = [...new Set(e.categoryIds.map((c) => (c === fromId ? toId : c)))];
  }
  if (countEvents(tl, fromId) === 0) tl.categories = tl.categories.filter((c) => c.id !== fromId);
}
