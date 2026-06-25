// ================================================================
//  TIMELINE MANAGEMENT
// ================================================================
function renderTimelineSelect() {
    const select = document.getElementById('timelineSelect');
    select.innerHTML = '';
    const timelineList = Object.values(state.timelines);
    timelineList.sort(function (a, b) { return a.name.localeCompare(b.name); });
    timelineList.forEach(function (timeline) {
        const option = document.createElement('option');
        option.value = timeline.id;
        option.textContent = timeline.name;
        if (timeline.id === state.currentTimelineId) { option.selected = true; }
        select.appendChild(option);
    });
}

function switchTimeline(timelineId) {
    if (timelineId === state.currentTimelineId) return;
    if (!state.timelines[timelineId]) return;
    state.currentTimelineId = timelineId;
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Timeline: ' + getCurrentTimeline().name, 'info');
}

function addTimeline() {
    timelineModalMode = 'add';
    document.getElementById('timelineModalTitle').textContent = 'Nuova Timeline';
    document.getElementById('timelineName').value = '';
    document.getElementById('timelineModal').classList.add('open');
}

function renameTimeline() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    timelineModalMode = 'rename';
    document.getElementById('timelineModalTitle').textContent = 'Rinomina Timeline';
    document.getElementById('timelineName').value = timeline.name;
    document.getElementById('timelineModal').classList.add('open');
}

function deleteTimeline() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    if (Object.keys(state.timelines).length <= 1) {
        showToast('Devi avere almeno una timeline', 'error');
        return;
    }
    if (!confirm('Eliminare la timeline "' + timeline.name + '"?')) return;
    delete state.timelines[state.currentTimelineId];
    state.currentTimelineId = Object.keys(state.timelines)[0];
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Timeline eliminata', 'info');
}

function closeTimelineModal() {
    document.getElementById('timelineModal').classList.remove('open');
}

function saveTimeline() {
    const name = document.getElementById('timelineName').value.trim();
    if (!name) { showToast('Inserisci un nome', 'error'); return; }
    const currentId = timelineModalMode === 'rename' ? state.currentTimelineId : null;
    const duplicate = Object.values(state.timelines).some(function (tl) {
        if (currentId && tl.id === currentId) return false;
        return tl.name.trim().toLowerCase() === name.toLowerCase();
    });
    if (duplicate) { showToast('Esiste già una timeline con questo nome', 'error'); return; }
    if (timelineModalMode === 'add') {
        const id = generateId();
        state.timelines[id] = { id: id, name: name, events: [], categories: [] };
        state.currentTimelineId = id;
        saveState();
        expandedEventId = null;
        fullRender();
        showToast('Timeline "' + name + '" creata', 'success');
    } else {
        const timeline = getCurrentTimeline();
        if (timeline) {
            timeline.name = name;
            saveState();
            renderTimelineSelect();
            showToast('Timeline rinominata', 'success');
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
    const label = document.getElementById('zoomLabel');
    label.textContent = pixelsPerYear + 'px';
    if (pixelsPerYear === DEFAULT_PIXELS_PER_YEAR) {
        label.style.color = 'var(--accent)';
    } else {
        label.style.color = '';
    }
    document.getElementById('zoomSlider').value = pixelsPerYear;
    clearYearCache();
    fullRender();
    requestAnimationFrame(function () {
        const yearPosition = yearToPixelsCached(currentYear);
        ruler.scrollTop = yearPosition - window.innerHeight / 2;
    });
}

function zoomIn() {
    const slider = document.getElementById('zoomSlider');
    let value = parseInt(slider.value) + 5;
    if (value > 80) value = 80;
    setZoom(value);
}

function zoomOut() {
    const slider = document.getElementById('zoomSlider');
    let value = parseInt(slider.value) - 5;
    if (value < 5) value = 5;
    setZoom(value);
}