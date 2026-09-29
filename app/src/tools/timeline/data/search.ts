// Ricerca nella timeline: titolo, descrizione e nome delle categorie,
// senza distinguere maiuscole e accenti ("citta" trova "città").
import { compareDates, eventStart } from './dates';
import type { Category, TimelineEvent } from './schema';

export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** "1492", "-44", "44 a.C.", "44 ac", "44 BC" → anno con segno; altrimenti null. */
export function parseYear(q: string): number | null {
  const m = /^\s*(-?)(\d{1,5})\s*(a\.?\s*c\.?|b\.?\s*c\.?|d\.?\s*c\.?|a\.?\s*d\.?)?\s*$/i.exec(q);
  if (!m) return null;
  const n = Number(m[2]);
  const bc = m[1] === '-' || (!!m[3] && /^[ab]/i.test(m[3]) && !/^a\.?\s*d/i.test(m[3]));
  return bc ? -n : n;
}

/** Id degli eventi che corrispondono, in ordine cronologico. Ogni parola deve comparire. */
export function searchEvents(events: readonly TimelineEvent[], categories: readonly Category[], query: string): string[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const catNames = new Map(categories.map((c) => [c.id, fold(c.name)]));
  const year = parseYear(query);
  return events
    .filter((e) => {
      if (year != null && (e.startYear === year || e.endYear === year)) return true;
      const text = [e.title ?? '', e.description ?? '', ...e.categoryIds.map((id) => catNames.get(id) ?? '')].map(fold).join(' ');
      return words.every((w) => text.includes(w));
    })
    .sort((a, b) => compareDates(eventStart(a), eventStart(b)))
    .map((e) => e.id);
}
