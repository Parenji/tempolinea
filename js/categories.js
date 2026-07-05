// ================================================================
//  CATEGORIES CRUD
// ================================================================
const AVAILABLE_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#ffffff', '#d4d4d4', '#a3a3a3', '#737373'
];

function sortCategoriesByFirstEvent(categories) {
    return categories.slice().sort(function (a, b) {
        var firstA = getCategoryFirstEventYear(a.id);
        var firstB = getCategoryFirstEventYear(b.id);
        if (firstA === Infinity && firstB === Infinity) return 0;
        if (firstA === Infinity) return 1;
        if (firstB === Infinity) return -1;
        return firstA - firstB;
    });
}

function renderCategorySelect() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = '<option value="">Seleziona categoria...</option>';
    sortCategoriesByFirstEvent(getCategories()).forEach(function (category) {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
    if (selectedCategoryId) {
        select.value = selectedCategoryId;
    }
}

function renderCategorySelects() {
    const select1 = document.getElementById('categorySelect');
    if (!select1) { renderCategorySelect(); return; }
    const categories = sortCategoriesByFirstEvent(getCategories());
    select1.innerHTML = '<option value="">Seleziona categoria...</option>';
    categories.forEach(function (category) {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select1.appendChild(option);
    });
    if (selectedCategoryId) { select1.value = selectedCategoryId; }
    const select2 = document.getElementById('categorySelect2');
    if (select2) {
        updateSecondCategorySelect(select1.value || null);
    }
}

let mergeColor = '#ef4444';
let splitCategoryId = null;
let selectionMode = false;

function countEventsForCategory(categoryId) {
    return getEvents().filter(function (e) {
        return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1;
    }).length;
}

function updateSecondCategorySelect(primaryValue) {
    var group = document.getElementById('secondCategoryGroup');
    var select2 = document.getElementById('categorySelect2');
    if (!group || !select2) return;
    
    if (primaryValue) {
        // Show the second category group
        group.style.display = 'block';
        group.style.maxHeight = '100px';
        group.style.opacity = '1';
        group.style.marginTop = '0';
        
        // Populate with categories excluding the primary one
        select2.innerHTML = '<option value="">Nessuna</option>';
        sortCategoriesByFirstEvent(getCategories()).forEach(function (category) {
            if (String(category.id) !== String(primaryValue)) {
                var option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select2.appendChild(option);
            }
        });
    } else {
        // Hide the second category group
        group.style.display = 'none';
        group.style.maxHeight = '0';
        group.style.opacity = '0';
        select2.value = '';
    }
}

function onPrimaryCategoryChange() {
    var primaryValue = document.getElementById('categorySelect').value;
    selectedCategoryId = primaryValue || null;
    updateSecondCategorySelect(primaryValue);
}

function renderCategoryList() {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = '';
    var query = (document.getElementById('categorySearchInput')?.value || '').toLowerCase().trim();
    var categories = sortCategoriesByFirstEvent(getCategories());
    var filtered = query ? categories.filter(function (c) { return c.name.toLowerCase().indexOf(query) !== -1; }) : categories;
    var sideLabels = { auto: 'Auto', left: '← Sinistra', right: 'Destra →' };
    filtered.forEach(function (category) {
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom:0.4rem;';

        var item = document.createElement('div');
        item.className = 'category-item';
        item.style.borderLeft = '4px solid ' + category.color;

        // Checkbox (visible only in selection mode)
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'category-merge-checkbox';
        checkbox.setAttribute('aria-label', 'Seleziona ' + category.name);
        checkbox.dataset.categoryId = category.id;
        checkbox.onchange = updateSelectionButtons;
        if (!selectionMode) {
            checkbox.style.display = 'none';
        }

        var connectorsOn = category.showConnectors !== false;
        var connectorsLabel = connectorsOn ? '&#x2014;&#x25C6;' : '&#x2014;&#x2716;';
        var side = category.preferredSide || 'auto';
        var sideLabel = sideLabels[side] || 'Auto';
        var eventCount = countEventsForCategory(category.id);
        var eventsPanelId = 'categoryEvents_' + category.id;

        // Main row with checkbox + name button + actions
        var mainRow = document.createElement('div');
        mainRow.className = 'category-item-main';

        // Category name as clickable button (accordion trigger)
        var nameBtn = document.createElement('button');
        nameBtn.className = 'category-name-btn';
        nameBtn.setAttribute('aria-expanded', 'false');
        nameBtn.setAttribute('aria-controls', eventsPanelId);
        nameBtn.type = 'button';
        nameBtn.innerHTML = '<strong>' + escapeHtml(category.name) + '</strong>' +
            ' <small style="color:var(--text-secondary);font-weight:400;">(' + eventCount + ' eventi, ' + sideLabel + ')</small>' +
            (connectorsOn ? '' : ' <small style="color:var(--text-secondary);font-weight:400;">(senza linee)</small>');
        nameBtn.title = 'Mostra/nascondi eventi di ' + category.name;
        nameBtn.onclick = function () { toggleCategoryEvents(category.id); };

        var actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:0.15rem;align-items:center;flex-shrink:0;';

        var connBtn = document.createElement('button');
        connBtn.className = 'category-action-btn';
        connBtn.title = connectorsOn ? 'Disattiva linee' : 'Attiva linee';
        connBtn.innerHTML = connectorsLabel;
        connBtn.onclick = function () { toggleCategoryConnectors(category.id); };

        var editBtn = document.createElement('button');
        editBtn.className = 'category-action-btn';
        editBtn.title = 'Modifica';
        editBtn.innerHTML = '&#x270E;';
        editBtn.onclick = function () { editCategory(category.id); };

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-action-btn delete';
        deleteBtn.title = 'Elimina';
        deleteBtn.innerHTML = '&#x00D7;';
        deleteBtn.onclick = function () { deleteCategory(category.id); };

        actions.appendChild(connBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        mainRow.appendChild(nameBtn);
        item.appendChild(checkbox);
        item.appendChild(mainRow);
        item.appendChild(actions);

        // Events panel (accordion content)
        var eventsPanel = document.createElement('div');
        eventsPanel.className = 'category-events-panel';
        eventsPanel.id = eventsPanelId;
        eventsPanel.setAttribute('role', 'region');
        eventsPanel.setAttribute('aria-label', 'Eventi di ' + category.name);
        // Populate events lazily on first open
        eventsPanel.dataset.loaded = 'false';

        wrapper.appendChild(item);
        wrapper.appendChild(eventsPanel);
        list.appendChild(wrapper);
    });
    updateSelectionButtons();
}

function toggleCategoryEvents(categoryId) {
    var panel = document.getElementById('categoryEvents_' + categoryId);
    var btn = document.querySelector('[aria-controls="categoryEvents_' + categoryId + '"]');
    if (!panel || !btn) return;

    var isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    } else {
        // Lazy-load events content on first open
        if (panel.dataset.loaded === 'false') {
            populateCategoryEventsPanel(categoryId, panel);
            panel.dataset.loaded = 'true';
        }
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }
}

function populateCategoryEventsPanel(categoryId, panel) {
    panel.innerHTML = '';
    var catEvents = getEvents().filter(function (e) {
        return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1;
    });

    // Sort by date (ascending)
    catEvents.sort(function (a, b) {
        if (a.startYear !== b.startYear) return a.startYear - b.startYear;
        if ((a.startMonth || 0) !== (b.startMonth || 0)) return (a.startMonth || 0) - (b.startMonth || 0);
        return (a.startDay || 0) - (b.startDay || 0);
    });

    // Get category color for date styling
    var cat = getCategories().find(function (c) { return String(c.id) === String(categoryId); });
    var catColor = cat ? cat.color : 'var(--accent)';

    if (catEvents.length === 0) {
        panel.innerHTML = '<div class="category-events-empty">Nessun evento in questa categoria.</div>';
        return;
    }

    catEvents.forEach(function (event) {
        var row = document.createElement('div');
        row.className = 'category-event-item';

        var dateEl = document.createElement('span');
        dateEl.className = 'category-event-date';
        dateEl.style.color = catColor;
        var startStr = event.startYear !== undefined && event.startYear !== null ? formatYear(event.startYear, event.startMonth, event.startDay) : '—';
        var endStr = event.endYear !== undefined && event.endYear !== null ? formatYear(event.endYear, event.endMonth, event.endDay) : '';
        dateEl.textContent = startStr;
        if (endStr) dateEl.textContent += ' → ' + endStr;

        var nameEl = document.createElement('span');
        nameEl.className = 'category-event-name';
        nameEl.textContent = event.title;

        var descEl = document.createElement('span');
        descEl.className = 'category-event-desc';
        descEl.textContent = event.description || '';

        row.appendChild(dateEl);
        row.appendChild(nameEl);
        row.appendChild(descEl);
        panel.appendChild(row);
    });
}

// ================================================================
//  SELECTION MODE
// ================================================================

function enterSelectionMode() {
    selectionMode = true;
    var selectBtn = document.getElementById('categorySelectModeBtn');
    var selectionActions = document.getElementById('categorySelectionActions');
    if (selectBtn) selectBtn.style.display = 'none';
    if (selectionActions) selectionActions.style.display = 'flex';
    renderCategoryList();
}

function exitSelectionMode() {
    selectionMode = false;
    var selectBtn = document.getElementById('categorySelectModeBtn');
    var selectionActions = document.getElementById('categorySelectionActions');
    if (selectBtn) selectBtn.style.display = '';
    if (selectionActions) selectionActions.style.display = 'none';
    renderCategoryList();
    hideMergeForm();
}

function updateSelectionButtons() {
    var checkboxes = document.querySelectorAll('#categoryList .category-merge-checkbox:checked');
    var count = checkboxes.length;

    var mergeBtn = document.getElementById('categoryMergeBtn');
    if (mergeBtn) {
        if (count >= 2) {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Unisci (' + count + ')';
        } else {
            mergeBtn.disabled = true;
            mergeBtn.textContent = 'Unisci';
        }
    }

    var deleteBtn = document.getElementById('categoryDeleteBtn');
    if (deleteBtn) {
        if (count >= 1) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Elimina (' + count + ')';
        } else {
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Elimina';
        }
    }
}

function deleteSelectedCategories() {
    var checkboxes = document.querySelectorAll('#categoryList .category-merge-checkbox:checked');
    var selectedIds = [];
    checkboxes.forEach(function (cb) { selectedIds.push(cb.dataset.categoryId); });
    if (selectedIds.length === 0) return;

    if (!confirm('Eliminare ' + selectedIds.length + ' categorie selezionate? Gli eventi associati perderanno la categoria.')) return;

    var cats = getCategories().filter(function (c) {
        return selectedIds.indexOf(String(c.id)) === -1;
    });
    setCategories(cats);

    var evs = getEvents();
    evs.forEach(function (event) {
        if (!event.categoryIds) event.categoryIds = [];
        event.categoryIds = event.categoryIds.filter(function (cid) {
            return selectedIds.indexOf(String(cid)) === -1;
        });
    });
    setEvents(evs);

    saveState();
    exitSelectionMode();
    fullRender();
    renderCategorySelects();
    showToast(selectedIds.length + ' categorie eliminate', 'info');
}

// ================================================================
//  MERGE
// ================================================================

function showMergeForm() {
    var checkboxes = document.querySelectorAll('#categoryList .category-merge-checkbox:checked');
    if (checkboxes.length < 2) return;
    var form = document.getElementById('categoryMergeForm');
    if (!form) return;
    mergeColor = AVAILABLE_COLORS[0];
    document.getElementById('mergeCategoryName').value = '';
    document.getElementById('mergeCategorySide').value = 'auto';
    setupMergeColorPicker();
    form.classList.add('open');
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideMergeForm() {
    var form = document.getElementById('categoryMergeForm');
    if (form) form.classList.remove('open');
}

function setupMergeColorPicker() {
    var container = document.getElementById('mergeColorPicker');
    if (!container) return;
    container.innerHTML = '';
    AVAILABLE_COLORS.forEach(function (color) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-option' + (color === mergeColor ? ' selected' : '');
        btn.style.background = color;
        btn.setAttribute('aria-label', 'Colore ' + color);
        if (color === '#ffffff') { btn.style.border = '2px solid #555'; }
        btn.onclick = function () { selectMergeColor(color); };
        container.appendChild(btn);
    });
}

function selectMergeColor(color) {
    mergeColor = color;
    var container = document.getElementById('mergeColorPicker');
    if (!container) return;
    var sel = mergeColor.toLowerCase();
    container.querySelectorAll('.color-option').forEach(function (btn) {
        var bg = btn.style.background;
        var match = bg.match(/\d+/g);
        if (match) {
            var hex = '#' + match.slice(0, 3).map(function (c) { return ('0' + parseInt(c).toString(16)).slice(-2); }).join('');
            btn.classList.toggle('selected', hex === sel);
        } else {
            btn.classList.toggle('selected', bg === sel);
        }
    });
}

function executeMerge() {
    var checkboxes = document.querySelectorAll('#categoryList .category-merge-checkbox:checked');
    var selectedIds = [];
    checkboxes.forEach(function (cb) { selectedIds.push(cb.dataset.categoryId); });
    if (selectedIds.length < 2) return;

    var name = document.getElementById('mergeCategoryName').value.trim();
    if (!name) { showToast('Inserisci il nome della nuova categoria', 'error'); return; }

    var preferredSide = document.getElementById('mergeCategorySide').value;
    var newId = generateId();
    var cats = getCategories();
    cats.push({
        id: newId,
        name: name,
        color: mergeColor,
        showConnectors: true,
        preferredSide: preferredSide
    });

    cats = cats.filter(function (c) { return selectedIds.indexOf(String(c.id)) === -1; });
    setCategories(cats);

    var evs = getEvents();
    evs.forEach(function (event) {
        if (!event.categoryIds) event.categoryIds = [];
        // Replace any merged category ids with the new one
        event.categoryIds = event.categoryIds.map(function (cid) {
            if (selectedIds.indexOf(String(cid)) !== -1) return newId;
            return cid;
        });
        // Deduplicate
        var seen = {};
        event.categoryIds = event.categoryIds.filter(function (cid) {
            if (seen[String(cid)]) return false;
            seen[String(cid)] = true;
            return true;
        });
    });
    setEvents(evs);

    saveState();
    hideMergeForm();
    exitSelectionMode();
    fullRender();
    renderCategorySelects();
    showToast('Categorie unite in ' + escapeHtml(name), 'success');
}

// ================================================================
//  SPLIT CATEGORY (integrated into edit form)
// ================================================================

function renderSplitSection() {
    var container = document.getElementById('categorySplitSection');
    if (!container) return;
    container.innerHTML = '';

    if (!editingCategoryId && !splitCategoryId) {
        container.innerHTML = '';
        return;
    }

    var catId = editingCategoryId || splitCategoryId;
    var evs = getEvents().filter(function (e) {
        return e.categoryIds && e.categoryIds.indexOf(String(catId)) !== -1;
    });

    if (evs.length === 0) {
        container.innerHTML = '<p class="category-empty-msg" style="padding:0.5rem 0;">Nessun evento in questa categoria.</p>';
        return;
    }

    // Sort events by date (ascending)
    evs.sort(function (a, b) {
        if (a.startYear !== b.startYear) return a.startYear - b.startYear;
        if ((a.startMonth || 0) !== (b.startMonth || 0)) return (a.startMonth || 0) - (b.startMonth || 0);
        return (a.startDay || 0) - (b.startDay || 0);
    });

    var cats = getCategories();

    evs.forEach(function (event, index) {
        var row = document.createElement('div');
        row.className = 'split-event-row';

        var info = document.createElement('div');
        info.className = 'split-event-info';
        var startYearStr = event.startYear !== undefined && event.startYear !== null ? formatYear(event.startYear, event.startMonth, event.startDay) : '';
        var endYearStr = event.endYear !== undefined && event.endYear !== null ? formatYear(event.endYear, event.endMonth, event.endDay) : '';
        var yearLabel = startYearStr;
        if (endYearStr) yearLabel += ' → ' + endYearStr;
        var dateStr = yearLabel ? ' (' + yearLabel + ')' : '';
        info.innerHTML = '<span class="split-event-name">' + escapeHtml(event.title) + dateStr + '</span>';

        var select = document.createElement('select');
        select.className = 'split-event-select';
        select.dataset.eventIndex = index;
        cats.forEach(function (c) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            if (String(c.id) === String(catId)) opt.selected = true;
            select.appendChild(opt);
        });
        var newOpt = document.createElement('option');
        newOpt.value = '__new__';
        newOpt.textContent = '➕ Crea nuova categoria...';
        select.appendChild(newOpt);
        select.onchange = function () { onSplitSelectChange(index, this.value); };

        row.appendChild(info);
        row.appendChild(select);

        var newFields = document.createElement('div');
        newFields.className = 'split-new-category-fields';
        newFields.id = 'splitNewFields_' + index;
        newFields.style.display = 'none';
        newFields.innerHTML = '<input type="text" class="split-new-name" id="splitNewName_' + index + '" placeholder="Nome nuova categoria">' +
            '<div class="split-new-colors" id="splitNewColors_' + index + '"></div>';
        row.appendChild(newFields);

        container.appendChild(row);
    });

    evs.forEach(function (event, index) {
        setupSplitColorPicker(index);
    });
}

function setupSplitColorPicker(splitIndex) {
    var container = document.getElementById('splitNewColors_' + splitIndex);
    if (!container) return;
    container.innerHTML = '';
    AVAILABLE_COLORS.forEach(function (color) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-option' + (color === AVAILABLE_COLORS[0] ? ' selected' : '');
        btn.style.background = color;
        btn.setAttribute('aria-label', 'Colore ' + color);
        if (color === '#ffffff') { btn.style.border = '2px solid #555'; }
        btn.onclick = function () { selectSplitColor(splitIndex, color, btn); };
        container.appendChild(btn);
    });
}

function selectSplitColor(splitIndex, color, btn) {
    var container = document.getElementById('splitNewColors_' + splitIndex);
    if (!container) return;
    container.querySelectorAll('.color-option').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    container.dataset.selectedColor = color;
}

function onSplitSelectChange(index, value) {
    var newFields = document.getElementById('splitNewFields_' + index);
    if (!newFields) return;
    if (value === '__new__') {
        newFields.style.display = 'flex';
    } else {
        newFields.style.display = 'none';
    }
}

function toggleSplitAccordion() {
    var splitContainer = document.getElementById('categorySplitContainer');
    var toggleBtn = document.getElementById('categorySplitToggle');
    if (!splitContainer || !toggleBtn) return;
    var isOpen = splitContainer.classList.contains('open');
    if (isOpen) {
        splitContainer.classList.remove('open');
        toggleBtn.classList.remove('open');
        splitCategoryId = null;
    } else {
        splitContainer.classList.add('open');
        toggleBtn.classList.add('open');
        splitCategoryId = editingCategoryId;
        renderSplitSection();
    }
}

function applySplitChanges() {
    if (!splitCategoryId && !editingCategoryId) return;
    var catId = editingCategoryId || splitCategoryId;
    var cats = getCategories();
    var evs = getEvents();
    var splitEvents = evs.filter(function (e) {
        return e.categoryIds && e.categoryIds.indexOf(String(catId)) !== -1;
    });

    var hasChanges = false;

    splitEvents.forEach(function (event, index) {
        var select = document.querySelector('#categorySplitSection [data-event-index="' + index + '"]');
        if (!select) return;
        var targetId = select.value;

        if (targetId === '__new__') {
            var nameInput = document.getElementById('splitNewName_' + index);
            if (!nameInput) return;
            var newName = nameInput.value.trim();
            if (!newName) return;

            var colorContainer = document.getElementById('splitNewColors_' + index);
            var color = colorContainer ? (colorContainer.dataset.selectedColor || AVAILABLE_COLORS[0]) : AVAILABLE_COLORS[0];

            var newId = generateId();
            cats.push({ id: newId, name: newName, color: color, showConnectors: true, preferredSide: 'auto' });
            targetId = newId;
            hasChanges = true;
        }

        if (String(targetId) !== String(catId)) {
            // Replace the old category id with the new target in categoryIds array
            if (!event.categoryIds) event.categoryIds = [];
            event.categoryIds = event.categoryIds.map(function (cid) {
                if (String(cid) === String(catId)) return targetId;
                return cid;
            });
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setCategories(cats);
        setEvents(evs);
    }
    return hasChanges;
}

function toggleCategoryConnectors(categoryId) {
    const cats = getCategories();
    const cat = cats.find(function (c) { return String(c.id) === String(categoryId); });
    if (cat) {
        cat.showConnectors = cat.showConnectors === false ? true : false;
        setCategories(cats);
        saveState();
        renderCategoryList();
        renderEvents();
    }
}

function editCategory(categoryId) {
    const cats = getCategories();
    const cat = cats.find(function (c) { return String(c.id) === String(categoryId); });
    if (!cat) return;

    // Open form first (resets to create mode), then override for edit mode
    openCategoryForm();

    editingCategoryId = categoryId;
    splitCategoryId = categoryId;
    document.getElementById('categoryName').value = cat.name;
    selectedColor = cat.color;
    updateColorPicker();
    document.getElementById('categorySide').value = cat.preferredSide || 'auto';
    document.getElementById('categoryNameLabel').textContent = 'Modifica Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Aggiorna';

    // Show the split toggle
    var splitToggle = document.getElementById('categorySplitToggle');
    if (splitToggle) {
        splitToggle.style.display = '';
        var eventCount = countEventsForCategory(categoryId);
        splitToggle.textContent = 'Dividi eventi (' + eventCount + ') ►';
        splitToggle.classList.remove('open');
    }
    var splitContainer = document.getElementById('categorySplitContainer');
    if (splitContainer) splitContainer.classList.remove('open');
}

function deleteCategory(categoryId) {
    if (!confirm('Eliminare questa categoria? Gli eventi associati perderanno la categoria.')) return;
    const cats = getCategories().filter(function (c) { return String(c.id) !== String(categoryId); });
    setCategories(cats);
    const evs = getEvents();
    evs.forEach(function (event) {
        if (!event.categoryIds) event.categoryIds = [];
        event.categoryIds = event.categoryIds.filter(function (cid) {
            return String(cid) !== String(categoryId);
        });
    });
    setEvents(evs);
    saveState();
    renderCategorySelects();
    renderCategoryList();
    renderPills();
    renderEvents();
    showToast('Categoria eliminata', 'info');
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) { showToast('Inserisci il nome della categoria', 'error'); return; }
    const preferredSide = document.getElementById('categorySide').value;
    const cats = getCategories();

    // Apply split changes first (may create new categories, move events)
    var splitApplied = applySplitChanges();

    if (editingCategoryId) {
        const cat = cats.find(function (c) { return String(c.id) === String(editingCategoryId); });
        if (cat) {
            cat.name = name;
            cat.color = selectedColor;
            cat.preferredSide = preferredSide;
        }

        // If all events were moved away, remove the category
        var remainingEvents = getEvents().filter(function (e) {
            return e.categoryIds && e.categoryIds.indexOf(String(editingCategoryId)) !== -1;
        });
        if (remainingEvents.length === 0) {
            var idx = cats.findIndex(function (c) { return String(c.id) === String(editingCategoryId); });
            if (idx !== -1) cats.splice(idx, 1);
        }
        showToast('Categoria modificata', 'success');
    } else {
        const newCategory = {
            id: generateId(),
            name: name,
            color: selectedColor,
            showConnectors: true,
            preferredSide: preferredSide
        };
        cats.push(newCategory);
        selectedCategoryId = newCategory.id;
        document.getElementById('categorySelect').value = newCategory.id;
        showToast('Categoria creata', 'success');
    }

    setCategories(cats);
    saveState();
    renderCategorySelects();
    renderCategoryList();
    renderPills();
    renderEvents();
    closeCategoryModal();
}

// ================================================================
//  COLOR PICKER
// ================================================================
function setupColorPicker() {
    const container = document.getElementById('colorPicker');
    container.innerHTML = '';
    AVAILABLE_COLORS.forEach(function (color) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-option' + (color === selectedColor ? ' selected' : '');
        btn.style.background = color;
        btn.setAttribute('aria-label', 'Colore ' + color);
        if (color === '#ffffff') { btn.style.border = '2px solid #555'; }
        btn.onclick = function () { selectColor(color); };
        container.appendChild(btn);
    });
    const sep = document.createElement('div');
    sep.className = 'color-picker-separator';
    container.appendChild(sep);
    const row = document.createElement('div');
    row.className = 'custom-color-row';
    const preview = document.createElement('span');
    preview.className = 'custom-color-preview';
    preview.id = 'customColorPreview';
    preview.style.background = selectedColor;
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<span class="custom-color-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L15 8h-6l3-6z"/><circle cx="12" cy="16" r="3"/><line x1="12" y1="19" x2="12" y2="22"/></svg></span>';
    const input = document.createElement('input');
    input.type = 'color';
    input.id = 'customColorInput';
    input.className = 'custom-color-input';
    input.value = selectedColor;
    input.setAttribute('aria-label', 'Selettore colore personalizzato');
    input.oninput = function () { selectColor(this.value); };
    const label = document.createElement('span');
    label.textContent = 'Colore personalizzato';
    label.style.fontSize = '0.75rem';
    label.style.color = 'var(--text-secondary)';
    label.style.cursor = 'pointer';
    row.appendChild(preview);
    row.appendChild(input);
    row.appendChild(label);
    container.appendChild(row);
}

function selectColor(color) {
    selectedColor = color;
    updateColorPicker();
}

function updateColorPicker() {
    const sel = selectedColor.toLowerCase();
    document.querySelectorAll('.color-option').forEach(function (option) {
        const optColor = option.style.backgroundColor;
        const match = optColor.match(/\d+/g);
        if (match) {
            const hex = '#' + match.slice(0, 3).map(function (c) { return ('0' + parseInt(c).toString(16)).slice(-2); }).join('');
            option.classList.toggle('selected', hex === sel);
        } else {
            option.classList.toggle('selected', optColor === sel);
        }
    });
    const preview = document.getElementById('customColorPreview');
    if (preview) {
        preview.style.background = selectedColor;
        const isCustom = !AVAILABLE_COLORS.some(function (c) { return c.toLowerCase() === sel; });
        preview.classList.toggle('selected', isCustom);
    }
    const input = document.getElementById('customColorInput');
    if (input) input.value = selectedColor;
}

function openCategoryModal(openForm) {
    editingCategoryId = null;
    splitCategoryId = null;
    selectionMode = false;
    document.getElementById('categoryModalTitle').textContent = 'Gestione Categorie';
    document.getElementById('categoryModal').classList.add('open');
    var modal = document.getElementById('categoryModal').querySelector('.modal');
    if (modal) modal.scrollTop = 0;
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Salva';
    selectedColor = AVAILABLE_COLORS[0];
    updateColorPicker();
    closeCategoryForm();
    hideMergeForm();
    exitSelectionMode();
    var searchInput = document.getElementById('categorySearchInput');
    if (searchInput) searchInput.value = '';
    renderCategoryList();
    if (openForm) { openCategoryForm(); }
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('open');
    editingCategoryId = null;
    splitCategoryId = null;
    selectionMode = false;
    closeCategoryForm();
    hideMergeForm();
}

function openCategoryForm() {
    const section = document.getElementById('categoryFormSection');
    const header = document.getElementById('categoryListHeader');
    section.classList.add('open');
    if (header) header.style.display = 'none';

    // Always reset to create mode — editCategory() will override after calling this
    editingCategoryId = null;
    splitCategoryId = null;

    // Hide split toggle for new categories
    var splitToggle = document.getElementById('categorySplitToggle');
    if (splitToggle) splitToggle.style.display = 'none';
    var splitContainer = document.getElementById('categorySplitContainer');
    if (splitContainer) splitContainer.classList.remove('open');

    document.getElementById('categoryForm').reset();
    document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Salva';
    selectedColor = AVAILABLE_COLORS[0];
    updateColorPicker();

    const modal = document.getElementById('categoryModal').querySelector('.modal');
    if (modal) modal.scrollTop = 0;
    setTimeout(function () { document.getElementById('categoryName').focus(); }, 350);
}

function closeCategoryForm() {
    const section = document.getElementById('categoryFormSection');
    const header = document.getElementById('categoryListHeader');
    section.classList.remove('open');
    if (header) header.style.display = '';
    editingCategoryId = null;
    splitCategoryId = null;
    var splitContainer = document.getElementById('categorySplitContainer');
    if (splitContainer) splitContainer.classList.remove('open');
    var splitToggle = document.getElementById('categorySplitToggle');
    if (splitToggle) splitToggle.classList.remove('open');
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Salva';
}