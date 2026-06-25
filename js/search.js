// ================================================================
//  CATEGORY FILTER PILLS
// ================================================================
function renderPills() {
    const container = document.getElementById('pillRow');
    container.innerHTML = '';
    const allPill = document.createElement('span');
    allPill.className = 'pill' + (activeCategoryFilters.length === 0 ? ' active' : '');
    allPill.textContent = 'Tutte';
    allPill.setAttribute('tabindex', '0');
    allPill.setAttribute('role', 'radio');
    allPill.setAttribute('aria-checked', activeCategoryFilters.length === 0 ? 'true' : 'false');
    allPill.setAttribute('aria-label', 'Mostra tutte le categorie');
    allPill.onclick = function () {
        activeCategoryFilters = [];
        if (highlightedCategoryId) { unhighlightCategoryConnector(highlightedCategoryId); }
        renderPills();
        renderEvents();
        filterPillsBySearch(document.getElementById('searchInput').value.toLowerCase());
        reapplySearchFilters();
    };
    allPill.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); allPill.click(); } });
    container.appendChild(allPill);
    const categories = getCategories();
    categories.forEach(function (category) {
        const isActive = activeCategoryFilters.indexOf(category.id) !== -1;
        const pill = document.createElement('span');
        pill.className = 'pill' + (isActive ? ' active' : '');
        pill.textContent = category.name;
        pill.setAttribute('tabindex', '0');
        pill.setAttribute('role', 'radio');
        pill.setAttribute('aria-checked', isActive ? 'true' : 'false');
        pill.setAttribute('aria-label', 'Filtra categoria ' + category.name);
        pill.style.borderLeft = '3px solid ' + category.color;
        pill.onclick = function () {
            const idx = activeCategoryFilters.indexOf(category.id);
            if (idx !== -1) {
                activeCategoryFilters.splice(idx, 1);
                if (highlightedCategoryId === category.id) { unhighlightCategoryConnector(category.id); }
            } else {
                activeCategoryFilters.push(category.id);
            }
            renderPills();
            renderEvents();
            if (idx === -1) { highlightCategoryConnector(category.id, false); }
            filterPillsBySearch(document.getElementById('searchInput').value.toLowerCase());
            reapplySearchFilters();
        };
        pill.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); } });
        container.appendChild(pill);
    });
}

function filterPillsBySearch(searchTerm) {
    const pills = document.querySelectorAll('#pillRow .pill');
    if (!searchTerm) { pills.forEach(function (pill) { pill.style.display = ''; }); return; }
    pills.forEach(function (pill) {
        if (pill.textContent === 'Tutte') { pill.style.display = ''; return; }
        const pillName = pill.textContent.toLowerCase();
        pill.style.display = pillName.includes(searchTerm) ? '' : 'none';
    });
}

// ================================================================
//  SEARCH
// ================================================================
function applyAllFilters() {
    const rawTerm = document.getElementById('searchInput').value;
    const searchTerm = rawTerm.toLowerCase();
    const hasSearch = searchTerm.length > 0;
    const hasCategoryFilter = activeCategoryFilters.length > 0;
    const isYearSearch = hasSearch && /^\-?\d+$/.test(searchTerm.trim());
    const events = getEvents();
    const allCards = document.querySelectorAll('.event-card, .period-strip, .note-card');
    const allEventNodes = document.querySelectorAll('.event-node');
    allCards.forEach(function (el) {
        const eventId = el.dataset.eventId;
        const event = events.find(function (e) { return e.id === eventId; });
        if (!event) return;
        let matchesSearch = true;
        let matchesCategory = true;
        if (hasSearch && !isYearSearch) {
            const category = getCategories().find(function (c) { return String(c.id) === String(event.categoryId); });
            const categoryName = category ? category.name : '';
            const searchText = formatYear(event.startYear) + ' ' + event.title + ' ' + (event.description || '') + ' ' + categoryName;
            matchesSearch = searchText.toLowerCase().includes(searchTerm);
        }
        if (hasCategoryFilter) {
            if (event.type === 'note') {
                matchesCategory = false;
            } else {
                matchesCategory = activeCategoryFilters.indexOf(String(event.categoryId)) !== -1;
            }
        }
        if (matchesSearch && matchesCategory) {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        } else {
            el.style.opacity = '0.15';
            el.style.pointerEvents = 'none';
        }
    });
    allEventNodes.forEach(function (node) {
        if (hasCategoryFilter) {
            node.style.opacity = '0.15';
        } else {
            node.style.opacity = '';
        }
    });
}

function searchEvents() {
    const rawTerm = document.getElementById('searchInput').value;
    const searchTerm = rawTerm.toLowerCase();
    const clearBtn = document.getElementById('searchClear');
    const searchNav = document.getElementById('searchNav');
    const searchCounter = document.getElementById('searchCounter');
    clearBtn.style.display = rawTerm ? 'block' : 'none';
    filterPillsBySearch(searchTerm);
    if (!searchTerm) {
        applyAllFilters();
        searchResults = [];
        currentSearchIndex = 0;
        searchNav.classList.remove('visible');
        searchCounter.textContent = '0/0';
        return;
    }
    const isYearSearch = /^\-?\d+$/.test(searchTerm.trim());
    if (isYearSearch) {
        const targetYear = parseInt(searchTerm.trim());
        applyAllFilters();
        searchResults = [];
        currentSearchIndex = 0;
        searchNav.classList.remove('visible');
        searchCounter.textContent = '0/0';
        scrollToYear(targetYear);
        return;
    }
    const events = getEvents();
    searchResults = [];
    applyAllFilters();
    document.querySelectorAll('.event-card, .period-strip, .note-card').forEach(function (el) {
        const eventId = el.dataset.eventId;
        const event = events.find(function (e) { return e.id === eventId; });
        if (!event) return;
        const category = getCategories().find(function (c) { return String(c.id) === String(event.categoryId); });
        const categoryName = category ? category.name : '';
        const searchText = formatYear(event.startYear) + ' ' + event.title + ' ' + (event.description || '') + ' ' + categoryName;
        if (searchText.toLowerCase().includes(searchTerm)) {
            searchResults.push(event);
        }
    });
    if (searchResults.length > 0) {
        currentSearchIndex = 0;
        searchCounter.textContent = '1/' + searchResults.length;
        searchNav.classList.add('visible');
        updateSearchNavButtons();
        scrollToYear(searchResults[0].startYear);
    } else {
        searchNav.classList.remove('visible');
        searchCounter.textContent = '0/0';
    }
}

function reapplySearchFilters() {
    applyAllFilters();
}

function searchPrev() {
    if (searchResults.length === 0) return;
    currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    document.getElementById('searchCounter').textContent = (currentSearchIndex + 1) + '/' + searchResults.length;
    updateSearchNavButtons();
    scrollToYear(searchResults[currentSearchIndex].startYear);
}

function searchNext() {
    if (searchResults.length === 0) return;
    currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
    document.getElementById('searchCounter').textContent = (currentSearchIndex + 1) + '/' + searchResults.length;
    updateSearchNavButtons();
    scrollToYear(searchResults[currentSearchIndex].startYear);
}

function updateSearchNavButtons() {
    const prevBtn = document.getElementById('searchPrevBtn');
    const nextBtn = document.getElementById('searchNextBtn');
    if (searchResults.length <= 1) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').style.display = 'none';
    searchEvents();
}

function handleSearchEnter(e) {
    if (e.key === 'Enter' && searchResults.length > 0) {
        currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
        document.getElementById('searchCounter').textContent = (currentSearchIndex + 1) + '/' + searchResults.length;
        updateSearchNavButtons();
        scrollToYear(searchResults[currentSearchIndex].startYear);
    }
}