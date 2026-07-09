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
    renderCategorySelects();
    // Hide second category group initially
    updateSecondCategorySelect(null);
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

function toggleMobileMenu() {
    var overlay = document.getElementById('mobileDrawerOverlay');
    var drawer = document.getElementById('mobileDrawer');
    if (!overlay || !drawer) return;
    var isOpen = drawer.classList.contains('open');
    if (isOpen) {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
    } else {
        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.classList.add('drawer-open');
    }
}

function openSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (!modal) return;
    var checkbox = document.getElementById('settingShowPills');
    if (checkbox) {
        var showPills = localStorage.getItem('timeline_showPills');
        checkbox.checked = showPills !== 'false'; // default true
    }
    renderSegmentsList();
    modal.classList.add('open');
    modal.addEventListener('click', function handler(e) {
        if (e.target === modal) { closeSettingsModal(); modal.removeEventListener('click', handler); }
    });
}

function closeSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('open');
}

function saveSettings() {
    var checkbox = document.getElementById('settingShowPills');
    if (checkbox) {
        var showPills = checkbox.checked;
        localStorage.setItem('timeline_showPills', showPills);
        applyPillVisibility();
    }
    // Save segments
    var segments = readSegmentsFromUI();
    if (segments) {
        saveSegments(segments);
        clearYearCache();
        fullRender();
        showToast('Impostazioni salvate', 'success');
    }
    closeSettingsModal();
}

function loadSettings() {
    var showPills = localStorage.getItem('timeline_showPills');
    if (showPills === 'false') {
        applyPillVisibility();
    }
}

function applyPillVisibility() {
    var showPills = localStorage.getItem('timeline_showPills');
    var pillRow = document.getElementById('pillRow');
    if (!pillRow) return;
    if (showPills === 'false') {
        pillRow.style.display = 'none';
    } else {
        pillRow.style.display = '';
    }
    // Re-position mini-map after pill visibility change
    if (typeof positionMiniMap === 'function') {
        setTimeout(function () { positionMiniMap(); }, 300);
    }
}

// ================================================================
//  SEGMENTS EDITOR (Settings Modal)
// ================================================================
// Density options: [value, label]
var DENSITY_OPTIONS = [
    [0.25, 'Minima (0.25×)'],
    [0.5, 'Molto bassa (0.5×)'],
    [1, 'Bassa (1×)'],
    [3, 'Medio-bassa (3×)'],
    [5, 'Normale (5×)'],
    [10, 'Media (10×)'],
    [20, 'Medio-alta (20×)'],
    [40, 'Alta (40×)'],
    [60, 'Molto alta (60×)'],
    [100, 'Massima (100×)'],
    [-1, 'Personalizzata...']
];

var RULER_STEP_OPTIONS = [
    [1, 'Anno (1)'],
    [10, 'Decennio (10)'],
    [100, 'Secolo (100)']
];

function renderSegmentsList() {
    var body = document.getElementById('segmentsBody');
    if (!body) return;
    var segments = getSegments();
    updateSegmentsCountBadge(segments.length);
    var html = '';
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var isLast = (i === segments.length - 1);
        var isFirst = (i === 0);
        var startReadonly = !isFirst ? ' readonly class="readonly-start"' : '';
        var densitySelect = buildDensitySelect(seg.density, i);
        var stepSelect = buildStepSelect(seg.rulerStep, seg.rulerLabel, i);
        var delDisabled = segments.length <= 1 ? ' disabled' : '';
        html += '<div class="segment-row" data-index="' + i + '">';
        html += '<span class="seg-col-start"><input type="number" id="seg_start_' + i + '" value="' + seg.start + '"' + (isFirst ? ' onchange="onSegmentStartChange(' + i + ')"' : ' readonly') + ' class="' + (isFirst ? '' : 'readonly-start') + '" aria-label="Inizio segmento ' + (i + 1) + '"></span>';
        html += '<span class="seg-col-end"><input type="number" id="seg_end_' + i + '" value="' + seg.end + '" onchange="onSegmentEndChange(' + i + ')" aria-label="Fine segmento ' + (i + 1) + '"></span>';
        html += '<span class="seg-col-density">' + densitySelect + '</span>';
        html += '<span class="seg-col-step">' + stepSelect + '</span>';
        html += '<span class="seg-col-remove"><button class="seg-remove-btn" onclick="removeSegmentUI(' + i + ')"' + delDisabled + '>🗑 Rimuovi</button></span>';
        html += '</div>';
        // Hidden custom density input
        html += '<div class="segment-row custom-density-row" id="seg_custom_' + i + '" style="display:none;">';
        html += '<span class="seg-col-start"></span>';
        html += '<span class="seg-col-end"></span>';
        html += '<span class="seg-col-density" style="grid-column:3 / 5;"><input type="number" id="seg_density_custom_' + i + '" value="' + seg.density + '" step="0.1" min="0.05" placeholder="Densità personalizzata" aria-label="Densità personalizzata segmento ' + (i + 1) + '" style="text-align:left;width:100%;"></span>';
        html += '<span class="seg-col-remove"></span>';
        html += '</div>';
    }
    body.innerHTML = html;
}

function buildDensitySelect(currentDensity, index) {
    var found = DENSITY_OPTIONS.some(function(opt) { return opt[0] === currentDensity; });
    var html = '<select id="seg_density_' + index + '" onchange="onDensityChange(' + index + ')" aria-label="Spaziatura segmento ' + (index + 1) + '">';
    for (var i = 0; i < DENSITY_OPTIONS.length; i++) {
        var opt = DENSITY_OPTIONS[i];
        var selected = '';
        if (opt[0] === currentDensity) selected = ' selected';
        else if (opt[0] === -1 && !found && i === DENSITY_OPTIONS.length - 1) selected = ' selected';
        html += '<option value="' + opt[0] + '"' + selected + '>' + opt[1] + '</option>';
    }
    html += '</select>';
    return html;
}

function buildStepSelect(currentStep, currentLabel, index) {
    var html = '<select id="seg_step_' + index + '" onchange="onStepChange(' + index + ')" aria-label="Passo righello segmento ' + (index + 1) + '">';
    for (var i = 0; i < RULER_STEP_OPTIONS.length; i++) {
        var opt = RULER_STEP_OPTIONS[i];
        var selected = (opt[0] === currentStep) ? ' selected' : '';
        html += '<option value="' + opt[0] + '"' + selected + '>' + opt[1] + '</option>';
    }
    html += '</select>';
    return html;
}

function onDensityChange(index) {
    var sel = document.getElementById('seg_density_' + index);
    var customRow = document.getElementById('seg_custom_' + index);
    if (!sel || !customRow) return;
    if (sel.value === '-1') {
        customRow.style.display = 'flex';
    } else {
        customRow.style.display = 'none';
    }
}

function onStepChange(index) {
    // No extra action needed — step value is read directly from the select
}

function onSegmentEndChange(index) {
    var endInput = document.getElementById('seg_end_' + index);
    var nextStartInput = document.getElementById('seg_start_' + (index + 1));
    if (endInput && nextStartInput) {
        nextStartInput.value = endInput.value;
    }
    // Also update start of the first segment if index is the last one and there's only one segment
    var segments = getSegments();
    if (index === 0 && segments.length === 1) {
        // The only segment: start is already editable, nothing extra needed
    }
}

function onSegmentStartChange(index) {
    if (index === 0) return; // only first segment has editable start
    // If the user manually changes the start of a non-first segment,
    // update the end of the previous segment
    var startInput = document.getElementById('seg_start_' + index);
    var prevEndInput = document.getElementById('seg_end_' + (index - 1));
    if (startInput && prevEndInput) {
        prevEndInput.value = startInput.value;
    }
}

function addSegmentUI() {
    var segments = getSegments();
    var lastSeg = segments[segments.length - 1];
    var newStart = lastSeg.end;
    var newEnd = lastSeg.end + 100;
    var newSeg = { start: newStart, end: newEnd, density: lastSeg.density, rulerStep: lastSeg.rulerStep, rulerLabel: lastSeg.rulerLabel };
    segments.push(newSeg);
    // Update the current segments list (not saved yet — user must click Save)
    // We store segments in a temporary variable so the UI can work without saving
    window._editingSegments = segments;
    renderSegmentsFromArray(segments);
}

function removeSegmentUI(index) {
    var segments = window._editingSegments ? window._editingSegments.slice() : getSegments().slice();
    if (segments.length <= 1) return;
    segments.splice(index, 1);
    // Re-chain: update start of the segment that now follows the removed one
    if (index > 0 && index < segments.length) {
        segments[index].start = segments[index - 1].end;
    }
    window._editingSegments = segments;
    renderSegmentsFromArray(segments);
}

function renderSegmentsFromArray(segments) {
    var body = document.getElementById('segmentsBody');
    if (!body) return;
    updateSegmentsCountBadge(segments.length);
    var html = '';
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var isFirst = (i === 0);
        var densitySelect = buildDensitySelect(seg.density, i);
        var stepSelect = buildStepSelect(seg.rulerStep, seg.rulerLabel, i);
        var delDisabled = segments.length <= 1 ? ' disabled' : '';
        html += '<div class="segment-row" data-index="' + i + '">';
        html += '<span class="seg-col-start"><input type="number" id="seg_start_' + i + '" value="' + seg.start + '"' + (isFirst ? ' onchange="onSegmentStartChange(' + i + ')"' : ' readonly') + ' class="' + (isFirst ? '' : 'readonly-start') + '" aria-label="Inizio segmento ' + (i + 1) + '"></span>';
        html += '<span class="seg-col-end"><input type="number" id="seg_end_' + i + '" value="' + seg.end + '" onchange="onSegmentEndChange(' + i + ')" aria-label="Fine segmento ' + (i + 1) + '"></span>';
        html += '<span class="seg-col-density">' + densitySelect + '</span>';
        html += '<span class="seg-col-step">' + stepSelect + '</span>';
        html += '<span class="seg-col-remove"><button class="seg-remove-btn" onclick="removeSegmentUI(' + i + ')"' + delDisabled + '>🗑 Rimuovi</button></span>';
        html += '</div>';
        // Hidden custom density input
        html += '<div class="segment-row custom-density-row" id="seg_custom_' + i + '" style="display:none;">';
        html += '<span class="seg-col-start"></span>';
        html += '<span class="seg-col-end"></span>';
        html += '<span class="seg-col-density" style="grid-column:3 / 5;"><input type="number" id="seg_density_custom_' + i + '" value="' + seg.density + '" step="0.1" min="0.05" placeholder="Densità personalizzata" aria-label="Densità personalizzata segmento ' + (i + 1) + '" style="text-align:left;width:100%;"></span>';
        html += '<span class="seg-col-remove"></span>';
        html += '</div>';
    }
    body.innerHTML = html;
}

function readSegmentsFromUI() {
    var body = document.getElementById('segmentsBody');
    if (!body) return null;
    var rows = body.querySelectorAll('.segment-row[data-index]');
    var segments = [];
    for (var i = 0; i < rows.length; i++) {
        var idx = rows[i].dataset.index;
        var startEl = document.getElementById('seg_start_' + idx);
        var endEl = document.getElementById('seg_end_' + idx);
        var densitySel = document.getElementById('seg_density_' + idx);
        var stepSel = document.getElementById('seg_step_' + idx);
        if (!startEl || !endEl || !densitySel || !stepSel) continue;
        var start = parseInt(startEl.value);
        var end = parseInt(endEl.value);
        if (isNaN(start) || isNaN(end)) {
            showToast('I valori di inizio e fine devono essere numeri validi.', 'error');
            return null;
        }
        if (end <= start) {
            showToast('La fine del segmento deve essere maggiore dell\'inizio (segmento ' + (parseInt(idx) + 1) + ').', 'error');
            return null;
        }
        var density = parseFloat(densitySel.value);
        if (densitySel.value === '-1') {
            var customEl = document.getElementById('seg_density_custom_' + idx);
            if (customEl) {
                density = parseFloat(customEl.value);
                if (isNaN(density) || density <= 0) {
                    showToast('La densità personalizzata del segmento ' + (parseInt(idx) + 1) + ' deve essere un numero positivo.', 'error');
                    return null;
                }
            }
        }
        var step = parseInt(stepSel.value);
        var label = 'year';
        if (step === 100) label = 'century';
        else if (step === 10) label = 'decade';
        segments.push({ start: start, end: end, density: density, rulerStep: step, rulerLabel: label });
    }
    // Validate contiguity
    for (var j = 1; j < segments.length; j++) {
        if (segments[j].start !== segments[j - 1].end) {
            showToast('I segmenti devono essere contigui: la fine del segmento ' + j + ' deve coincidere con l\'inizio del segmento ' + (j + 1) + '.', 'error');
            return null;
        }
    }
    return segments;
}

function updateSegmentsCountBadge(count) {
    var badge = document.getElementById('segmentsCountBadge');
    if (badge) {
        badge.textContent = count + ' segment' + (count !== 1 ? 'i' : 'o');
    }
}

function toggleSegmentsAccordion() {
    var body = document.getElementById('segmentsAccordionBody');
    var arrow = document.getElementById('segmentsAccordionArrow');
    var toggle = document.getElementById('segmentsAccordionToggle');
    if (!body || !arrow || !toggle) return;
    var isOpen = body.style.display !== 'none';
    if (isOpen) {
        body.style.display = 'none';
        arrow.textContent = '▶';
        toggle.setAttribute('aria-expanded', 'false');
    } else {
        body.style.display = '';
        arrow.textContent = '▼';
        toggle.setAttribute('aria-expanded', 'true');
    }
}

function resetSegmentsToDefaultUI() {
    resetSegmentsToDefault();
    window._editingSegments = null;
    renderSegmentsList();
    showToast('Segmenti ripristinati ai valori predefiniti. Clicca Salva per confermare.', 'info');
}
