// ================================================================
//  HELPERS
// ================================================================

// DOM cache — lazy getElementById
const _domCache = {};
function $(id) {
    if (!_domCache[id]) _domCache[id] = document.getElementById(id);
    return _domCache[id];
}
function clearDomCache() { for (const k in _domCache) delete _domCache[k]; }

function generateId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDescription(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    escaped = escaped.replace(/\*(.+?)\*/g, '<i>$1</i>');
    escaped = escaped.replace(/__(.+?)__/g, '<u>$1</u>');
    return escaped.replace(/\n/g, '<br>');
}

function wrapSelection(textareaId, marker) {
    const ta = document.getElementById(textareaId);
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    ta.value = text.substring(0, start) + marker + selected + marker + text.substring(end);
    ta.focus();
    ta.setSelectionRange(start + marker.length, end + marker.length);
}

function formatYear(year, month, day) {
    let result = '';
    if (year < 0) {
        result = Math.abs(year) + ' a.C.';
    } else {
        result = '' + year;
    }
    if (month) {
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        result += ' ' + monthNames[month - 1];
        if (day) {
            result += ' ' + day;
        }
    }
    return result;
}

function yearToPixels(year, month, day) {
    const zoomFactor = pixelsPerYear / DEFAULT_PIXELS_PER_YEAR;
    let position = 180;
    for (let s = 0; s < SEGMENTS.length; s++) {
        const seg = SEGMENTS[s];
        if (year >= seg.end) {
            position += (seg.end - seg.start) * seg.density * zoomFactor;
        } else if (year >= seg.start) {
            position += (year - seg.start) * seg.density * zoomFactor;
        }
    }
    if (month) {
        let localDensity = 0;
        for (let s = 0; s < SEGMENTS.length; s++) {
            if (year >= SEGMENTS[s].start && year < SEGMENTS[s].end) {
                localDensity = SEGMENTS[s].density * zoomFactor;
                break;
            }
        }
        if (localDensity === 0) localDensity = SEGMENTS[SEGMENTS.length - 1].density * zoomFactor;
        position += (month - 1) * (localDensity / 12);
        if (day) {
            position += (day - 1) * (localDensity / 365);
        }
    }
    return position;
}

// Cached year-to-pixels for performance — uses composite key (year|month|day)
const _ytpCache = new Map();
let _ytpCacheZoom = null;
function yearToPixelsCached(year, month, day) {
    const zf = pixelsPerYear;
    if (_ytpCacheZoom !== zf) {
        _ytpCache.clear();
        _ytpCacheZoom = zf;
    }
    const key = month ? (day ? year + '|' + month + '|' + day : year + '|' + month) : String(year);
    if (_ytpCache.has(key)) return _ytpCache.get(key);
    const result = yearToPixels(year, month, day);
    _ytpCache.set(key, result);
    return result;
}

function clearYearCache() {
    _ytpCache.clear();
    _ytpCacheZoom = null;
}

function estimateYearFromScroll(scrollY) {
    let lo = MIN_YEAR;
    let hi = MAX_YEAR;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const pos = yearToPixels(mid);
        if (pos < scrollY) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

function scrollToYear(year) {
    const position = yearToPixels(year);
    let viewportHeight = window.innerHeight;
    if (window.visualViewport) {
        viewportHeight = window.visualViewport.height;
    }
    document.getElementById('timelineRuler').scrollTop = position - viewportHeight / 2;
}

function scrollToLatestEvent() {
    const events = getEvents();
    if (events.length === 0) {
        scrollToYear(0);
        return;
    }
    const latest = events.reduce(function (a, b) {
        return a.startYear > b.startYear ? a : b;
    });
    scrollToYear(latest.startYear);
}

function isMobile() {
    return window.innerWidth <= 1038;
}

function updateEmptyState() {
    const events = getEvents();
    const fab = document.getElementById('fabBtn');
    const arrow = document.getElementById('emptyArrow');
    if (events.length === 0) {
        fab.classList.add('pulse');
        if (arrow) arrow.style.display = 'block';
    } else {
        fab.classList.remove('pulse');
        if (arrow) arrow.style.display = 'none';
    }
}

// ================================================================
//  SANITIZE HELPERS (for import / migration)
// ================================================================
function sanitizeImportedEvent(evt) {
    evt.id = String(evt.id || generateId());
    if (evt.categoryId !== null && evt.categoryId !== undefined) evt.categoryId = String(evt.categoryId);
    if (evt.linkedEventId !== null && evt.linkedEventId !== undefined) {
        evt.linkedEvents = [{ eventId: String(evt.linkedEventId), side: 'auto' }];
        delete evt.linkedEventId;
    }
    if (evt.linkedEvents && Array.isArray(evt.linkedEvents)) {
        evt.linkedEvents = evt.linkedEvents.map(function (l) {
            return { eventId: String(l.eventId || l), side: (l.side || 'auto') };
        });
    }
    if (!evt.type) evt.type = 'event';
    return evt;
}

function sanitizeImportedEvents(events) {
    return (events || []).map(sanitizeImportedEvent);
}

function sanitizeImportedCategory(cat) {
    cat.id = String(cat.id || generateId());
    if (cat.showConnectors === undefined) cat.showConnectors = true;
    return cat;
}

function sanitizeImportedCategories(categories) {
    return (categories || []).map(sanitizeImportedCategory);
}

// ================================================================
//  TOAST
// ================================================================
function showToast(message, type) {
    if (!type) type = 'info';
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
        if (toast.parentNode) toast.remove();
    }, 3000);
}

// ================================================================
//  IMAGE LIGHTBOX
// ================================================================
function openImageLightbox(url, title) {
    const lb = $('imageLightbox');
    const img = $('imageLightboxImg');
    if (!lb || !img || !url) return;
    img.src = url;
    img.alt = title ? 'Immagine ingrandita: ' + title : 'Immagine ingrandita';
    lb.classList.add('open');
}

function closeImageLightbox() {
    const lb = $('imageLightbox');
    if (lb) lb.classList.remove('open');
}

