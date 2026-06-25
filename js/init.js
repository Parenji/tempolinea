// ================================================================
//  EVENT LISTENERS & INIT
// ================================================================
function setupEventListeners() {
    document.getElementById('eventForm').addEventListener('submit', function (e) { e.preventDefault(); saveEvent(); });
    document.getElementById('categoryForm').addEventListener('submit', function (e) { e.preventDefault(); saveCategory(); });
    document.getElementById('timelineForm').addEventListener('submit', function (e) { e.preventDefault(); saveTimeline(); });
    document.getElementById('categorySelect').addEventListener('change', function () { selectedCategoryId = this.value || null; });
    document.getElementById('eventModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    document.getElementById('categoryModal').addEventListener('click', function (e) { if (e.target === this) closeCategoryModal(); });
    document.getElementById('deleteConfirmModal').addEventListener('click', function (e) { if (e.target === this) closeDeleteModal(); });
    document.getElementById('timelineModal').addEventListener('click', function (e) { if (e.target === this) closeTimelineModal(); });
    document.getElementById('importChoiceModal').addEventListener('click', function (e) { if (e.target === this) closeImportChoiceModal(); });

    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { renderEvents(); }, 100);
    });

    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.addEventListener('mouseenter', function (e) {
        if (isMobile()) return;
        const card = e.target.closest('.event-card, .note-card');
        if (!card || !card.dataset.categoryId) return;
        highlightCategoryConnector(card.dataset.categoryId, false);
    }, true);
    eventsContainer.addEventListener('mouseleave', function (e) {
        if (isMobile()) return;
        const card = e.target.closest('.event-card, .note-card');
        if (!card || !card.dataset.categoryId) return;
        const anyExpanded = document.querySelector('.event-card.expanded[data-category-id="' + card.dataset.categoryId + '"], .note-card.expanded[data-category-id="' + card.dataset.categoryId + '"]');
        if (anyExpanded) return;
        if (!e.relatedTarget || !e.relatedTarget.closest('.event-card[data-category-id="' + card.dataset.categoryId + '"]')) {
            unhighlightCategoryConnector(card.dataset.categoryId);
        }
    }, true);
    eventsContainer.addEventListener('click', function (e) {
        if (!isMobile()) return;
        const card = e.target.closest('.event-card, .note-card');
        if (!card || !card.dataset.categoryId) return;
        if (highlightedCategoryId !== card.dataset.categoryId) {
            if (highlightedCategoryId) { unhighlightCategoryConnector(highlightedCategoryId); }
            highlightCategoryConnector(card.dataset.categoryId, false);
        }
    });

    // Year indicator
    const ruler = document.getElementById('timelineRuler');
    const yearIndicator = document.getElementById('yearIndicator');
    let scrollTimer;
    let yearIndicatorLocked = false;
    function updateYearIndicator() {
        const scrollY = ruler.scrollTop + window.innerHeight / 2;
        const currentYear = estimateYearFromScroll(scrollY);
        yearIndicator.dataset.year = currentYear;
        if (!yearIndicatorLocked) {
            yearIndicator.innerHTML = formatYear(currentYear);
        }
        yearIndicator.classList.add('visible');
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
            if (!yearIndicatorLocked) { yearIndicator.classList.remove('visible'); }
        }, 1500);
    }
    ruler.addEventListener('scroll', function () { updateYearIndicator(); });
    yearIndicator.addEventListener('click', function (e) {
        if (yearIndicatorLocked) return;
        e.stopPropagation();
        yearIndicatorLocked = true;
        clearTimeout(scrollTimer);
        const currentYear = parseInt(yearIndicator.dataset.year) || 0;
        yearIndicator.innerHTML = '<input type="number" value="' + currentYear + '" id="yearIndicatorInput" autofocus>';
        const input = document.getElementById('yearIndicatorInput');
        input.focus();
        input.select();
        function confirmYear() {
            const val = parseInt(input.value);
            if (!isNaN(val)) {
                scrollToYear(val);
                yearIndicator.dataset.year = val;
                yearIndicator.innerHTML = formatYear(val);
            } else {
                yearIndicator.innerHTML = formatYear(currentYear);
            }
            yearIndicatorLocked = false;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () { yearIndicator.classList.remove('visible'); }, 1500);
        }
        input.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); confirmYear(); }
            else if (ev.key === 'Escape') {
                yearIndicator.innerHTML = formatYear(currentYear);
                yearIndicatorLocked = false;
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function () { yearIndicator.classList.remove('visible'); }, 1500);
            }
        });
        input.addEventListener('blur', function () { setTimeout(function () { if (yearIndicatorLocked) { confirmYear(); } }, 100); });
    });
    yearIndicator.classList.add('visible');

    // Global click handler
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.period-strip') && !e.target.closest('.period-detail-card')) {
            document.querySelectorAll('.period-strip.active').forEach(function (el) { el.classList.remove('active'); });
            document.querySelectorAll('.period-detail-card.visible').forEach(function (el) { el.classList.remove('visible'); });
            document.querySelectorAll('.event-node.period-highlighted').forEach(function (n) { n.classList.remove('expanded-node', 'period-highlighted'); });
        }
        if (!e.target.closest('.category-connector') && !e.target.closest('.link-connector') && !e.target.closest('.line-tooltip') && !e.target.closest('.event-card') && !e.target.closest('.note-card') && !e.target.closest('.pill') && !e.target.closest('#pillRow')) {
            if (highlightedCategoryId) { unhighlightCategoryConnector(highlightedCategoryId); }
            document.querySelectorAll('.category-connector.highlighted, .category-connector.persistent-highlight').forEach(function (el) {
                el.setAttribute('opacity', '0.2');
                el.setAttribute('stroke-width', '3');
                el.removeAttribute('filter');
                el.classList.remove('highlighted', 'persistent-highlight');
            });
            document.querySelectorAll('.link-connector.highlighted').forEach(function (el) {
                if (el.classList.contains('link-glow')) { el.setAttribute('opacity', '0.3'); el.setAttribute('stroke-width', '9'); }
                else { el.setAttribute('opacity', '0.8'); el.setAttribute('stroke-width', '3.5'); }
                el.classList.remove('highlighted');
            });
            hideLineTooltip();
        }
        if (!e.target.closest('.event-card') && !e.target.closest('.note-card') && expandedEventId !== null) {
            expandedEventId = null;
            renderEvents();
        }
    });
}

function init() {
    loadState();
    document.getElementById('searchInput').value = '';
    selectedColor = AVAILABLE_COLORS[0];
    setupColorPicker();
    setupEventListeners();
    setupKeyboardShortcuts();
    initMiniMap();
    fullRender();
    scrollToLatestEvent();
    // Re-position mini-map after full render (pills are now visible)
    positionMiniMap();
    updateMiniMap();
}

document.addEventListener('DOMContentLoaded', init);