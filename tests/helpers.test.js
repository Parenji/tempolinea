import { describe, it, expect, beforeEach } from 'vitest';
import { seedEmptyState, seedEvent, seedCategory } from './fixtures.js';

describe('formatYear', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('formatta un anno positivo senza mese/giorno', () => {
    expect(window.formatYear(476)).toBe('476');
    expect(window.formatYear(2024)).toBe('2024');
    expect(window.formatYear(0)).toBe('0');
  });

  it('formatta un anno negativo come a.C.', () => {
    expect(window.formatYear(-753)).toBe('753 a.C.');
    expect(window.formatYear(-1)).toBe('1 a.C.');
  });

  it('formatta anno + mese', () => {
    expect(window.formatYear(2024, 1)).toBe('2024 Gen');
    expect(window.formatYear(2024, 12)).toBe('2024 Dic');
    expect(window.formatYear(-44, 3)).toBe('44 a.C. Mar');
  });

  it('formatta anno + mese + giorno', () => {
    expect(window.formatYear(2024, 1, 15)).toBe('2024 Gen 15');
    expect(window.formatYear(-44, 3, 15)).toBe('44 a.C. Mar 15');
  });

  it('gestisce mese senza giorno (giorno falsy)', () => {
    expect(window.formatYear(2024, 5, 0)).toBe('2024 Mag');
    expect(window.formatYear(2024, 5, null)).toBe('2024 Mag');
  });
});

describe('escapeHtml', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('restituisce stringa vuota per null/undefined', () => {
    expect(window.escapeHtml(null)).toBe('');
    expect(window.escapeHtml(undefined)).toBe('');
  });

  it('escape dei caratteri HTML', () => {
    var result = window.escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    // dopo escape, < diventa < e > diventa >
    var ltEntity = '&' + 'lt;';
    var gtEntity = '&' + 'gt;';
    expect(result.indexOf(ltEntity)).not.toBe(-1);
    expect(result.indexOf(gtEntity)).not.toBe(-1);
  });

  it('non modifica testo semplice', () => {
    expect(window.escapeHtml('Ciao mondo')).toBe('Ciao mondo');
  });
});

describe('formatDescription', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('restituisce stringa vuota per input null/undefined/vuoto', () => {
    expect(window.formatDescription(null)).toBe('');
    expect(window.formatDescription('')).toBe('');
  });

  it('converte ** in <b>', () => {
    var result = window.formatDescription('Testo in **grassetto** qui');
    expect(result.indexOf('<b>grassetto</b>')).not.toBe(-1);
  });

  it('converte * in <i>', () => {
    var result = window.formatDescription('Testo in *corsivo* qui');
    expect(result.indexOf('<i>corsivo</i>')).not.toBe(-1);
  });

  it('converte __ in <u>', () => {
    var result = window.formatDescription('Testo __sottolineato__ qui');
    expect(result.indexOf('<u>sottolineato</u>')).not.toBe(-1);
  });

  it('converte newline in <br>', () => {
    var result = window.formatDescription('Riga1\nRiga2');
    expect(result.indexOf('<br>')).not.toBe(-1);
  });

  it('fa escape HTML prima del formatting', () => {
    var result = window.formatDescription('<script>**xss**</script>');
    expect(result.indexOf('<script>')).toBe(-1);
    expect(result.indexOf('<b>')).not.toBe(-1);
  });
});

describe('generateId', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('genera una stringa non vuota', () => {
    var id = window.generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('genera ID unici', () => {
    var ids = new Set();
    for (var i = 0; i < 100; i++) {
      ids.add(window.generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('contiene un underscore (timestamp + random)', () => {
    var id = window.generateId();
    expect(id.indexOf('_')).not.toBe(-1);
  });
});

describe('yearToPixels', () => {
  beforeEach(() => {
    seedEmptyState();
    window.setZoom(20);
  });

  it('calcola una posizione per anno 0', () => {
    var px = window.yearToPixels(0);
    expect(typeof px).toBe('number');
    expect(px).toBeGreaterThan(0);
  });

  it('restituisce la stessa posizione per lo stesso anno', () => {
    var a = window.yearToPixels(476);
    var b = window.yearToPixels(476);
    expect(a).toBe(b);
  });

  it('anni maggiori hanno posizioni maggiori', () => {
    var early = window.yearToPixels(-500);
    var late = window.yearToPixels(2000);
    expect(late).toBeGreaterThan(early);
  });

  it('mesi e giorni spostano la posizione in avanti', () => {
    var jan = window.yearToPixels(2024, 1, 1);
    var dec = window.yearToPixels(2024, 12, 31);
    expect(dec).toBeGreaterThan(jan);
  });

  it('anno negativo estremo (-6000) e valido', () => {
    var px = window.yearToPixels(-6000);
    expect(typeof px).toBe('number');
  });

  it('anno positivo estremo (2100) e valido', () => {
    var px = window.yearToPixels(2100);
    expect(typeof px).toBe('number');
  });
});

describe('yearToPixelsCached', () => {
  beforeEach(() => {
    seedEmptyState();
    window.setZoom(20);
  });

  it('restituisce lo stesso valore di yearToPixels', () => {
    var direct = window.yearToPixels(476);
    var cached = window.yearToPixelsCached(476);
    expect(cached).toBe(direct);
  });

  it('usa la cache per chiamate ripetute', () => {
    var first = window.yearToPixelsCached(1492);
    var second = window.yearToPixelsCached(1492);
    expect(second).toBe(first);
  });

  it('invalida la cache quando cambia zoom', () => {
    var before = window.yearToPixelsCached(1000);
    window.setZoom(40);
    var after = window.yearToPixelsCached(1000);
    expect(after).not.toBe(before);
  });

  it('cache funziona anche con mese e giorno', () => {
    var a = window.yearToPixelsCached(2024, 6, 15);
    var b = window.yearToPixelsCached(2024, 6, 15);
    expect(a).toBe(b);
  });
});

describe('getEventYearRange', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('restituisce range completo con buffer quando non ci sono eventi', () => {
    var range = window.getEventYearRange();
    expect(range.minYear).toBe(-10000);
    expect(range.maxYear).toBe(2100);
  });

  it('calcola range basato sugli eventi esistenti', () => {
    seedEvent({ startYear: 476 });
    seedEvent({ startYear: 1492 });
    var range = window.getEventYearRange();
    expect(range.minYear).toBeLessThanOrEqual(476);
    expect(range.maxYear).toBeGreaterThanOrEqual(1492);
  });

  it('include endYear nel calcolo del range', () => {
    seedEvent({ startYear: 1000, endYear: 1200 });
    var range = window.getEventYearRange();
    expect(range.minYear).toBeLessThanOrEqual(1000);
    expect(range.maxYear).toBeGreaterThanOrEqual(1200);
  });

  it('rispetta i limiti MIN_YEAR e MAX_YEAR', () => {
    var range = window.getEventYearRange();
    expect(range.minYear).toBeGreaterThanOrEqual(-10000);
    expect(range.maxYear).toBeLessThanOrEqual(2100);
  });
});

describe('estimateYearFromScroll', () => {
  beforeEach(() => {
    seedEmptyState();
    window.setZoom(20);
  });

  it('per scrollY=0 restituisce MIN_YEAR', () => {
    var year = window.estimateYearFromScroll(0);
    expect(year).toBe(-10000);
  });

  it('restituisce un anno vicino a quello di un evento noto', () => {
    var px = window.yearToPixelsCached(476);
    var year = window.estimateYearFromScroll(px);
    expect(Math.abs(year - 476)).toBeLessThan(200);
  });

  it('restituisce valori nell\'intervallo valido', () => {
    var year = window.estimateYearFromScroll(10000);
    expect(year).toBeGreaterThanOrEqual(-6000);
    expect(year).toBeLessThanOrEqual(2100);
  });
});

describe('isMobile', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('restituisce false con viewport desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    expect(window.isMobile()).toBe(false);
  });

  it('restituisce true con viewport mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
    expect(window.isMobile()).toBe(true);
  });
});

describe('updateEmptyState', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('mostra empty state quando non ci sono eventi', () => {
    window.updateEmptyState();
    var fab = document.getElementById('fabBtn');
    expect(fab.classList.contains('pulse')).toBe(true);
  });

  it('nasconde empty state quando ci sono eventi', () => {
    seedEvent({ startYear: 476 });
    window.updateEmptyState();
    var fab = document.getElementById('fabBtn');
    expect(fab.classList.contains('pulse')).toBe(false);
  });
});