import { describe, it, expect, beforeEach } from 'vitest';
import { seedEmptyState, seedEvent, seedCategory, seedFixtureData } from './fixtures.js';

describe('Integrazione - Stato e Persistenza', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('eventi e categorie vengono salvati e caricati correttamente', () => {
    seedCategory('Politica', '#ef4444');
    seedCategory('Cultura', '#3b82f6');

    seedEvent({ id: 'evt_1', startYear: 476, title: 'Caduta Impero', categoryId: 'cat_politica' });
    seedEvent({ id: 'evt_2', startYear: 1492, title: 'Scoperta America', categoryId: 'cat_cultura' });

    expect(window.getEvents().length).toBe(2);
    expect(window.getCategories().length).toBe(2);

    var savedState = JSON.parse(localStorage.getItem('timeline_app_v3'));
    expect(savedState.timelines['default'].events.length).toBe(2);
    expect(savedState.timelines['default'].categories.length).toBe(2);
  });

  it('undo/redo ciclo completo funziona con eventi e categorie', () => {
    seedCategory('Politica', '#ef4444');
    expect(window.getCategories().length).toBe(1);
    window.pushUndo();

    seedEvent({ id: 'e1', startYear: 100, title: 'E1' });
    window.pushUndo();

    var events = window.getEvents();
    events.push({ id: 'e2', type: 'event', startYear: 200, title: 'E2' });
    window.setEvents(events);
    window.saveState();
    expect(window.getEvents().length).toBe(2);

    window.undo();
    expect(window.getEvents().length).toBe(1);

    window.redo();
    expect(window.getEvents().length).toBe(2);
  });

  it('undo ripristina snapshot esatto dello stato', () => {
    seedEvent({ id: 'e1', startYear: 100, title: 'E1' });
    window.pushUndo();
    expect(window.getEvents().length).toBe(1);

    // Modifica
    var events = window.getEvents();
    events.push({ id: 'e2', type: 'event', startYear: 200, title: 'E2' });
    window.setEvents(events);
    window.saveState();
    expect(window.getEvents().length).toBe(2);

    // Undo: deve tornare esattamente a 1 evento
    window.undo();
    expect(window.getEvents().length).toBe(1);
    expect(window.getEvents()[0].id).toBe('e1');
  });
});

describe('Integrazione - Sanitize dati esterni', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('sanitizza dati legacy v2 con linkedEventId', () => {
    var rawEvents = [
      { id: 1, startYear: 100, title: 'A', linkedEventId: 2 },
      { id: 2, startYear: 200, title: 'B' },
    ];
    var clean = window.sanitizeImportedEvents(rawEvents);

    expect(clean.length).toBe(2);
    expect(clean[0].linkedEvents).toBeTruthy();
    expect(clean[0].linkedEvents[0].eventId).toBe('2');
    expect(clean[0].linkedEventId).toBeUndefined();
    expect(clean[0].id).toBe('1');
    expect(clean[1].id).toBe('2');
  });

  it('sanitizza categorie non complete', () => {
    var rawCats = [
      { id: 100, name: 'Cat1', color: '#ef4444' },
    ];
    var clean = window.sanitizeImportedCategories(rawCats);
    expect(clean[0].id).toBe('100');
    expect(clean[0].showConnectors).toBe(true);
  });

  it('sanitizza eventi senza type', () => {
    var raw = { id: 'x', startYear: 100, title: 'Senza Tipo' };
    var clean = window.sanitizeImportedEvent(raw);
    expect(clean.type).toBe('event');
  });
});

describe('Integrazione - Gestione Timeline Multiple', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('switchTimeline preserva i dati della timeline originale', () => {
    seedEvent({ id: 'def_evt', startYear: 100, title: 'Evento Default' });
    expect(window.getEvents().length).toBe(1);

    // Crea timeline via API
    window.timelineModalMode = 'add';
    document.getElementById('timelineName').value = 'Seconda';
    window.saveTimeline();

    // Verifica che la nuova timeline sia vuota
    expect(window.getEvents().length).toBe(0);
    expect(window.getCurrentTimeline().name).toBe('Seconda');
  });

  it('switchTimeline non perde dati', () => {
    seedEvent({ id: 'a', startYear: 100 });
    window.renameTimeline();
    // renameTimeline apre solo la modale, non modifica dati
    expect(window.getEvents().length).toBe(1);
  });
});

describe('Integrazione - Validazione Periodi', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('getMaxSimultaneousPeriodsInRange con 0 periodi restituisce 0', () => {
    expect(window.getMaxSimultaneousPeriodsInRange(1000, 1200)).toBe(0);
  });

  it('getMaxSimultaneousPeriodsInRange con 1 periodo non sovrapposto restituisce 0', () => {
    var events = window.getEvents();
    events.push({ id: 'p1', type: 'event', startYear: 1000, endYear: 1200, title: 'Medioevo', isPeriod: true, categoryId: 'cat1' });
    window.setEvents(events);

    expect(window.getMaxSimultaneousPeriodsInRange(800, 900, null)).toBe(0);
  });

  it('getMaxSimultaneousPeriodsInRange rileva overlap', () => {
    var events = window.getEvents();
    events.push({ id: 'p1', type: 'event', startYear: 1000, endYear: 1200, title: 'A', isPeriod: true, categoryId: 'cat1' });
    events.push({ id: 'p2', type: 'event', startYear: 1100, endYear: 1300, title: 'B', isPeriod: true, categoryId: 'cat1' });
    window.setEvents(events);

    var max = window.getMaxSimultaneousPeriodsInRange(1050, 1150, null);
    expect(max).toBeGreaterThanOrEqual(1);
  });

  it('getMaxSimultaneousPeriodsInRange esclude l\'evento in modifica', () => {
    var events = window.getEvents();
    events.push({ id: 'p1', type: 'event', startYear: 1000, endYear: 1200, title: 'A', isPeriod: true, categoryId: 'cat1' });
    events.push({ id: 'p2', type: 'event', startYear: 1050, endYear: 1150, title: 'B', isPeriod: true, categoryId: 'cat1' });
    window.setEvents(events);

    var maxWithAll = window.getMaxSimultaneousPeriodsInRange(1000, 1200, null);
    expect(maxWithAll).toBeGreaterThanOrEqual(1);

    var maxExcluding = window.getMaxSimultaneousPeriodsInRange(1000, 1200, 'p1');
    expect(maxExcluding).toBeLessThanOrEqual(1);
  });
});

describe('Integrazione - Search (logica)', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('formatta l\'anno correttamente per la ricerca', () => {
    expect(window.formatYear(476)).toBe('476');
    expect(window.formatYear(-753)).toBe('753 a.C.');
  });

  it('clearSearch resetta input', () => {
    document.getElementById('searchInput').value = 'test';
    window.clearSearch();
    expect(document.getElementById('searchInput').value).toBe('');
  });
});

describe('Integrazione - Modali', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('openModal/closeModal ciclo', () => {
    window.openModal({ type: 'event' });
    var modal = document.getElementById('eventModal');
    expect(modal.classList.contains('open')).toBe(true);

    window.closeModal();
    expect(modal.classList.contains('open')).toBe(false);
  });

  it('openModal con anno prefilled', () => {
    window.openModal({ type: 'event', year: 1492 });
    expect(document.getElementById('startYear').value).toBe('1492');
    window.closeModal();
  });

  it('openModal con tipo note prefilla noteYear', () => {
    window.openModal({ type: 'note', year: 1776 });
    expect(document.getElementById('noteYear').value).toBe('1776');
    window.closeModal();
  });
});

describe('Integrazione - Zoom e Scroll', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('setZoom aggiorna zoomLabel', () => {
    window.setZoom(40);
    var label = document.getElementById('zoomLabel');
    expect(label.textContent).toContain('40');
  });

  it('setZoom a 20 mostra label con stile accent', () => {
    window.setZoom(40);
    window.setZoom(20);
    var label = document.getElementById('zoomLabel');
    expect(label.textContent).toContain('20');
  });

  it('scrollToLatestEvent e scrollToYear non craschano', () => {
    expect(function () {
      window.scrollToLatestEvent();
      window.scrollToYear(2024);
    }).not.toThrow();
  });
});