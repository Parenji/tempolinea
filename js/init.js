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
    document.getElementById('segmentsModal').addEventListener('click', function (e) { if (e.target === this) closeSegmentsModal(); });

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

    // ── Scroll-based dismiss for period detail cards & category tooltips ──
    function handleScrollDismiss() {
        var ruler = document.getElementById('timelineRuler');
        var scrollTop = ruler.scrollTop;
        var scrollBottom = scrollTop + ruler.clientHeight;

        // 1. Dismiss period detail cards whose stripe is completely out of viewport
        document.querySelectorAll('.period-detail-card.visible').forEach(function (card) {
            var eventId = card.id.replace('detail-', '');
            var strip = document.querySelector('.period-strip[data-event-id="' + eventId + '"]');
            if (!strip) return;
            var stripTop = parseFloat(strip.style.top);
            var stripHeight = parseFloat(strip.style.height);
            var stripBottom = stripTop + stripHeight;
            if (stripBottom < scrollTop || stripTop > scrollBottom) {
                strip.classList.remove('active');
                strip.setAttribute('aria-expanded', 'false');
                card.classList.remove('visible');
                document.querySelectorAll('.event-node.period-highlighted').forEach(function (n) {
                    n.classList.remove('expanded-node', 'period-highlighted');
                });
            }
        });

        // 2. Dismiss category tooltip when first AND last event card are both out of viewport
        if (highlightedCategoryId) {
            var catCards = document.querySelectorAll('[data-category-id="' + highlightedCategoryId + '"]');
            if (catCards.length > 0) {
                var firstCard = null;
                var lastCard = null;
                var firstTop = Infinity;
                var lastTop = -Infinity;
                catCards.forEach(function (card) {
                    var top = parseFloat(card.style.top);
                    if (!isNaN(top)) {
                        if (top < firstTop) { firstTop = top; firstCard = card; }
                        if (top > lastTop) { lastTop = top; lastCard = card; }
                    }
                });
                if (firstCard && lastCard) {
                    var firstCardBottom = firstTop + firstCard.offsetHeight;
                    var lastCardBottom = lastTop + lastCard.offsetHeight;
                    var firstOut = (firstCardBottom < scrollTop || firstTop > scrollBottom);
                    var lastOut = (lastCardBottom < scrollTop || lastTop > scrollBottom);
                    if (firstOut && lastOut) {
                        var hasPersistent = document.querySelector('.category-connector.persistent-highlight[data-category-id="' + highlightedCategoryId + '"]');
                        var anyExpanded = document.querySelector('.event-card.expanded[data-category-id="' + highlightedCategoryId + '"], .note-card.expanded[data-category-id="' + highlightedCategoryId + '"]');
                        if (!hasPersistent && !anyExpanded) {
                            unhighlightCategoryConnector(highlightedCategoryId);
                        }
                    }
                }
            }
        }
    }

    // Year indicator + zoom pill
    const ruler = document.getElementById('timelineRuler');
    const yearIndicator = document.getElementById('yearIndicator');
    const zoomPill = document.getElementById('zoomPill');
    let scrollTimer;
    let yearIndicatorLocked = false;
    let hoverActive = false;

    function clearAutoHide() {
        hoverActive = true;
        clearTimeout(scrollTimer);
        yearIndicator.classList.add('visible');
        if (zoomPill) zoomPill.classList.add('visible');
    }
    function restartAutoHide() {
        hoverActive = false;
        if (!yearIndicatorLocked) {
            scrollTimer = setTimeout(function () {
                yearIndicator.classList.remove('visible');
                if (zoomPill) zoomPill.classList.remove('visible');
            }, 1500);
        }
    }
    yearIndicator.addEventListener('mouseenter', clearAutoHide);
    yearIndicator.addEventListener('mouseleave', restartAutoHide);
    if (zoomPill) {
        zoomPill.addEventListener('mouseenter', clearAutoHide);
        zoomPill.addEventListener('mouseleave', restartAutoHide);
    }

    function updateYearIndicator() {
        const scrollY = ruler.scrollTop + window.innerHeight / 2;
        const currentYear = estimateYearFromScroll(scrollY);
        yearIndicator.dataset.year = currentYear;
        if (!yearIndicatorLocked) {
            var textEl = yearIndicator.querySelector('.year-indicator-text');
            if (textEl) textEl.textContent = formatYear(currentYear);
        }
        yearIndicator.classList.add('visible');
        if (zoomPill) zoomPill.classList.add('visible');
        clearTimeout(scrollTimer);
        if (!hoverActive) {
            scrollTimer = setTimeout(function () {
                if (!yearIndicatorLocked) { yearIndicator.classList.remove('visible'); }
                if (zoomPill && !yearIndicatorLocked) { zoomPill.classList.remove('visible'); }
            }, 1500);
        }
    }
    ruler.addEventListener('scroll', function () {
        updateYearIndicator();
        handleScrollDismiss();
        clampScroll();
        if (scrollRestricted) updateBoundaryButtons();
    });
    yearIndicator.addEventListener('click', function (e) {
        if (yearIndicatorLocked) return;
        e.stopPropagation();
        yearIndicatorLocked = true;
        clearTimeout(scrollTimer);
        if (zoomPill) zoomPill.classList.add('visible');
        const currentYear = parseInt(yearIndicator.dataset.year) || 0;
        var textEl = yearIndicator.querySelector('.year-indicator-text');
        if (textEl) textEl.style.display = 'none';
        var input = document.createElement('input');
        input.type = 'number';
        input.value = currentYear;
        input.id = 'yearIndicatorInput';
        yearIndicator.appendChild(input);
        input.focus();
        input.select();
        function confirmYear() {
            const val = parseInt(input.value);
            if (input.parentNode) input.parentNode.removeChild(input);
            if (textEl) textEl.style.display = '';
            if (!isNaN(val)) {
                scrollToYear(val);
                yearIndicator.dataset.year = val;
                if (textEl) textEl.textContent = formatYear(val);
            } else {
                if (textEl) textEl.textContent = formatYear(currentYear);
            }
            yearIndicatorLocked = false;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () { yearIndicator.classList.remove('visible'); if (zoomPill) zoomPill.classList.remove('visible'); }, 1500);
        }
        input.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); confirmYear(); }
            else if (ev.key === 'Escape') {
                if (input.parentNode) input.parentNode.removeChild(input);
                if (textEl) textEl.style.display = '';
                if (textEl) textEl.textContent = formatYear(currentYear);
                yearIndicatorLocked = false;
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function () { yearIndicator.classList.remove('visible'); if (zoomPill) zoomPill.classList.remove('visible'); }, 1500);
            }
        });
        input.addEventListener('blur', function () { setTimeout(function () { if (yearIndicatorLocked) { confirmYear(); } }, 100); });
    });
    yearIndicator.classList.add('visible');
    if (zoomPill) zoomPill.classList.add('visible');

    // Global click handler
    document.addEventListener('click', function (e) {
        var didCloseSomething = false;

        if (!e.target.closest('.period-strip') && !e.target.closest('.period-detail-card')) {
            var anyActive = document.querySelectorAll('.period-strip.active').length > 0;
            document.querySelectorAll('.period-strip.active').forEach(function (el) { el.classList.remove('active'); });
            document.querySelectorAll('.period-detail-card.visible').forEach(function (el) { el.classList.remove('visible'); });
            document.querySelectorAll('.event-node.period-highlighted').forEach(function (n) { n.classList.remove('expanded-node', 'period-highlighted'); });
            if (anyActive) didCloseSomething = true;
        }
        if (!e.target.closest('.category-connector') && !e.target.closest('.link-connector') && !e.target.closest('.line-tooltip') && !e.target.closest('.event-card') && !e.target.closest('.note-card') && !e.target.closest('.pill') && !e.target.closest('#pillRow')) {
            if (highlightedCategoryId) { unhighlightCategoryConnector(highlightedCategoryId); didCloseSomething = true; }
            document.querySelectorAll('.category-connector.highlighted, .category-connector.persistent-highlight').forEach(function (el) {
                el.setAttribute('opacity', '0.2');
                el.setAttribute('stroke-width', '3');
                el.removeAttribute('filter');
                el.classList.remove('highlighted', 'persistent-highlight');
            });
            var highlightedLinks = document.querySelectorAll('.link-connector.highlighted');
            if (highlightedLinks.length > 0) {
                highlightedLinks.forEach(function (el) {
                    if (el.classList.contains('link-glow')) { el.setAttribute('opacity', '0.3'); el.setAttribute('stroke-width', '9'); }
                    else { el.setAttribute('opacity', '0.8'); el.setAttribute('stroke-width', '3.5'); }
                    el.classList.remove('highlighted');
                });
                didCloseSomething = true;
            }
            hideLineTooltip();
        }
        if (!e.target.closest('.modal-overlay') && !e.target.closest('.event-card') && !e.target.closest('.note-card') && !e.target.closest('#imageLightbox') && expandedEventId !== null) {
            collapseAndFocus(expandedEventId);
            didCloseSomething = true;
        }

        if (!dragJustEnded && !didCloseSomething && !e.target.closest('.event-card') && !e.target.closest('.note-card') && !e.target.closest('.period-strip') && !e.target.closest('.period-detail-card') && !e.target.closest('.event-node') && !e.target.closest('.category-connector') && !e.target.closest('.link-connector') && !e.target.closest('.pill') && !e.target.closest('#pillRow') && !e.target.closest('#fabBtn') && !e.target.closest('.fab-secondary') && !e.target.closest('.modal-overlay') && !e.target.closest('#quickCreateBalloon') && !e.target.closest('#quickCreateCursor') && !e.target.closest('#yearIndicator') && !e.target.closest('.toolbar') && !e.target.closest('.mini-map') && !e.target.closest('.shortcuts-hint') && !e.target.closest('.image-lightbox') && !e.target.closest('#importInput') && !e.target.closest('.toast-container')) {
            if (e.target.closest('#timelineRuler') || e.target === document.getElementById('timelineRuler')) {
                if (document.getElementById('searchInput').value.trim()) {
                    clearSearch();
                } else {
                    var ruler = document.getElementById('timelineRuler');
                    var rulerRect = ruler.getBoundingClientRect();
                    var relativeY = e.clientY - rulerRect.top + ruler.scrollTop;
                    var year = estimateYearFromScroll(relativeY);
                    year = Math.max(getMinYear(), Math.min(getMaxYear(), year));
                    if (!isQuickCreateVisible()) {
                        showQuickCreate(year);
                    } else if (!e.target.closest('#quickCreateBalloon') && !e.target.closest('#quickCreateCursor')) {
                        hideQuickCreate();
                    }
                }
            }
        } else if (!dragJustEnded && isQuickCreateVisible() && !e.target.closest('#quickCreateBalloon') && !e.target.closest('#quickCreateHandle')) {
            hideQuickCreate();
        }
    });
}

// ── Scroll restriction (global functions) ──
function clampScroll() {
    if (!scrollRestricted) return;
    var ruler = document.getElementById('timelineRuler');
    if (!ruler) return;
    var range = getScrollablePixelRange();
    var viewH = ruler.clientHeight;
    var effectiveMax = Math.max(range.minPx, range.maxPx - viewH);
    if (ruler.scrollTop < range.minPx) {
        ruler.scrollTop = range.minPx;
    } else if (ruler.scrollTop > effectiveMax) {
        ruler.scrollTop = effectiveMax;
    }
}

function updateBoundaryButtons() {
    var topBtn = document.getElementById('boundaryTopBtn');
    var bottomBtn = document.getElementById('boundaryBottomBtn');
    if (!topBtn || !bottomBtn) return;
    if (!scrollRestricted) {
        topBtn.classList.remove('visible');
        bottomBtn.classList.remove('visible');
        return;
    }
    var ruler = document.getElementById('timelineRuler');
    if (!ruler) return;

    var toolbar = document.querySelector('.toolbar');
    var toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 85;
    if (isMobile()) {
        var mmContainer = document.getElementById('miniMapContainer');
        if (mmContainer) {
            toolbarBottom += mmContainer.getBoundingClientRect().height;
        }
    }
    var topBtnTop = toolbarBottom + 8;
    topBtn.style.top = topBtnTop + 'px';

    var range = getScrollablePixelRange();
    var viewH = ruler.clientHeight;
    var topMargin = 50;
    var bottomMargin = 50;
    var nearTop = ruler.scrollTop <= range.minPx + topMargin;
    var effectiveMax = Math.max(range.minPx, range.maxPx - viewH);
    var nearBottom = ruler.scrollTop >= effectiveMax - bottomMargin;
    if (nearTop) {
        topBtn.classList.add('visible');
        topBtn.querySelector('.boundary-label').textContent = t('boundary_prev_years', { year: formatYear(range.minYear) });
    } else {
        topBtn.classList.remove('visible');
    }
    if (nearBottom) {
        bottomBtn.classList.add('visible');
        bottomBtn.querySelector('.boundary-label').textContent = t('boundary_next_years', { year: formatYear(range.maxYear) });
    } else {
        bottomBtn.classList.remove('visible');
    }
}

function unlockScroll() {
    scrollRestricted = false;
    var lockToggle = document.getElementById('lockToggle');
    if (lockToggle) {
        var toolbar = document.querySelector('.toolbar');
        var toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 85;
        if (isMobile()) {
            var mmContainer = document.getElementById('miniMapContainer');
            if (mmContainer) {
                toolbarBottom += mmContainer.getBoundingClientRect().height;
            }
        }
        lockToggle.style.top = (toolbarBottom + 8) + 'px';
        var style = getComputedStyle(document.documentElement);
        var miniMapWidth = style.getPropertyValue('--mini-map-width').trim();
        var miniMapMargin = style.getPropertyValue('--mini-map-margin').trim();
        lockToggle.style.right = 'calc(' + miniMapWidth + ' + ' + miniMapMargin + ' + 4px)';
        lockToggle.classList.add('unlocked');
    }
    updateBoundaryButtons();
    updateMiniMap();
}

function relockScroll() {
    scrollRestricted = true;
    var lockToggle = document.getElementById('lockToggle');
    if (lockToggle) lockToggle.classList.remove('unlocked');
    clampScroll();
    updateBoundaryButtons();
    updateMiniMap();
}

function createBoundaryButtons() {
    // Top boundary button
    var topBtn = document.createElement('button');
    topBtn.id = 'boundaryTopBtn';
    topBtn.className = 'boundary-btn boundary-top';
    topBtn.innerHTML = '<span class="boundary-arrow">▲</span><span class="boundary-label"></span>';
    topBtn.setAttribute('aria-label', t('boundary_unlock_top_aria'));
    topBtn.title = t('boundary_unlock_title');
    topBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        unlockScroll();
    });
    document.body.appendChild(topBtn);

    // Bottom boundary button
    var bottomBtn = document.createElement('button');
    bottomBtn.id = 'boundaryBottomBtn';
    bottomBtn.className = 'boundary-btn boundary-bottom';
    bottomBtn.innerHTML = '<span class="boundary-label"></span><span class="boundary-arrow">▼</span>';
    bottomBtn.setAttribute('aria-label', t('boundary_unlock_bottom_aria'));
    bottomBtn.title = t('boundary_unlock_title');
    bottomBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        unlockScroll();
    });
    document.body.appendChild(bottomBtn);

    // Lock toggle (appears in toolbar area when unlocked)
    var lockToggle = document.createElement('button');
    lockToggle.id = 'lockToggle';
    lockToggle.className = 'lock-toggle';
    lockToggle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ' + t('lock_toggle_label');
    lockToggle.setAttribute('aria-label', t('lock_toggle_aria'));
    lockToggle.title = t('lock_toggle_title');
    lockToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        relockScroll();
    });
    document.body.appendChild(lockToggle);
}

function init() {
    loadState();
    // Apply i18n first so static text is translated before rendering
    applyI18n();
    // Restore zoom
    var zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) {
        zoomLabel.textContent = pixelsPerYear + 'px';
        if (pixelsPerYear === DEFAULT_PIXELS_PER_YEAR) {
            zoomLabel.style.color = 'var(--accent)';
        } else {
            zoomLabel.style.color = '';
        }
    }
    document.getElementById('searchInput').value = '';
    selectedColor = AVAILABLE_COLORS[0];
    setupColorPicker();
    setupEventListeners();
    setupKeyboardShortcuts();
    setupQuickCreateListeners();
    createBoundaryButtons();
    initMiniMap();
    loadSettings();
    fullRender();
    scrollToLatestEvent();
    positionMiniMap();
    updateMiniMap();
    // Initial clamp after everything is rendered
    setTimeout(function () {
        clampScroll();
        updateBoundaryButtons();
    }, 50);
}

document.addEventListener('DOMContentLoaded', init);