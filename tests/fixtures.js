// ================================================================
//  TEST FIXTURES — seed data riutilizzabili
// ================================================================

/**
 * Crea una timeline di test con eventi e categorie.
 * Chiamare prima di ogni test che modifica lo stato.
 */
export function seedEmptyState() {
  localStorage.clear();
  // Ripristina stato vuoto come farebbe loadState()
  const defaultId = 'default';
  const state = {
    timelines: {
      [defaultId]: { id: defaultId, name: 'Timeline 1', events: [], categories: [] },
    },
    currentTimelineId: defaultId,
  };
  localStorage.setItem('timeline_app_v3', JSON.stringify(state));
  // Ricarica
  window.loadState();
  // Reset variabili globali
  window.expandedEventId = null;
  window.selectedCategoryId = null;
  window.editingEventId = null;
  window.selectedLinkedEvents = [];
  window.undoStack = [];
  window.redoStack = [];
  window.searchResults = [];
  window.currentSearchIndex = 0;
  window.activeCategoryFilters = [];
  window.currentFormType = 'event';
  window.highlightedCategoryId = null;
}

/**
 * Crea una categoria base e la aggiunge allo stato corrente.
 */
export function seedCategory(name = 'Politica', color = '#ef4444', preferredSide = 'auto') {
  const cats = window.getCategories();
  const cat = {
    id: 'cat_' + name.toLowerCase(),
    name,
    color,
    showConnectors: true,
    preferredSide,
  };
  cats.push(cat);
  window.setCategories(cats);
  window.saveState();
  return cat;
}

/**
 * Crea un evento base.
 */
export function seedEvent(overrides = {}) {
  const events = window.getEvents();
  const event = {
    id: overrides.id || 'evt_' + Math.random().toString(36).slice(2, 8),
    type: overrides.type || 'event',
    startYear: overrides.startYear ?? 476,
    startMonth: overrides.startMonth ?? null,
    startDay: overrides.startDay ?? null,
    endYear: overrides.endYear ?? null,
    endMonth: overrides.endMonth ?? null,
    endDay: overrides.endDay ?? null,
    title: overrides.title || 'Caduta dell\'Impero Romano',
    description: overrides.description || '',
    imageUrl: overrides.imageUrl || '',
    categoryId: overrides.categoryId || null,
    isPeriod: overrides.isPeriod || false,
    linkedEvents: overrides.linkedEvents || [],
  };
  events.push(event);
  window.setEvents(events);
  window.saveState();
  return event;
}

/**
 * Ripristina lo stato e fa un full render.
 */
export function resetAndRender() {
  window.loadState();
  if (typeof window.fullRender === 'function') {
    window.fullRender();
  }
}

/**
 * Popola lo stato con due categorie e tre eventi per test di integrazione.
 */
export function seedFixtureData() {
  seedEmptyState();

  const cat1 = seedCategory('Politica', '#ef4444', 'left');
  const cat2 = seedCategory('Cultura', '#3b82f6', 'right');

  window.selectedCategoryId = cat1.id;
  const evt1 = seedEvent({
    id: 'evt_001',
    startYear: 476,
    title: 'Caduta Impero Romano',
    categoryId: cat1.id,
  });

  window.selectedCategoryId = cat2.id;
  const evt2 = seedEvent({
    id: 'evt_002',
    startYear: 1492,
    title: 'Scoperta America',
    categoryId: cat2.id,
  });

  window.selectedCategoryId = cat1.id;
  const evt3 = seedEvent({
    id: 'evt_003',
    startYear: 1789,
    title: 'Rivoluzione Francese',
    categoryId: cat1.id,
  });

  window.selectedCategoryId = null;
  window.saveState();

  return { categories: [cat1, cat2], events: [evt1, evt2, evt3] };
}