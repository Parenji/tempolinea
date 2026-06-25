// ================================================================
//  MODALS
// ================================================================
function switchFormTab(type) {
    currentFormType = type;
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === type); });
    const eventFields = document.getElementById('eventFields');
    const periodFields = document.getElementById('periodFields');
    const noteFields = document.getElementById('noteFields');
    const eventOnlyFields = document.getElementById('eventOnlyFields');
    const titleLabel = document.getElementById('eventTitleLabel');
    const title = document.getElementById('eventTitle');
    const startYearInput = document.getElementById('startYear');
    const periodStartYearInput = document.getElementById('periodStartYear');
    const periodEndYearInput = document.getElementById('periodEndYear');
    const noteYearInput = document.getElementById('noteYear');
    const linkFields = document.getElementById('linkFields');
    const imageGroup = document.getElementById('imageUrlGroup');
    if (type === 'note') {
        eventFields.style.display = 'none';
        periodFields.style.display = 'none';
        noteFields.style.display = 'block';
        eventOnlyFields.style.display = 'none';
        linkFields.style.display = 'none';
        if (imageGroup) imageGroup.style.display = 'block';
        titleLabel.textContent = 'Titolo';
        title.placeholder = 'es. Appunto sulla battaglia...';
        title.required = false;
        startYearInput.required = false;
        periodStartYearInput.required = false;
        periodEndYearInput.required = false;
        noteYearInput.required = true;
        document.getElementById('eventModalTitle').textContent = 'Nuovo Appunto';
        noteYearInput.focus();
    } else if (type === 'period') {
        eventFields.style.display = 'none';
        periodFields.style.display = 'block';
        noteFields.style.display = 'none';
        eventOnlyFields.style.display = 'block';
        linkFields.style.display = 'none';
        if (imageGroup) imageGroup.style.display = 'block';
        titleLabel.textContent = 'Nome *';
        title.placeholder = 'es. Impero Romano';
        title.required = true;
        startYearInput.required = false;
        periodStartYearInput.required = true;
        periodEndYearInput.required = true;
        noteYearInput.required = false;
        document.getElementById('eventModalTitle').textContent = 'Nuovo Periodo';
        periodStartYearInput.focus();
    } else {
        eventFields.style.display = 'block';
        periodFields.style.display = 'none';
        noteFields.style.display = 'none';
        eventOnlyFields.style.display = 'block';
        linkFields.style.display = 'block';
        if (imageGroup) imageGroup.style.display = 'block';
        titleLabel.textContent = 'Nome *';
        title.placeholder = 'es. Caduta dell\'Impero Romano';
        title.required = true;
        startYearInput.required = true;
        periodStartYearInput.required = false;
        periodEndYearInput.required = false;
        noteYearInput.required = false;
        document.getElementById('eventModalTitle').textContent = 'Nuovo Evento';
        startYearInput.focus();
    }
}

function openModal() {
    document.getElementById('eventModal').classList.add('open');
    document.getElementById('eventForm').reset();
    selectedCategoryId = null;
    editingEventId = null;
    selectedLinkedEvents = [];
    currentFormType = 'event';
    renderCategorySelect();
    document.getElementById('eventSearchInput').value = '';
    renderLinkedEventsList();
    populateLinkedEvents();
    document.getElementById('modalTabs').style.display = 'flex';
    if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = '';
    switchFormTab('event');
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('open');
    editingEventId = null;
    selectedLinkedEvents = [];
}

// ================================================================
//  DELETE ALL
// ================================================================
function confirmDeleteAll() {
    const timeline = getCurrentTimeline();
    if (!timeline || (timeline.events.length === 0 && timeline.categories.length === 0)) {
        showToast('Non ci sono dati da cancellare', 'info');
        return;
    }
    document.getElementById('deleteConfirmModal').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('open');
}

function deleteWithoutExport() {
    closeDeleteModal();
    if (!confirm('Cancellare TUTTI i dati della timeline corrente?')) return;
    pushUndo();
    const timeline = getCurrentTimeline();
    if (timeline) { timeline.events = []; timeline.categories = []; }
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Dati cancellati', 'info');
}

function exportAndDelete() {
    closeDeleteModal();
    exportData();
    if (!confirm('Dati esportati. Cancellare TUTTI i dati?')) return;
    pushUndo();
    const timeline = getCurrentTimeline();
    if (timeline) { timeline.events = []; timeline.categories = []; }
    saveState();
    expandedEventId = null;
    fullRender();
    showToast('Dati esportati e cancellati', 'info');
}

function toggleMobileMenu() { /* placeholder */ }