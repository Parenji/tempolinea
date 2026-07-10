// ================================================================
//  EXPORT / IMPORT
// ================================================================
function exportData() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    const data = JSON.stringify({ timeline: timeline, exportDate: new Date().toISOString() }, null, 2);
    const suggestedName = 'timeline_' + timeline.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toLocaleDateString('sv-SE') + '.json';
    if (window.showSaveFilePicker) {
        window.showSaveFilePicker({ suggestedName: suggestedName, types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }] })
            .then(function (handle) { return handle.createWritable().then(function (writable) { return writable.write(data).then(function () { return writable.close(); }); }); })
            .then(function () { showToast(t('toast_data_exported'), 'success'); })
            .catch(function (err) { if (err.name !== 'AbortError') { showToast(t('toast_export_error'), 'error'); } });
        return;
    }
    let filename = prompt(t('toast_export_prompt'), suggestedName);
    if (filename === null) return;
    if (!filename.trim()) filename = suggestedName;
    if (!filename.endsWith('.json')) filename += '.json';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t('toast_data_exported'), 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            let importedEvents = [];
            let importedCategories = [];
            let importedName = '';
            if (data.timeline && data.timeline.events && data.timeline.categories) {
                importedEvents = data.timeline.events;
                importedCategories = data.timeline.categories;
                importedName = data.timeline.name || t('legacy_import_name_prefix');
            } else if (data.events && Array.isArray(data.events)) {
                importedEvents = data.events;
                importedCategories = data.categories || [];
                importedName = t('legacy_import_name_prefix') + ' ' + t('legacy_import_name_suffix');
            } else {
                showToast(t('toast_invalid_file'), 'error');
                event.target.value = '';
                return;
            }
            pendingImportData = { events: importedEvents, categories: importedCategories, name: importedName, segments: data.timeline ? data.timeline.segments : null };
            const currentTl = getCurrentTimeline();
            const hasContent = (currentTl && (currentTl.events.length > 0 || currentTl.categories.length > 0));
            if (hasContent) {
                $('importCurrentTimelineName').textContent = currentTl.name;
                // Update import choice description
                var descEl = document.getElementById('importChoiceDesc');
                if (descEl) {
                    descEl.innerHTML = t('import_choice_desc', { name: currentTl.name });
                }
                $('importChoiceModal').classList.add('open');
            } else {
                importIntoCurrentTimeline();
            }
        } catch (err) {
            showToast(t('toast_import_error'), 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importIntoCurrentTimeline() {
    if (!pendingImportData) return;
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    pushUndo();
    pendingImportData.events = sanitizeImportedEvents(pendingImportData.events);
    pendingImportData.categories = sanitizeImportedCategories(pendingImportData.categories);
    timeline.events = pendingImportData.events;
    timeline.categories = pendingImportData.categories;
    if (pendingImportData.segments && Array.isArray(pendingImportData.segments) && pendingImportData.segments.length > 0) {
        timeline.segments = pendingImportData.segments;
    }
    pendingImportData = null;
    closeImportChoiceModal();
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_imported_into_current', { name: timeline.name }), 'success');
}

function importIntoNewTimeline() {
    if (!pendingImportData) return;
    let baseName = pendingImportData.name;
    let candidateName = baseName;
    let suffix = 1;
    while (Object.values(state.timelines).some(function (tl) { return tl.name.trim().toLowerCase() === candidateName.toLowerCase(); })) {
        candidateName = baseName + ' (' + (++suffix) + ')';
    }
    pendingImportData.events = sanitizeImportedEvents(pendingImportData.events);
    pendingImportData.categories = sanitizeImportedCategories(pendingImportData.categories);
    const id = generateId();
    const segments = (pendingImportData.segments && Array.isArray(pendingImportData.segments) && pendingImportData.segments.length > 0)
        ? pendingImportData.segments
        : getDefaultSegments();
    state.timelines[id] = { id: id, name: candidateName, events: pendingImportData.events, categories: pendingImportData.categories, segments: segments };
    state.currentTimelineId = id;
    pendingImportData = null;
    closeImportChoiceModal();
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_imported_new', { name: candidateName }), 'success');
}

function closeImportChoiceModal() {
    $('importChoiceModal').classList.remove('open');
}

function loadExampleTimeline() {
    fetch('https://gist.githubusercontent.com/Parenji/02b79bb98905671eca2d5a2dd8fa5dc6/raw/14eae517171094a91a401e02010f011f5b366eb4/gistfile1.json')
        .then(function (response) {
            if (!response.ok) throw new Error('File not found');
            return response.json();
        })
        .then(function (data) {
            if (!data.timeline || !data.timeline.events) { throw new Error('Invalid format'); }
            const importedEvents = sanitizeImportedEvents(data.timeline.events);
            const importedCategories = sanitizeImportedCategories(data.timeline.categories || []);
            const importedName = data.timeline.name || 'History';
            const currentTl = getCurrentTimeline();
            const hasContent = (currentTl && (currentTl.events.length > 0 || currentTl.categories.length > 0));
            if (hasContent) {
                const baseName = importedName;
                let candidateName = baseName;
                let suffix = 1;
                while (Object.values(state.timelines).some(function (tl) { return tl.name.trim().toLowerCase() === candidateName.toLowerCase(); })) {
                    candidateName = baseName + ' (' + (++suffix) + ')';
                }
                const newId = generateId();
                const exSegments = (data.timeline && data.timeline.segments && Array.isArray(data.timeline.segments) && data.timeline.segments.length > 0)
                    ? data.timeline.segments
                    : getDefaultSegments();
                state.timelines[newId] = { id: newId, name: candidateName, events: importedEvents, categories: importedCategories, segments: exSegments };
                state.currentTimelineId = newId;
                saveState();
                expandedEventId = null;
                fullRender();
                showToast(t('toast_example_loaded', { name: candidateName }), 'success');
            } else {
                pushUndo();
                currentTl.name = importedName;
                currentTl.events = importedEvents;
                currentTl.categories = importedCategories;
                saveState();
                expandedEventId = null;
                fullRender();
                showToast(t('toast_example_loaded_existing', { name: importedName }), 'success');
            }
            if (importedEvents.length > 0) { scrollToYear(importedEvents[0].startYear); }
        })
        .catch(function (err) {
            showToast(t('toast_example_error', { error: err.message }), 'error');
        });
}