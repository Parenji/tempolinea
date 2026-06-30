// ================================================================
//  STATE & PERSISTENCE
// ================================================================
const STORAGE_KEY = 'timeline_app_v3';
const MIN_YEAR = -10000;
const MAX_YEAR = 2100;
const SEGMENTS = [
    { start: -10000, end: -1500, density: 0.5, rulerStep: 100, rulerLabel: 'century' },
    { start: -1500, end: -800, density: 3, rulerStep: 10, rulerLabel: 'decade' },
    { start: -800, end: 1000, density: 10, rulerStep: 1, rulerLabel: 'year' },
    { start: 1000, end: 1700, density: 20, rulerStep: 1, rulerLabel: 'year' },
    { start: 1700, end: 1900, density: 40, rulerStep: 1, rulerLabel: 'year' },
    { start: 1900, end: 2100, density: 60, rulerStep: 1, rulerLabel: 'year' }
];
const DEFAULT_PIXELS_PER_YEAR = 20;
const MAX_UNDO_STACK = 30;

let pixelsPerYear = 20;
let state = { timelines: {}, currentTimelineId: null };

// Undo/Redo stacks (RAM only, not localStorage)
let undoStack = [];
let redoStack = [];

let selectedCategoryId = null;
let selectedColor = null;
let editingEventId = null;
let searchResults = [];
let currentSearchIndex = 0;
let selectedLinkedEvents = [];
let timelineModalMode = 'add';
let editingCategoryId = null;
let expandedEventId = null;
let cardDisplacements = {};
let activeCategoryFilters = [];
let currentFormType = 'event';
let pendingImportData = null;
let highlightedCategoryId = null;
let scrollRestricted = true;

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.timelines && parsed.currentTimelineId && parsed.timelines[parsed.currentTimelineId]) {
                state = parsed;
                migrateState();
                return;
            }
        } catch (e) { /* ignore */ }
    }
    // Try legacy v2
    const oldEvents = localStorage.getItem('timeline_events_v2');
    const oldCategories = localStorage.getItem('timeline_categories_v2');
    if (oldEvents || oldCategories) {
        const events = oldEvents ? JSON.parse(oldEvents) : [];
        const categories = oldCategories ? JSON.parse(oldCategories) : [];
        const timelineId = generateId();
        state.timelines[timelineId] = { id: timelineId, name: 'Timeline (importata dal backup)', events: events, categories: categories };
        state.currentTimelineId = timelineId;
        localStorage.removeItem('timeline_events_v2');
        localStorage.removeItem('timeline_categories_v2');
        saveState();
        return;
    }
    // Default
    const defaultId = 'default';
    state.timelines[defaultId] = { id: defaultId, name: 'Timeline 1', events: [], categories: [] };
    state.currentTimelineId = defaultId;
    saveState();
}

function migrateState() {
    Object.values(state.timelines).forEach(function (tl) {
        if (tl.categories) {
            tl.categories = sanitizeImportedCategories(tl.categories);
        }
        if (tl.events) {
            tl.events = sanitizeImportedEvents(tl.events);
        }
    });
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentTimeline() {
    return state.timelines[state.currentTimelineId];
}

function getEvents() {
    const timeline = getCurrentTimeline();
    return timeline ? timeline.events : [];
}

function getCategories() {
    const timeline = getCurrentTimeline();
    return timeline ? timeline.categories : [];
}

function setEvents(events) {
    const timeline = getCurrentTimeline();
    if (timeline) timeline.events = events;
}

function setCategories(categories) {
    const timeline = getCurrentTimeline();
    if (timeline) timeline.categories = categories;
}

// ================================================================
//  UNDO / REDO (RAM only)
// ================================================================
function pushUndo() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    undoStack.push(JSON.parse(JSON.stringify(timeline)));
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) {
        showToast('Niente da annullare', 'info');
        return;
    }
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    redoStack.push(JSON.parse(JSON.stringify(timeline)));
    const previous = undoStack.pop();
    const currentId = state.currentTimelineId;
    state.timelines[currentId] = previous;
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Annullato (Ctrl+Z)', 'info');
}

function redo() {
    if (redoStack.length === 0) {
        showToast('Niente da ripetere', 'info');
        return;
    }
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    undoStack.push(JSON.parse(JSON.stringify(timeline)));
    const next = redoStack.pop();
    const currentId = state.currentTimelineId;
    state.timelines[currentId] = next;
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Ripetuto (Ctrl+Shift+Z)', 'info');
}