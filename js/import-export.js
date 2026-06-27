// ================================================================
//  EXPORT / IMPORT
// ================================================================
function exportData() {
    const timeline = getCurrentTimeline();
    if (!timeline) return;
    const data = JSON.stringify({ timeline: timeline, exportDate: new Date().toISOString() }, null, 2);
    const suggestedName = 'timeline_' + timeline.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.json';
    if (window.showSaveFilePicker) {
        window.showSaveFilePicker({ suggestedName: suggestedName, types: [{ description: 'File JSON', accept: { 'application/json': ['.json'] } }] })
            .then(function (handle) { return handle.createWritable().then(function (writable) { return writable.write(data).then(function () { return writable.close(); }); }); })
            .then(function () { showToast('Dati esportati', 'success'); })
            .catch(function (err) { if (err.name !== 'AbortError') { showToast('Errore durante esportazione', 'error'); } });
        return;
    }
    let filename = prompt('Salva con nome:', suggestedName);
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
    showToast('Dati esportati', 'success');
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
                importedName = data.timeline.name || 'Importata';
            } else if (data.events && Array.isArray(data.events)) {
                importedEvents = data.events;
                importedCategories = data.categories || [];
                importedName = 'Importata (legacy)';
            } else {
                showToast('File non valido', 'error');
                event.target.value = '';
                return;
            }
            pendingImportData = { events: importedEvents, categories: importedCategories, name: importedName };
            const currentTl = getCurrentTimeline();
            const hasContent = (currentTl && (currentTl.events.length > 0 || currentTl.categories.length > 0));
            if (hasContent) {
                $('importCurrentTimelineName').textContent = currentTl.name;
                $('importChoiceModal').classList.add('open');
            } else {
                importIntoCurrentTimeline();
            }
        } catch (err) {
            showToast('Errore durante l\'importazione', 'error');
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
    pendingImportData = null;
    closeImportChoiceModal();
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Timeline "' + timeline.name + '" aggiornata con i dati importati', 'success');
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
    state.timelines[id] = { id: id, name: candidateName, events: pendingImportData.events, categories: pendingImportData.categories };
    state.currentTimelineId = id;
    pendingImportData = null;
    closeImportChoiceModal();
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Timeline "' + candidateName + '" importata', 'success');
}

function closeImportChoiceModal() {
    $('importChoiceModal').classList.remove('open');
}

function loadExampleTimeline() {
    fetch('https://gist.githubusercontent.com/Parenji/02b79bb98905671eca2d5a2dd8fa5dc6/raw/14eae517171094a91a401e02010f011f5b366eb4/gistfile1.json')
        .then(function (response) {
            if (!response.ok) throw new Error('File non trovato');
            return response.json();
        })
        .then(function (data) {
            if (!data.timeline || !data.timeline.events) { throw new Error('Formato non valido'); }
            const importedEvents = sanitizeImportedEvents(data.timeline.events);
            const importedCategories = sanitizeImportedCategories(data.timeline.categories || []);
            const importedName = data.timeline.name || 'Storia';
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
                state.timelines[newId] = { id: newId, name: candidateName, events: importedEvents, categories: importedCategories };
                state.currentTimelineId = newId;
                saveState();
                expandedEventId = null;
                fullRender();
                showToast('Timeline d\'esempio "' + candidateName + '" caricata', 'success');
            } else {
                pushUndo();
                currentTl.name = importedName;
                currentTl.events = importedEvents;
                currentTl.categories = importedCategories;
                saveState();
                expandedEventId = null;
                fullRender();
                showToast('Timeline d\'esempio caricata: ' + importedName, 'success');
            }
            if (importedEvents.length > 0) { scrollToYear(importedEvents[0].startYear); }
        })
        .catch(function (err) {
            showToast('Impossibile caricare la timeline d\'esempio: ' + err.message, 'error');
        });
}