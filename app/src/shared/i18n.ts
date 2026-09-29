// Lingue del Quaderno. Il testo resta scritto in italiano nel codice: t('Salva') cerca la
// traduzione nella lingua scelta e, se manca, mostra l'italiano. Cambiare lingua ricarica la
// pagina, così nessun componente resta a metà.
export type Lang = 'it' | 'en';

const KEY = 'quaderno.lang';
const LEGACY_KEY = 'timeline_language'; // scelta fatta nella v1 della timeline

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (saved === 'en' || saved === 'it') return saved;
  } catch {
    /* niente localStorage (test, modalità privata) */
  }
  return 'it';
}

export const lang: Lang = typeof document === 'undefined' ? 'it' : detect();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

const dict: Record<string, string> = {};

/** Registra le traduzioni inglesi (chiave = frase italiana). */
export function addEnglish(messages: Record<string, string>) {
  Object.assign(dict, messages);
}

/** Traduce e sostituisce i parametri: t('Eliminato «{name}».', { name }) */
export function t(it: string, params?: Record<string, string | number>): string {
  const s = lang === 'en' ? dict[it] ?? it.replace(/^[a-z]+\|/, '') : it.replace(/^[a-z]+\|/, '');
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s;
}

/**
 * Come t(), per frasi italiane identiche con significati diversi:
 * tc('undo', 'Annulla') → "Undo", mentre t('Annulla') → "Cancel".
 */
export function tc(context: string, it: string, params?: Record<string, string | number>): string {
  const key = `${context}|${it}`;
  return t(lang === 'en' && key in dict ? key : it, params);
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* pazienza */
  }
  location.reload();
}

/** Per i test: la frase ha una traduzione inglese? */
export function hasEnglish(it: string): boolean {
  return it in dict;
}
