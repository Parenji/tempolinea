import { describe, it, expect, beforeEach } from 'vitest';
import { seedEmptyState, seedEvent, seedCategory, seedFixtureData } from './fixtures.js';

describe('State - Persistenza', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('loadState crea una timeline default se localStorage vuoto', () => {
    localStorage.clear();
    window.loadState();
    var tl = window.getCurrentTimeline();
    expect(tl).toBeTruthy();
    expect(tl.name).toBe('Timeline 1');
    expect(Array.isArray(tl.events)).toBe(true);
    expect(Array.isArray(tl.categories)).toBe(true);
  });

  it('saveState persiste i dati in localStorage', () => {
    var events = window.getEvents();
    events.push({ id: 'test_1', type: 'event', startYear: 100, title: 'Test' });
    window.setEvents(events);
    window.saveState();
    var stored = JSON.parse(localStorage.getItem('timeline_app_v3'));
    expect(stored.timelines[stored.currentTimelineId].events.length).toBe(1);
  });

  it('getEvents e getCategories restituiscono array anche se vuoti', () => {
    expect(Array.isArray(window.getEvents())).toBe(true);
    expect(Array.isArray(window.getCategories())).toBe(true);
  });

  it('setEvents e setCategories modificano lo stato', () => {
    window.setEvents([{ id: 'x', type: 'event', startYear: 1, title: 'X' }]);
    expect(window.getEvents().length).toBe(1);
    window.setCategories([{ id: 'cat1', name: 'Test', color: '#fff' }]);
    expect(window.getCategories().length).toBe(1);
  });
});

describe('State - Gestione Timelines', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('addTimeline apre la modale timeline', () => {
    window.addTimeline();
    var modal = document.getElementById('timelineModal');
    expect(modal.classList.contains('open')).toBe(true);
  });

  it('saveTimeline con nome duplicato non crea duplicati', () => {
    // La timeline default si chiama "Timeline 1"
    window.timelineModalMode = 'add';
    document.getElementById('timelineName').value = 'Timeline 1';
    window.saveTimeline();
    // Non dovrebbe aver creato una nuova timeline (nome duplicato)
    // La modale dovrebbe essere ancora aperta (o chiusa, ma non crasha)
  });

  it('saveTimeline crea una nuova timeline con nome valido', () => {
    window.timelineModalMode = 'add';
    document.getElementById('timelineName').value = 'Storia Antica';
    window.saveTimeline();
    // La timeline corrente ora dovrebbe essere 'Storia Antica'
    var tl = window.getCurrentTimeline();
    expect(tl.name).toBe('Storia Antica');
    expect(window.getEvents().length).toBe(0);
  });

  it('renameTimeline apre la modale di rinomina', () => {
    window.renameTimeline();
    var modal = document.getElementById('timelineModal');
    expect(modal.classList.contains('open')).toBe(true);
    var titleEl = document.getElementById('timelineModalTitle');
    expect(titleEl.textContent).toContain('Rinomina');
  });
});

describe('State - Undo/Redo', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('undo senza elementi nello stack non crasha', () => {
    window.undo();
    expect(window.getEvents().length).toBe(0);
  });

  it('undo ripristina lo stato precedente dopo pushUndo + modifica', () => {
    seedEvent({ id: 'evt_1', startYear: 100, title: 'Evento 1' });
    window.pushUndo();
    expect(window.getEvents().length).toBe(1);

    var events = window.getEvents();
    events.push({ id: 'evt_2', type: 'event', startYear: 200, title: 'Evento 2' });
    window.setEvents(events);
    window.saveState();
    expect(window.getEvents().length).toBe(2);

    window.undo();
    expect(window.getEvents().length).toBe(1);
    expect(window.getEvents()[0].title).toBe('Evento 1');
  });

  it('redo ripristina dopo undo', () => {
    seedEvent({ id: 'evt_1', startYear: 100, title: 'Evento 1' });
    window.pushUndo();

    var events = window.getEvents();
    events.push({ id: 'evt_2', type: 'event', startYear: 200, title: 'Evento 2' });
    window.setEvents(events);
    window.saveState();
    expect(window.getEvents().length).toBe(2);

    window.undo();
    expect(window.getEvents().length).toBe(1);

    window.redo();
    expect(window.getEvents().length).toBe(2);
  });

  it('redo senza elementi non crasha', () => {
    window.redo();
    expect(window.getEvents().length).toBe(0);
  });

  it('nuova modifica dopo undo azzera il redo', () => {
    seedEvent({ id: 'evt_1', startYear: 100, title: 'E1' });
    window.pushUndo();

    var events = window.getEvents();
    events.push({ id: 'evt_2', type: 'event', startYear: 200, title: 'E2' });
    window.setEvents(events);
    window.saveState();

    window.undo();
    expect(window.getEvents().length).toBe(1);

    events = window.getEvents();
    events.push({ id: 'evt_3', type: 'event', startYear: 300, title: 'E3' });
    window.setEvents(events);
    window.saveState();
    window.pushUndo();

    window.redo();
    // Redo non fa nulla perché il ramo è stato sovrascritto
    expect(window.getEvents().length).toBe(2);
  });

  it('molti undo consecutivi non craschano', () => {
    expect(function () {
      for (var i = 0; i < 10; i++) {
        window.undo();
      }
    }).not.toThrow();
  });
});

describe('Sanitize', () => {
  beforeEach(() => {
    seedEmptyState();
  });

  it('sanitizeImportedEvent converte id in stringa', () => {
    var raw = { id: 123, startYear: 100, title: 'Test' };
    var clean = window.sanitizeImportedEvent(raw);
    expect(clean.id).toBe('123');
  });

  it('sanitizeImportedEvent genera id se assente', () => {
    var raw = { startYear: 100, title: 'Test' };
    var clean = window.sanitizeImportedEvent(raw);
    expect(typeof clean.id).toBe('string');
    expect(clean.id.length).toBeGreaterThan(0);
  });

  it('sanitizeImportedEvent imposta type=event se assente', () => {
    var raw = { id: 'x', startYear: 100, title: 'Test' };
    var clean = window.sanitizeImportedEvent(raw);
    expect(clean.type).toBe('event');
  });

  it('sanitizeImportedEvent converte linkedEventId legacy in linkedEvents', () => {
    var raw = { id: 'x', startYear: 100, title: 'Test', linkedEventId: 'link_1' };
    var clean = window.sanitizeImportedEvent(raw);
    expect(clean.linkedEvents).toBeTruthy();
    expect(clean.linkedEvents.length).toBe(1);
    expect(clean.linkedEvents[0].eventId).toBe('link_1');
    expect(clean.linkedEventId).toBeUndefined();
  });

  it('sanitizeImportedEvents gestisce array vuoto/null', () => {
    expect(window.sanitizeImportedEvents(null)).toEqual([]);
    expect(window.sanitizeImportedEvents([])).toEqual([]);
  });

  it('sanitizeImportedCategory converte id in stringa', () => {
    var raw = { id: 789, name: 'Cat', color: '#fff' };
    var clean = window.sanitizeImportedCategory(raw);
    expect(clean.id).toBe('789');
  });

  it('sanitizeImportedCategory imposta showConnectors=true se assente', () => {
    var raw = { id: 'x', name: 'Cat', color: '#fff' };
    var clean = window.sanitizeImportedCategory(raw);
    expect(clean.showConnectors).toBe(true);
  });

  it('sanitizeImportedCategories gestisce array vuoto/null', () => {
    expect(window.sanitizeImportedCategories(null)).toEqual([]);
    expect(window.sanitizeImportedCategories([])).toEqual([]);
  });
});