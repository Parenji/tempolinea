// ================================================================
//  CATEGORIES CRUD
// ================================================================
const AVAILABLE_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#ffffff', '#d4d4d4', '#a3a3a3', '#737373'
];

function renderCategorySelect() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = '<option value="">Seleziona categoria...</option>';
    getCategories().forEach(function (category) {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
    if (selectedCategoryId) {
        select.value = selectedCategoryId;
    }
}

function renderCategoryList() {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = '';
    const sideLabels = { auto: 'Auto', left: '← Sinistra', right: 'Destra →' };
    getCategories().forEach(function (category) {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.style.borderLeft = '4px solid ' + category.color;
        const connectorsOn = category.showConnectors !== false;
        const connectorsLabel = connectorsOn ? '&#x2014;&#x25C6;' : '&#x2014;&#x2716;';
        const side = category.preferredSide || 'auto';
        const sideLabel = sideLabels[side] || 'Auto';
        item.innerHTML = '<span>' + escapeHtml(category.name) +
            ' <small style="color:var(--text-secondary)">(' + sideLabel + ')</small>' +
            (connectorsOn ? '' : ' <small style="color:var(--text-secondary)">(senza linee)</small>') +
            '</span>' +
            '<div style="display:flex;gap:0.15rem;align-items:center;">' +
            '<button class="category-action-btn" title="' + (connectorsOn ? 'Disattiva linee' : 'Attiva linee') + '" onclick="toggleCategoryConnectors(\'' + category.id + '\')">' + connectorsLabel + '</button>' +
            '<button class="category-action-btn" title="Modifica" onclick="editCategory(\'' + category.id + '\')">&#x270E;</button>' +
            '<button class="category-action-btn delete" title="Elimina" onclick="deleteCategory(\'' + category.id + '\')">&#x00D7;</button>' +
            '</div>';
        list.appendChild(item);
    });
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
    editingCategoryId = categoryId;
    document.getElementById('categoryName').value = cat.name;
    selectedColor = cat.color;
    updateColorPicker();
    document.getElementById('categorySide').value = cat.preferredSide || 'auto';
    document.getElementById('categoryNameLabel').textContent = 'Modifica Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Aggiorna';
    openCategoryForm();
}

function deleteCategory(categoryId) {
    if (!confirm('Eliminare questa categoria?')) return;
    const cats = getCategories().filter(function (c) { return String(c.id) !== String(categoryId); });
    setCategories(cats);
    const evs = getEvents();
    evs.forEach(function (event) {
        if (String(event.categoryId) === String(categoryId)) { event.categoryId = null; }
    });
    setEvents(evs);
    saveState();
    renderCategorySelect();
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
    if (editingCategoryId) {
        const cat = cats.find(function (c) { return String(c.id) === String(editingCategoryId); });
        if (cat) {
            cat.name = name;
            cat.color = selectedColor;
            cat.preferredSide = preferredSide;
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
    renderCategorySelect();
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
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'custom-color-preview';
    preview.id = 'customColorPreview';
    preview.style.background = selectedColor;
    preview.setAttribute('aria-label', 'Colore personalizzato');
    preview.innerHTML = '<span class="custom-color-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L15 8h-6l3-6z"/><circle cx="12" cy="16" r="3"/><line x1="12" y1="19" x2="12" y2="22"/></svg></span>';
    preview.onclick = function () { document.getElementById('customColorInput').click(); };
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
    label.onclick = function () { document.getElementById('customColorInput').click(); };
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
    document.getElementById('categoryModalTitle').textContent = 'Gestione Categorie';
    document.getElementById('categoryModal').classList.add('open');
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Salva';
    selectedColor = AVAILABLE_COLORS[0];
    updateColorPicker();
    closeCategoryForm();
    renderCategoryList();
    if (openForm) { openCategoryForm(); }
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('open');
    editingCategoryId = null;
    closeCategoryForm();
}

function openCategoryForm() {
    const section = document.getElementById('categoryFormSection');
    const header = document.getElementById('categoryListHeader');
    section.classList.add('open');
    if (header) header.style.display = 'none';
    if (!editingCategoryId) {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
        document.getElementById('categorySaveBtn').textContent = 'Salva';
        selectedColor = AVAILABLE_COLORS[0];
        updateColorPicker();
    }
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
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryNameLabel').textContent = 'Nuova Categoria';
    document.getElementById('categorySaveBtn').textContent = 'Salva';
}