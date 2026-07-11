// ================================================================
//  STATE & PERSISTENCE
// ================================================================
const STORAGE_KEY = 'timeline_app_v3';
const ZOOM_STORAGE_KEY = 'timeline_zoom_v1';
const DEFAULT_PIXELS_PER_YEAR = 20;

const DEFAULT_SEGMENTS = [
    { start: -10000, end: -1500, density: 0.5, rulerStep: 100, rulerLabel: 'century' },
    { start: -1500, end: -800, density: 3, rulerStep: 10, rulerLabel: 'decade' },
    { start: -800, end: 1000, density: 10, rulerStep: 1, rulerLabel: 'year' },
    { start: 1000, end: 1700, density: 20, rulerStep: 1, rulerLabel: 'year' },
    { start: 1700, end: 1900, density: 40, rulerStep: 1, rulerLabel: 'year' },
    { start: 1900, end: 2100, density: 60, rulerStep: 1, rulerLabel: 'year' }
];

function getDefaultSegments() {
    return DEFAULT_SEGMENTS.map(function(s) { return Object.assign({}, s); });
}

function getSegments() {
    const timeline = getCurrentTimeline();
    if (timeline && timeline.segments && Array.isArray(timeline.segments) && timeline.segments.length > 0) {
        return timeline.segments;
    }
    return getDefaultSegments();
}

function saveSegments(segments) {
    const timeline = getCurrentTimeline();
    if (timeline) {
        timeline.segments = segments;
        saveState();
    }
}

function resetSegmentsToDefault() {
    const timeline = getCurrentTimeline();
    if (timeline) {
        timeline.segments = getDefaultSegments();
        saveState();
    }
    clearYearCache();
}

function getMinYear() {
    var segs = getSegments();
    return segs[0].start;
}

function getMaxYear() {
    var segs = getSegments();
    return segs[segs.length - 1].end;
}
const MAX_UNDO_STACK = 30;

let pixelsPerYear = loadZoom();
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
let activeExpansionDelta = 0;
let activeExpansionFracturePoint = null;
let activeExpansionCard = null;
let cardResizeObserver = null;

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
        state.timelines[timelineId] = { id: timelineId, name: t('legacy_import_name'), events: events, categories: categories, segments: getDefaultSegments() };
        state.currentTimelineId = timelineId;
        localStorage.removeItem('timeline_events_v2');
        localStorage.removeItem('timeline_categories_v2');
        saveState();
        return;
    }
    // Default
    const defaultId = 'default';
    state.timelines[defaultId] = { id: defaultId, name: 'Timeline 1', events: [], categories: [], segments: getDefaultSegments() };
    state.currentTimelineId = defaultId;
    saveState();
}

function migrateState() {
    Object.values(state.timelines).forEach(function (tl) {
        // Ensure segments exist (per-timeline feature)
        if (!tl.segments || !Array.isArray(tl.segments) || tl.segments.length === 0) {
            tl.segments = getDefaultSegments();
        }
        if (tl.categories) {
            tl.categories = sanitizeImportedCategories(tl.categories);
        }
        if (tl.events) {
            tl.events = sanitizeImportedEvents(tl.events);
            // Migrate old categoryId (string|null) to categoryIds (array)
            tl.events.forEach(function (event) {
                if (event.categoryIds === undefined) {
                    if (event.categoryId !== undefined && event.categoryId !== null && event.categoryId !== '') {
                        event.categoryIds = [String(event.categoryId)];
                    } else {
                        event.categoryIds = [];
                    }
                    delete event.categoryId;
                }
            });
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

function saveZoom(value) {
    localStorage.setItem(ZOOM_STORAGE_KEY, value);
}

function loadZoom() {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (stored) {
        const val = parseInt(stored);
        if (!isNaN(val) && val >= 5 && val <= 80) return val;
    }
    return DEFAULT_PIXELS_PER_YEAR;
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
        showToast(t('toast_nothing_to_undo'), 'info');
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
    showToast(t('toast_undone'), 'info');
}

function redo() {
    if (redoStack.length === 0) {
        showToast(t('toast_nothing_to_redo'), 'info');
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
    showToast(t('toast_redone'), 'info');
}