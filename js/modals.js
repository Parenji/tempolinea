// ================================================================
//  MODALS
// ================================================================
// Form tab configuration — declarative, single source of truth
const FORM_TABS = {
    note: {
        title: 'Nuovo Appunto',
        fields: {
            eventFields: 'none',
            periodFields: 'none',
            noteFields: 'block',
            eventOnlyFields: 'none',
            linkFields: 'none',
            imageUrlGroup: 'block'
        },
        inputs: {
            startYear: { required: false },
            periodStartYear: { required: false },
            periodEndYear: { required: false },
            noteYear: { required: true, focus: true }
        },
        label: { text: 'Titolo', placeholder: 'es. Appunto sulla battaglia...', required: false }
    },
    period: {
        title: 'Nuovo Periodo',
        fields: {
            eventFields: 'none',
            periodFields: 'block',
            noteFields: 'none',
            eventOnlyFields: 'block',
            linkFields: 'none',
            imageUrlGroup: 'block'
        },
        inputs: {
            startYear: { required: false },
            periodStartYear: { required: true, focus: true },
            periodEndYear: { required: true },
            noteYear: { required: false }
        },
        label: { text: 'Nome *', placeholder: 'es. Impero Romano', required: true }
    },
    event: {
        title: 'Nuovo Evento',
        fields: {
            eventFields: 'block',
            periodFields: 'none',
            noteFields: 'none',
            eventOnlyFields: 'block',
            linkFields: 'block',
            imageUrlGroup: 'block'
        },
        inputs: {
            startYear: { required: true, focus: true },
            periodStartYear: { required: false },
            periodEndYear: { required: false },
            noteYear: { required: false }
        },
        label: { text: 'Nome *', placeholder: 'es. Caduta dell\'Impero Romano', required: true }
    }
};

function switchFormTab(type) {
    currentFormType = type;
    // Update tab buttons
    document.querySelectorAll('.modal-tab').forEach(function (t) {
        var isActive = t.dataset.tab === type;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    const cfg = FORM_TABS[type];
    if (!cfg) return;
    // Show/hide field groups
    Object.keys(cfg.fields).forEach(function (fieldId) {
        const el = document.getElementById(fieldId);
        if (el) el.style.display = cfg.fields[fieldId];
    });
    // Set input required & focus
    Object.keys(cfg.inputs).forEach(function (inputId) {
        const el = document.getElementById(inputId);
        if (el) {
            el.required = cfg.inputs[inputId].required;
            if (cfg.inputs[inputId].focus) { el.focus(); el.select(); }
        }
    });
    // Set title label & placeholder
    const titleLabel = document.getElementById('eventTitleLabel');
    const title = document.getElementById('eventTitle');
    if (titleLabel) titleLabel.textContent = cfg.label.text;
    if (title) {
        title.placeholder = cfg.label.placeholder;
        title.required = cfg.label.required;
    }
    // Set modal title
    const modalTitle = document.getElementById('eventModalTitle');
    if (modalTitle) modalTitle.textContent = cfg.title;
    // Hide convert-to-period container (only shown when editing event with endYear)
    var convertContainer = document.getElementById('convertToPeriodContainer');
    if (convertContainer) convertContainer.style.display = 'none';
    // Hide convert-to-event container (only shown when editing a period)
    var convertEventContainer = document.getElementById('convertToEventContainer');
    if (convertEventContainer) convertEventContainer.style.display = 'none';
}

var lastFocusedElement = null;

function openModal(opts) {
    if (!opts) opts = {};
    // Hide quick create if it's visible (e.g. user pressed N shortcut)
    if (typeof hideQuickCreate === 'function') { hideQuickCreate(); }
    lastFocusedElement = document.activeElement;
    document.getElementById('eventModal').classList.add('open');
    var modal = document.getElementById('eventModal').querySelector('.modal');
    if (modal) modal.scrollTop = 0;
    document.getElementById('eventForm').reset();
    selectedCategoryId = null;
    editingEventId = null;
    expandedEventId = null;
    selectedLinkedEvents = [];
    var type = opts.type || 'event';
    currentFormType = type;
    renderCategorySelect();
    document.getElementById('eventSearchInput').value = '';
    renderLinkedEventsList();
    populateLinkedEvents();
    document.getElementById('modalTabs').style.display = 'flex';
    if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = '';
    // Pre-fill year if provided (must happen before switchFormTab so select() covers the value)
    if (opts.year !== undefined && opts.year !== null) {
        if (type === 'note') {
            document.getElementById('noteYear').value = opts.year;
        } else if (type === 'period') {
            document.getElementById('periodStartYear').value = opts.year;
        } else {
            document.getElementById('startYear').value = opts.year;
        }
    }
    switchFormTab(type);
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('open');
    editingEventId = null;
    selectedLinkedEvents = [];
    // Return focus to triggering element
    if (lastFocusedElement) {
        var el = lastFocusedElement;
        lastFocusedElement = null;
        setTimeout(function () { el.focus(); }, 100);
    }
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