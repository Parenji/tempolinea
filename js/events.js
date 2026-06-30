// ================================================================
//  EVENTS CRUD (including image support)
// ================================================================
function saveEvent() {
    pushUndo();
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const imageUrl = document.getElementById('eventImageUrl') ? document.getElementById('eventImageUrl').value.trim() : '';
    const allEvents = getEvents();

    if (currentFormType === 'note') {
        const noteYearVal = document.getElementById('noteYear').value;
        const noteYear = noteYearVal ? parseInt(noteYearVal) : null;
        if (isNaN(noteYear)) { showToast('Inserisci almeno l\'anno', 'error'); return; }
        if (editingEventId) {
            const index = allEvents.findIndex(function (e) { return e.id === editingEventId; });
            if (index !== -1) {
                allEvents[index].startYear = noteYear;
                allEvents[index].title = title;
                allEvents[index].description = description;
                allEvents[index].imageUrl = imageUrl;
            }
            showToast('Appunto modificato', 'success');
        } else {
            allEvents.push({ id: generateId(), type: 'note', startYear: noteYear, title: title, description: description, imageUrl: imageUrl });
            showToast('Appunto creato', 'success');
        }
        setEvents(allEvents);
        saveState();
        renderEvents();
        closeModal();
        scrollToYear(noteYear);
        return;
    }

    if (currentFormType === 'period') {
        const pStartYear = parseInt(document.getElementById('periodStartYear').value);
        const pStartMonth = document.getElementById('periodStartMonth').value ? parseInt(document.getElementById('periodStartMonth').value) : null;
        const pStartDay = document.getElementById('periodStartDay').value ? parseInt(document.getElementById('periodStartDay').value) : null;
        const pEndYear = parseInt(document.getElementById('periodEndYear').value);
        const pEndMonth = document.getElementById('periodEndMonth').value ? parseInt(document.getElementById('periodEndMonth').value) : null;
        const pEndDay = document.getElementById('periodEndDay').value ? parseInt(document.getElementById('periodEndDay').value) : null;
        if (isNaN(pStartYear) || isNaN(pEndYear) || !title) { showToast('Inserisci anno inizio, anno fine e nome', 'error'); return; }
        if (!selectedCategoryId) { showToast('Seleziona una categoria', 'error'); return; }
        const maxOverlap = getMaxSimultaneousPeriodsInRange(pStartYear, pEndYear, editingEventId);
        if (maxOverlap >= 2) { showToast('Limite raggiunto: in qualche punto di questo intervallo ci sarebbero troppi periodi simultanei', 'error'); return; }
        if (editingEventId) {
            const idx = allEvents.findIndex(function (e) { return e.id === editingEventId; });
            if (idx !== -1) {
                allEvents[idx] = { id: editingEventId, type: 'event', startYear: pStartYear, startMonth: pStartMonth, startDay: pStartDay, endYear: pEndYear, endMonth: pEndMonth, endDay: pEndDay, title: title, description: description, imageUrl: imageUrl, categoryId: selectedCategoryId, isPeriod: true };
            }
            showToast('Periodo modificato', 'success');
        } else {
            allEvents.push({ id: generateId(), type: 'event', startYear: pStartYear, startMonth: pStartMonth, startDay: pStartDay, endYear: pEndYear, endMonth: pEndMonth, endDay: pEndDay, title: title, description: description, imageUrl: imageUrl, categoryId: selectedCategoryId, isPeriod: true });
            showToast('Periodo creato', 'success');
        }
        setEvents(allEvents);
        saveState();
        renderEvents();
        closeModal();
        scrollToYear(pStartYear);
        return;
    }

    // Save normal event
    const startYear = parseInt(document.getElementById('startYear').value);
    const startMonth = document.getElementById('startMonth').value ? parseInt(document.getElementById('startMonth').value) : null;
    const startDay = document.getElementById('startDay').value ? parseInt(document.getElementById('startDay').value) : null;
    const endYear = document.getElementById('endYear').value ? parseInt(document.getElementById('endYear').value) : null;
    const endMonth = document.getElementById('endMonth').value ? parseInt(document.getElementById('endMonth').value) : null;
    const endDay = document.getElementById('endDay').value ? parseInt(document.getElementById('endDay').value) : null;
    const linkedEvents = selectedLinkedEvents.slice();
    if (isNaN(startYear) || !title) { showToast('Inserisci almeno l\'anno e il nome', 'error'); return; }
    if (!selectedCategoryId) { showToast('Seleziona una categoria', 'error'); return; }
    if (editingEventId) {
        const index = allEvents.findIndex(function (e) { return e.id === editingEventId; });
        if (index !== -1) {
            allEvents[index] = { id: editingEventId, type: 'event', startYear: startYear, startMonth: startMonth, startDay: startDay, endYear: endYear, endMonth: endMonth, endDay: endDay, title: title, description: description, imageUrl: imageUrl, categoryId: selectedCategoryId, linkedEvents: linkedEvents, isPeriod: false };
        }
        showToast('Evento modificato', 'success');
    } else {
        allEvents.push({ id: generateId(), type: 'event', startYear: startYear, startMonth: startMonth, startDay: startDay, endYear: endYear, endMonth: endMonth, endDay: endDay, title: title, description: description, imageUrl: imageUrl, categoryId: selectedCategoryId, linkedEvents: linkedEvents, isPeriod: false });
        showToast('Evento creato', 'success');
    }
    setEvents(allEvents);
    saveState();
    renderEvents();
    closeModal();
    scrollToYear(startYear);
}

function editEvent(eventId) {
    const allEvents = getEvents();
    const event = allEvents.find(function (e) { return String(e.id) === String(eventId); });
    if (!event) return;
    editingEventId = eventId;
    document.getElementById('modalTabs').style.display = 'none';
    const imageUrl = event.imageUrl || '';
    if (event.type === 'note') {
        currentFormType = 'note';
        document.getElementById('noteYear').value = event.startYear;
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDescription').value = event.description || '';
        if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = imageUrl;
        document.getElementById('eventModalTitle').textContent = 'Modifica Appunto';
        switchFormTab('note');
    } else if (event.isPeriod) {
        currentFormType = 'period';
        selectedCategoryId = event.categoryId;
        document.getElementById('periodStartYear').value = event.startYear;
        document.getElementById('periodStartMonth').value = event.startMonth || '';
        document.getElementById('periodStartDay').value = event.startDay || '';
        document.getElementById('periodEndYear').value = event.endYear || '';
        document.getElementById('periodEndMonth').value = event.endMonth || '';
        document.getElementById('periodEndDay').value = event.endDay || '';
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = imageUrl;
        renderCategorySelect();
        selectedLinkedEvents = [];
        renderLinkedEventsList();
        document.getElementById('eventModalTitle').textContent = 'Modifica Periodo';
        switchFormTab('period');
        // Show convert-to-event button for periods
        var convertEventContainer = document.getElementById('convertToEventContainer');
        if (convertEventContainer) {
            convertEventContainer.style.display = 'block';
        }
    } else {
        currentFormType = 'event';
        selectedCategoryId = event.categoryId;
        document.getElementById('startYear').value = event.startYear;
        document.getElementById('startMonth').value = event.startMonth || '';
        document.getElementById('startDay').value = event.startDay || '';
        document.getElementById('endYear').value = event.endYear || '';
        document.getElementById('endMonth').value = event.endMonth || '';
        document.getElementById('endDay').value = event.endDay || '';
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = imageUrl;
        renderCategorySelect();
        document.getElementById('eventSearchInput').value = '';
        selectedLinkedEvents = (event.linkedEvents && Array.isArray(event.linkedEvents)) ? event.linkedEvents.slice() : [];
        renderLinkedEventsList();
        populateLinkedEvents();
        document.getElementById('eventModalTitle').textContent = 'Modifica Evento';
        switchFormTab('event');
        // Show convert-to-period button if event has endYear
        var convertContainer = document.getElementById('convertToPeriodContainer');
        if (convertContainer) {
            convertContainer.style.display = event.endYear ? 'block' : 'none';
        }
    }
    document.getElementById('eventModal').classList.add('open');
}

function convertToPeriod() {
    if (!editingEventId) return;
    const allEvents = getEvents();
    const event = allEvents.find(function (e) { return String(e.id) === String(editingEventId); });
    if (!event) return;
    if (event.isPeriod) { showToast('È già un periodo', 'info'); return; }
    if (!event.endYear) { showToast('L\'evento non ha una data di fine', 'error'); return; }
    pushUndo();
    event.isPeriod = true;
    setEvents(allEvents);
    saveState();
    closeModal();
    renderEvents();
    showToast('Evento trasformato in periodo', 'success');
}

function convertToEvent() {
    if (!editingEventId) return;
    const allEvents = getEvents();
    const event = allEvents.find(function (e) { return String(e.id) === String(editingEventId); });
    if (!event) return;
    if (!event.isPeriod) { showToast('È già un evento', 'info'); return; }
    pushUndo();
    event.isPeriod = false;
    setEvents(allEvents);
    saveState();
    closeModal();
    renderEvents();
    showToast('Periodo trasformato in evento', 'success');
}

function deleteEvent(eventId) {
    if (!confirm('Eliminare questo evento?')) return;
    pushUndo();
    setEvents(getEvents().filter(function (e) { return e.id !== eventId; }));
    saveState();
    if (expandedEventId === eventId) expandedEventId = null;
    renderEvents();
    showToast('Evento eliminato', 'info');
}

// ================================================================
//  PERIOD VALIDATION
// ================================================================
function getMaxSimultaneousPeriodsInRange(newStartYear, newEndYear, excludeEventId) {
    const allEvents = getEvents();
    const nStart = Math.min(newStartYear, newEndYear);
    const nEnd = Math.max(newStartYear, newEndYear);
    const overlappingPeriods = [];
    allEvents.forEach(function (e) {
        if (!e.isPeriod || !e.endYear) return;
        if (excludeEventId && String(e.id) === String(excludeEventId)) return;
        const eStart = Math.min(e.startYear, e.endYear);
        const eEnd = Math.max(e.startYear, e.endYear);
        if (nStart < eEnd && eStart < nEnd) {
            if (nStart === eEnd || nEnd === eStart) return;
            overlappingPeriods.push({ start: eStart, end: eEnd });
        }
    });
    const sweepEvents = [];
    overlappingPeriods.forEach(function (p) {
        sweepEvents.push({ year: p.start, type: 'start' });
        sweepEvents.push({ year: p.end, type: 'end' });
    });
    sweepEvents.sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        if (a.type === 'end' && b.type === 'start') return -1;
        if (a.type === 'start' && b.type === 'end') return 1;
        return 0;
    });
    let currentCount = 0;
    let maxCount = 0;
    sweepEvents.forEach(function (evt) {
        if (evt.type === 'start') { currentCount++; maxCount = Math.max(maxCount, currentCount); }
        else { currentCount--; }
    });
    return maxCount;
}

// ================================================================
//  LINKED EVENTS PICKER
// ================================================================
function renderLinkedEventsList() {
    const container = document.getElementById('selectedLinkedEventsList');
    container.innerHTML = '';
    const allEvents = getEvents();
    if (selectedLinkedEvents.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);font-size:0.75rem;padding:0.3rem 0;">Nessun evento collegato.</div>';
    }
    selectedLinkedEvents.forEach(function (link, index) {
        const linkedEvent = allEvents.find(function (e) { return String(e.id) === String(link.eventId); });
        const name = linkedEvent ? linkedEvent.title : '(evento non trovato)';
        const year = linkedEvent ? formatYear(linkedEvent.startYear) : '';
        const side = link.side || 'auto';
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0.6rem;background:rgba(124,58,237,0.1);border-radius:6px;margin-bottom:0.35rem;gap:0.4rem;';
        item.innerHTML = '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.7rem;color:var(--text-secondary);">' + escapeHtml(year) + '</div>' +
            '<div style="font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(name) + '</div>' +
            '</div>' +
            '<select onchange="updateLinkedEventSide(' + index + ', this.value)" style="width:auto;padding:0.2rem 0.35rem;font-size:0.7rem;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;color:var(--text-primary);">' +
            '<option value="auto"' + (side === 'auto' ? ' selected' : '') + '>Auto</option>' +
            '<option value="left"' + (side === 'left' ? ' selected' : '') + '>← Sx</option>' +
            '<option value="right"' + (side === 'right' ? ' selected' : '') + '>Dx →</option>' +
            '</select>' +
            '<button type="button" onclick="removeLinkedEvent(' + index + ')" style="background:transparent;border:none;color:var(--text-secondary);cursor:pointer;font-size:1.1rem;padding:0 0.2rem;">×</button>';
        container.appendChild(item);
    });
}

function addLinkedEvent(eventId) {
    const alreadyAdded = selectedLinkedEvents.some(function (l) { return String(l.eventId) === String(eventId); });
    if (alreadyAdded) { showToast('Evento già collegato', 'info'); return; }
    selectedLinkedEvents.push({ eventId: eventId, side: 'auto' });
    document.getElementById('eventSearchInput').value = '';
    document.getElementById('linkedEventList').classList.remove('visible');
    renderLinkedEventsList();
    populateLinkedEvents('');
}

function removeLinkedEvent(index) {
    selectedLinkedEvents.splice(index, 1);
    renderLinkedEventsList();
}

function updateLinkedEventSide(index, newSide) {
    selectedLinkedEvents[index].side = newSide;
}

function populateLinkedEvents(filter) {
    const container = document.getElementById('linkedEventList');
    container.innerHTML = '';
    renderLinkedEventsList();
    const allEvents = getEvents();
    const alreadyLinkedIds = selectedLinkedEvents.map(function (l) { return l.eventId; });
    const events = allEvents.filter(function (e) {
        if (editingEventId && e.id === editingEventId) return false;
        if (alreadyLinkedIds.indexOf(e.id) !== -1) return false;
        if (e.isPeriod) return false;
        const searchText = formatYear(e.startYear) + ' ' + e.title;
        return searchText.toLowerCase().indexOf((filter || '').toLowerCase()) !== -1;
    });
    events.forEach(function (event) {
        const item = document.createElement('div');
        item.className = 'linked-event-item';
        item.innerHTML = '<div class="linked-event-year">' + formatYear(event.startYear) + '</div>' +
            '<div class="linked-event-title">' + escapeHtml(event.title) + '</div>';
        item.onclick = function () { addLinkedEvent(event.id); };
        container.appendChild(item);
    });
}

function filterLinkedEvents() {
    const searchValue = document.getElementById('eventSearchInput').value;
    const list = document.getElementById('linkedEventList');
    if (searchValue.trim() === '') {
        list.classList.remove('visible');
    } else {
        list.classList.add('visible');
    }
    populateLinkedEvents(searchValue);
}