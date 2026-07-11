// ================================================================
//  TIMELINE MANAGEMENT
// ================================================================
function renderTimelineSelect() {
    var selectors = [document.getElementById('timelineSelect'), document.getElementById('mobileTimelineSelect')];
    selectors.forEach(function (select) {
        if (!select) return;
        select.innerHTML = '';
        var timelineList = Object.values(state.timelines);
        timelineList.sort(function (a, b) { return a.name.localeCompare(b.name); });
        timelineList.forEach(function (timeline) {
            var option = document.createElement('option');
            option.value = timeline.id;
            option.textContent = timeline.name;
            if (timeline.id === state.currentTimelineId) { option.selected = true; }
            select.appendChild(option);
        });
    });
}

function switchTimeline(timelineId) {
    if (timelineId === state.currentTimelineId) return;
    if (!state.timelines[timelineId]) return;
    state.currentTimelineId = timelineId;
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_timeline_switched', { name: getCurrentTimeline().name }), 'info');
}

function addTimeline() {
    lastFocusedElement = document.activeElement;
    timelineModalMode = 'add';
    document.getElementById('timelineModalTitle').textContent = t('timeline_new_title');
    document.getElementById('timelineName').value = '';
    var actions = document.getElementById('timelineEditActions');
    if (actions) actions.style.display = 'none';
    document.getElementById('timelineModal').classList.add('open');
    // Focus the timeline name input
    setTimeout(function() {
        var input = document.getElementById('timelineName');
        if (input) input.focus();
    }, 100);
}

function renameTimeline() {
    editTimeline();
}

function editTimeline() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    lastFocusedElement = document.activeElement;
    timelineModalMode = 'edit';
    document.getElementById('timelineModalTitle').textContent = t('timeline_edit_title');
    document.getElementById('timelineName').value = timeline.name;
    var actions = document.getElementById('timelineEditActions');
    if (actions) actions.style.display = 'block';
    window._editingSegments = null;
    document.getElementById('timelineModal').classList.add('open');
    // Focus the timeline name input
    setTimeout(function() {
        var input = document.getElementById('timelineName');
        if (input) { input.focus(); input.select(); }
    }, 100);
}

function deleteTimeline() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    if (Object.keys(state.timelines).length <= 1) {
        showToast(t('toast_need_at_least_one'), 'error');
        return;
    }
    if (!confirm(t('toast_confirm_delete_timeline', { name: timeline.name }))) return;
    delete state.timelines[state.currentTimelineId];
    state.currentTimelineId = Object.keys(state.timelines)[0];
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_timeline_deleted'), 'info');
}

function closeTimelineModal() {
    document.getElementById('timelineModal').classList.remove('open');
    if (lastFocusedElement) {
        var el = lastFocusedElement;
        lastFocusedElement = null;
        setTimeout(function () { if (el && typeof el.focus === 'function') el.focus(); }, 100);
    }
}

function saveTimeline() {
    const name = document.getElementById('timelineName').value.trim();
    if (!name) { showToast(t('toast_name_required'), 'error'); return; }
    const currentId = timelineModalMode === 'rename' ? state.currentTimelineId : null;
    const duplicate = Object.values(state.timelines).some(function (tl) {
        if (currentId && tl.id === currentId) return false;
        return tl.name.trim().toLowerCase() === name.toLowerCase();
    });
    if (duplicate) { showToast(t('toast_duplicate_name'), 'error'); return; }
    if (timelineModalMode === 'add') {
        const id = generateId();
        state.timelines[id] = { id: id, name: name, events: [], categories: [], segments: getDefaultSegments() };
        state.currentTimelineId = id;
        saveState();
        expandedEventId = null;
        fullRender();
        showToast(t('toast_timeline_created', { name: name }), 'success');
    } else if (timelineModalMode === 'edit') {
        const timeline = getCurrentTimeline();
        if (timeline) {
            timeline.name = name;
            saveState();
            renderTimelineSelect();
            showToast(t('toast_timeline_updated'), 'success');
        }
    } else {
        const timeline = getCurrentTimeline();
        if (timeline) {
            timeline.name = name;
            saveState();
            renderTimelineSelect();
            showToast(t('toast_timeline_renamed'), 'success');
        }
    }
    closeTimelineModal();
}

// ================================================================
//  ZOOM
// ================================================================
function setZoom(value) {
    const ruler = document.getElementById('timelineRuler');
    const currentScrollY = ruler.scrollTop + window.innerHeight / 2;
    const currentYear = estimateYearFromScroll(currentScrollY);
    pixelsPerYear = parseInt(value);
    saveZoom(pixelsPerYear);
    const label = document.getElementById('zoomLabel');
    if (label) {
        label.textContent = pixelsPerYear + 'px';
        if (pixelsPerYear === DEFAULT_PIXELS_PER_YEAR) {
            label.style.color = 'var(--accent)';
        } else {
            label.style.color = '';
        }
    }
    clearYearCache();
    fullRender();
    requestAnimationFrame(function () {
        const yearPosition = yearToPixelsCached(currentYear);
        ruler.scrollTop = yearPosition - window.innerHeight / 2;
    });
}

function zoomIn() {
    var value = pixelsPerYear + 5;
    if (value > 80) value = 80;
    setZoom(value);
}

function zoomOut() {
    var value = pixelsPerYear - 5;
    if (value < 5) value = 5;
    setZoom(value);
}