// Date storiche: anni negativi (a.C.), anni 0–99, mese e giorno facoltativi.
// Non usare mai `new Date(anno, …)`: per gli anni 0–99 JavaScript li trasforma in 1900–1999.
import { lang } from '$shared/i18n';

export interface PartialDate {
  year: number;
  month?: number | null;
  day?: number | null;
}

/** Ordine cronologico completo: anno, poi mese, poi giorno (un valore mancante viene prima). */
export function compareDates(a: PartialDate, b: PartialDate): number {
  return a.year - b.year || (a.month ?? 0) - (b.month ?? 0) || (a.day ?? 0) - (b.day ?? 0);
}

export function eventStart(e: { startYear: number; startMonth?: number | null; startDay?: number | null }): PartialDate {
  return { year: e.startYear, month: e.startMonth, day: e.startDay };
}

const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "476", "44 a.C.", "1492 Ott 12": stesso formato della versione 1. */
export function formatDate({ year, month, day }: PartialDate): string {
  let out = year < 0 ? `${Math.abs(year)} ${lang === 'en' ? 'BC' : 'a.C.'}` : String(year);
  if (month) {
    out += ' ' + (lang === 'en' ? MONTHS_EN : MONTHS_IT)[month - 1];
    if (day) out += ' ' + day;
  }
  return out;
}
