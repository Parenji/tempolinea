// ================================================================
//  MODALS
// ================================================================
// Form tab configuration — declarative, single source of truth
const FORM_TABS = {
    note: {
        titleKey: 'new_note_title',
        editTitleKey: 'edit_note_title',
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
        label: { textKey: 'title_label', placeholder: 'es. Appunto sulla battaglia...', required: false }
    },
    period: {
        titleKey: 'new_period_title',
        editTitleKey: 'edit_period_title',
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
        label: { textKey: 'title_label', placeholder: 'es. Impero Romano', required: true }
    },
    event: {
        titleKey: 'new_event_title',
        editTitleKey: 'edit_event_title',
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
        label: { textKey: 'title_label', placeholder: 'es. Caduta dell\'Impero Romano', required: true }
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
    if (titleLabel) titleLabel.textContent = t(cfg.label.textKey) + (cfg.label.required ? ' ' + t('required') : '');
    if (title) {
        title.placeholder = cfg.label.placeholder;
        title.required = cfg.label.required;
    }
    // Set modal title (only if not editing)
    const modalTitle = document.getElementById('eventModalTitle');
    if (modalTitle && !editingEventId) modalTitle.textContent = t(cfg.titleKey);
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
        showToast(t('toast_no_data_to_delete'), 'info');
        return;
    }
    document.getElementById('deleteConfirmModal').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('open');
}

function deleteWithoutExport() {
    closeDeleteModal();
    if (!confirm(t('toast_confirm_delete_all'))) return;
    pushUndo();
    const timeline = getCurrentTimeline();
    if (timeline) { timeline.events = []; timeline.categories = []; }
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_deleted'), 'info');
}

function exportAndDelete() {
    closeDeleteModal();
    exportData();
    if (!confirm(t('toast_confirm_delete_all_after_export'))) return;
    pushUndo();
    const timeline = getCurrentTimeline();
    if (timeline) { timeline.events = []; timeline.categories = []; }
    saveState();
    expandedEventId = null;
    fullRender();
    showToast(t('toast_exported_and_deleted'), 'info');
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
    // Set language select
    var langSelect = document.getElementById('settingLanguage');
    if (langSelect) {
        langSelect.value = getCurrentLanguage();
    }
    modal.classList.add('open');
    modal.addEventListener('click', function handler(e) {
        if (e.target === modal) { closeSettingsModal(); modal.removeEventListener('click', handler); }
    });
}

function closeSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('open');
}

function savePillSetting() {
    var checkbox = document.getElementById('settingShowPills');
    if (checkbox) {
        var showPills = checkbox.checked;
        localStorage.setItem('timeline_showPills', showPills);
        applyPillVisibility();
    }
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
// Density options: [value, label_key] — use t() for labels
var DENSITY_OPTIONS = [
    [0.25, 'density_min'],
    [0.5, 'density_very_low'],
    [1, 'density_low'],
    [3, 'density_med_low'],
    [5, 'density_normal'],
    [10, 'density_medium'],
    [20, 'density_med_high'],
    [40, 'density_high'],
    [60, 'density_very_high'],
    [100, 'density_max'],
    [-1, 'density_custom']
];

var RULER_STEP_OPTIONS = [
    [1, 'ruler_step_year'],
    [10, 'ruler_step_decade'],
    [100, 'ruler_step_century']
];

function renderSegmentsList() {
    var body = document.getElementById('segmentsBody');
    if (!body) return;
    var segments = getSegments();
    // Initialize editing buffer from saved segments
    window._editingSegments = segments.map(function(s) { return Object.assign({}, s); });
    updateSegmentsCountBadge(segments.length);
    renderSegmentsFromArray(window._editingSegments);
}

function buildDensitySelect(currentDensity, index) {
    var found = DENSITY_OPTIONS.some(function(opt) { return opt[0] === currentDensity; });
    var html = '<select id="seg_density_' + index + '" onchange="onDensityChange(' + index + ')" aria-label="' + t('segment_density_aria', { n: index + 1 }) + '">';
    for (var i = 0; i < DENSITY_OPTIONS.length; i++) {
        var opt = DENSITY_OPTIONS[i];
        var selected = '';
        if (opt[0] === currentDensity) selected = ' selected';
        else if (opt[0] === -1 && !found && i === DENSITY_OPTIONS.length - 1) selected = ' selected';
        html += '<option value="' + opt[0] + '"' + selected + '>' + t(opt[1]) + '</option>';
    }
    html += '</select>';
    return html;
}

function buildStepSelect(currentStep, currentLabel, index) {
    var html = '<select id="seg_step_' + index + '" onchange="onStepChange(' + index + ')" aria-label="Segments step">';
    for (var i = 0; i < RULER_STEP_OPTIONS.length; i++) {
        var opt = RULER_STEP_OPTIONS[i];
        var selected = (opt[0] === currentStep) ? ' selected' : '';
        html += '<option value="' + opt[0] + '"' + selected + '>' + t(opt[1]) + '</option>';
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
    syncSegmentsFromDOM();
    var segs = window._editingSegments;
    if (!segs) return;
    var seg = segs[index];
    if (!seg) return;
    // For editable-start segments: only auto-sort when BOTH start and end are valid
    if (seg.__editableStart) {
        if (seg.start === '' || seg.end === '' || isNaN(seg.start) || isNaN(seg.end)) {
            window._editingSegments = segs;
            return;
        }
        if (seg.end <= seg.start) seg.end = seg.start + 100;
        segs = sortAndChainSegments(segs);
        window._editingSegments = segs;
        renderSegmentsFromArray(segs);
        return;
    }
    if (isNaN(seg.start) || isNaN(seg.end)) return;
    if (seg.end <= seg.start) seg.end = seg.start + 100;
    if (index + 1 < segs.length) segs[index + 1].start = seg.end;
    window._editingSegments = segs;
    renderSegmentsFromArray(segs);
}

function onSegmentStartChange(index) {
    syncSegmentsFromDOM();
    var segs = window._editingSegments;
    if (!segs) return;
    var seg = segs[index];
    if (!seg) return;
    if (seg.__editableStart) {
        if (seg.start === '' || seg.end === '' || isNaN(seg.start) || isNaN(seg.end)) {
            window._editingSegments = segs;
            return;
        }
        if (seg.end <= seg.start) seg.end = seg.start + 100;
        segs = sortAndChainSegments(segs);
        window._editingSegments = segs;
        renderSegmentsFromArray(segs);
        return;
    }
    if (seg.start === '' || isNaN(seg.start)) return;
    if (index === 0) {
        if (seg.end !== '' && !isNaN(seg.end) && seg.end <= seg.start) seg.end = seg.start + 100;
    } else {
        segs[index - 1].end = seg.start;
    }
    window._editingSegments = segs;
    renderSegmentsFromArray(segs);
}

function sortAndChainSegments(segments) {
    var newSeg = null;
    for (var k = 0; k < segments.length; k++) {
        if (segments[k].__editableStart) { newSeg = segments[k]; break; }
    }
    var sorted = segments.slice();
    sorted.sort(function(a, b) { return a.start - b.start; });
    var newIdx = -1;
    for (var n = 0; n < sorted.length; n++) {
        if (sorted[n] === newSeg) { newIdx = n; break; }
    }
    if (newIdx >= 0) {
        if (newIdx > 0) {
            sorted[newIdx - 1].end = newSeg.start;
            if (sorted[newIdx - 1].end <= sorted[newIdx - 1].start) {
                sorted[newIdx - 1].end = sorted[newIdx - 1].start + 100;
            }
        }
        if (newIdx + 1 < sorted.length) {
            sorted[newIdx + 1].start = newSeg.end;
            if (isNaN(sorted[newIdx + 1].end) || sorted[newIdx + 1].end <= sorted[newIdx + 1].start) {
                sorted[newIdx + 1].end = sorted[newIdx + 1].start + 100;
            }
        }
        for (var i = 1; i < newIdx; i++) {
            sorted[i].start = sorted[i - 1].end;
            if (isNaN(sorted[i].end) || sorted[i].end <= sorted[i].start) {
                sorted[i].end = sorted[i].start + 100;
            }
        }
        for (var j = newIdx + 2; j < sorted.length; j++) {
            sorted[j].start = sorted[j - 1].end;
            if (isNaN(sorted[j].end) || sorted[j].end <= sorted[j].start) {
                sorted[j].end = sorted[j].start + 100;
            }
        }
    }
    for (var m = 0; m < sorted.length; m++) {
        sorted[m].__editableStart = false;
    }
    return sorted;
}

function syncSegmentsFromDOM() {
    var segs = window._editingSegments;
    if (!segs) return;
    for (var i = 0; i < segs.length; i++) {
        var startEl = document.getElementById('seg_start_' + i);
        var endEl = document.getElementById('seg_end_' + i);
        var densitySel = document.getElementById('seg_density_' + i);
        var stepSel = document.getElementById('seg_step_' + i);
        if (startEl) {
            var sVal = startEl.value.trim();
            if (sVal === '') { segs[i].start = ''; }
            else { var sNum = parseInt(sVal); if (!isNaN(sNum)) segs[i].start = sNum; }
        }
        if (endEl) {
            var eVal = endEl.value.trim();
            if (eVal === '') { segs[i].end = ''; }
            else { var eNum = parseInt(eVal); if (!isNaN(eNum)) segs[i].end = eNum; }
        }
        if (densitySel) {
            var dVal = parseFloat(densitySel.value);
            if (densitySel.value === '-1') {
                var customEl = document.getElementById('seg_density_custom_' + i);
                if (customEl) dVal = parseFloat(customEl.value) || segs[i].density;
            }
            if (!isNaN(dVal) && dVal > 0) segs[i].density = dVal;
        }
        if (stepSel) {
            var stVal = parseInt(stepSel.value);
            if (!isNaN(stVal)) {
                segs[i].rulerStep = stVal;
                segs[i].rulerLabel = stVal === 100 ? 'century' : (stVal === 10 ? 'decade' : 'year');
            }
        }
    }
}

function addSegmentUI() {
    var segs = window._editingSegments ? window._editingSegments.slice() : getSegments().map(function(s) { return Object.assign({}, s); });
    var lastSeg = segs[segs.length - 1];
    var newSeg = { start: '', end: '', density: lastSeg.density, rulerStep: lastSeg.rulerStep, rulerLabel: lastSeg.rulerLabel, __editableStart: true };
    segs.push(newSeg);
    window._editingSegments = segs;
    renderSegmentsFromArray(segs);
    requestAnimationFrame(function() {
        var table = document.getElementById('segmentsTable');
        if (table) { table.scrollTop = table.scrollHeight; }
    });
}

function removeSegmentUI(index) {
    var segs = window._editingSegments ? window._editingSegments.slice() : getSegments().map(function(s) { return Object.assign({}, s); });
    if (segs.length <= 1) return;
    segs.splice(index, 1);
    for (var i = 1; i < segs.length; i++) {
        if (segs[i].__editableStart && segs[i].start === segs[i - 1].end) {
            segs[i].__editableStart = false;
        }
        segs[i].start = segs[i - 1].end;
        if (segs[i].end <= segs[i].start) {
            segs[i].end = segs[i].start + 100;
        }
    }
    window._editingSegments = segs;
    renderSegmentsFromArray(segs);
}

function renderSegmentsFromArray(segments) {
    var body = document.getElementById('segmentsBody');
    if (!body) return;
    updateSegmentsCountBadge(segments.length);
    var html = '';
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var isFirst = (i === 0);
        var startEditable = isFirst || seg.__editableStart === true;
        var densitySelect = buildDensitySelect(seg.density, i);
        var stepSelect = buildStepSelect(seg.rulerStep, seg.rulerLabel, i);
        var delDisabled = segments.length <= 1 ? ' disabled' : '';
        html += '<div class="segment-row" data-index="' + i + '">';
        html += '<span class="seg-col-start"><input type="number" id="seg_start_' + i + '" value="' + seg.start + '"' + (startEditable ? ' onchange="onSegmentStartChange(' + i + ')"' : ' readonly') + ' class="' + (startEditable ? '' : 'readonly-start') + '" aria-label="' + t('segment_start_aria', { n: i + 1 }) + '"></span>';
        html += '<span class="seg-col-end"><input type="number" id="seg_end_' + i + '" value="' + seg.end + '" onchange="onSegmentEndChange(' + i + ')" aria-label="' + t('segment_end_aria', { n: i + 1 }) + '"></span>';
        html += '<span class="seg-col-density">' + densitySelect + '</span>';
        html += '<span class="seg-col-step">' + stepSelect + '</span>';
        html += '<span class="seg-col-remove"><button class="seg-remove-btn" onclick="removeSegmentUI(' + i + ')"' + delDisabled + '>' + t('segment_remove') + '</button></span>';
        html += '</div>';
        html += '<div class="segment-row custom-density-row" id="seg_custom_' + i + '" style="display:none;">';
        html += '<span class="seg-col-start"></span>';
        html += '<span class="seg-col-end"></span>';
        html += '<span class="seg-col-density" style="grid-column:3 / 5;"><input type="number" id="seg_density_custom_' + i + '" value="' + seg.density + '" step="0.1" min="0.05" placeholder="Custom density" aria-label="' + t('custom_density_aria', { n: i + 1 }) + '" style="text-align:left;width:100%;"></span>';
        html += '<span class="seg-col-remove"></span>';
        html += '</div>';
    }
    body.innerHTML = html;
}

function readSegmentsFromUI() {
    var body = document.getElementById('segmentsBody');
    if (!body) return null;
    var rows = body.querySelectorAll('.segment-row[data-index]');
    // If segments were never rendered (user didn't open the section), return current segments unchanged
    if (rows.length === 0) return getSegments().map(function(s) { return Object.assign({}, s); });
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
            showToast(t('toast_segments_invalid_values'), 'error');
            return null;
        }
        if (end <= start) {
            showToast(t('toast_segment_end_gt_start', { n: parseInt(idx) + 1 }), 'error');
            return null;
        }
        var density = parseFloat(densitySel.value);
        if (densitySel.value === '-1') {
            var customEl = document.getElementById('seg_density_custom_' + idx);
            if (customEl) {
                density = parseFloat(customEl.value);
                if (isNaN(density) || density <= 0) {
                    showToast(t('toast_density_positive', { n: parseInt(idx) + 1 }), 'error');
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
    for (var j = 1; j < segments.length; j++) {
        if (segments[j].start !== segments[j - 1].end) {
            showToast(t('toast_segments_contiguous', { n1: j, n2: j + 1 }), 'error');
            return null;
        }
    }
    return segments;
}

function updateSegmentsCountBadge(count) {
    var badge = document.getElementById('segmentsCountBadge');
    if (badge) {
        badge.textContent = count + ' ' + (count !== 1 ? t('segments_count_plural') : t('segments_count_singular'));
    }
}

function openSegmentsModal() {
    var timeline = getCurrentTimeline();
    if (!timeline) return;
    window._editingSegments = timeline.segments.map(function(s) { return Object.assign({}, s); });
    renderSegmentsFromArray(window._editingSegments);
    document.getElementById('segmentsModal').classList.add('open');
}

function closeSegmentsModal(save) {
    if (save !== false) {
        var segments = readSegmentsFromUI();
        if (segments) {
            var timeline = getCurrentTimeline();
            if (timeline) {
                timeline.segments = segments;
                saveState();
                clearYearCache();
                fullRender();
            }
        }
    }
    document.getElementById('segmentsModal').classList.remove('open');
}

function openCategoryModalFromEdit() {
    closeTimelineModal();
    categoryModalOrigin = 'edit_timeline';
    openCategoryModal();
}

function resetSegmentsToDefaultUI() {
    resetSegmentsToDefault();
    window._editingSegments = null;
    renderSegmentsList();
    showToast(t('toast_segments_reset'), 'info');
}

function resetToSingleSegmentUI() {
    var currentSegs = getSegments();
    var startYear = currentSegs[0].start;
    var endYear = currentSegs[currentSegs.length - 1].end;
    var singleSeg = { start: startYear, end: endYear, density: 10, rulerStep: 1, rulerLabel: 'year' };
    window._editingSegments = [singleSeg];
    renderSegmentsFromArray([singleSeg]);
    showToast(t('toast_segments_reset'), 'info');
}
