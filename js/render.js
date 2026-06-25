// ================================================================
//  RULER RENDER
// ================================================================
function renderRuler() {
    const container = document.getElementById('rulerMarks');
    container.innerHTML = '';
    for (let s = 0; s < SEGMENTS.length; s++) {
        const seg = SEGMENTS[s];
        const step = seg.rulerStep;
        const labelType = seg.rulerLabel;
        for (let year = seg.start; year < seg.end; year += step) {
            const position = yearToPixelsCached(year);
            if (position < 0) continue;
            if (labelType === 'century') {
                const mark = document.createElement('div');
                mark.className = 'year-mark century';
                mark.style.top = position + 'px';
                container.appendChild(mark);
                const label = document.createElement('div');
                const side = (year % 200 === 0) ? 'left-side' : 'right-side';
                label.className = 'century-label ' + side;
                label.style.top = (position - 8) + 'px';
                label.textContent = formatYear(year);
                if (year % 500 === 0) {
                    label.style.fontSize = '0.85rem';
                    label.style.color = 'var(--text-primary)';
                    label.style.fontWeight = '700';
                }
                container.appendChild(label);
            } else if (labelType === 'decade' || labelType === 'quinquennial') {
                if (year % 100 === 0) {
                    const mark = document.createElement('div');
                    mark.className = 'year-mark century';
                    mark.style.top = position + 'px';
                    container.appendChild(mark);
                    const label = document.createElement('div');
                    const side = (year % 200 === 0) ? 'left-side' : 'right-side';
                    label.className = 'century-label ' + side;
                    label.style.top = (position - 8) + 'px';
                    label.textContent = formatYear(year);
                    if (year % 500 === 0) {
                        label.style.fontSize = '0.85rem';
                        label.style.color = 'var(--text-primary)';
                        label.style.fontWeight = '700';
                    }
                    container.appendChild(label);
                } else if (year % 10 === 0) {
                    const mark = document.createElement('div');
                    mark.className = 'year-mark decade';
                    mark.style.top = position + 'px';
                    container.appendChild(mark);
                } else {
                    const mark = document.createElement('div');
                    mark.className = 'year-mark year';
                    mark.style.top = position + 'px';
                    container.appendChild(mark);
                }
            } else if (step === 1) {
                for (let y = year; y < Math.min(year + step, seg.end); y++) {
                    const yPos = yearToPixelsCached(y);
                    if (yPos < 0) continue;
                    if (y % 100 === 0) {
                        const mark = document.createElement('div');
                        mark.className = 'year-mark century';
                        mark.style.top = yPos + 'px';
                        container.appendChild(mark);
                        const label = document.createElement('div');
                        const side = (y % 200 === 0) ? 'left-side' : 'right-side';
                        label.className = 'century-label ' + side;
                        label.style.top = (yPos - 8) + 'px';
                        label.textContent = formatYear(y);
                        if (y % 500 === 0) {
                            label.style.fontSize = '0.85rem';
                            label.style.color = 'var(--text-primary)';
                            label.style.fontWeight = '700';
                        }
                        container.appendChild(label);
                    } else if (y % 10 === 0) {
                        const mark = document.createElement('div');
                        mark.className = 'year-mark decade';
                        mark.style.top = yPos + 'px';
                        container.appendChild(mark);
                    } else {
                        const mark = document.createElement('div');
                        mark.className = 'year-mark year';
                        mark.style.top = yPos + 'px';
                        container.appendChild(mark);
                    }
                }
            }
        }
    }
}

// ================================================================
//  EVENTS RENDER
// ================================================================
function renderEvents() {
    const container = document.getElementById('eventsContainer');
    const emptyState = document.getElementById('emptyState');
    const categories = getCategories();
    container.innerHTML = '';
    document.querySelectorAll('.period-detail-card').forEach(function (el) { el.remove(); });
    const filteredEvents = getEvents().slice();
    if (filteredEvents.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'Timeline Vuota';
        emptyState.querySelector('p').textContent = 'Premi il pulsante in basso a destra per aggiungere il tuo primo evento, oppure...';
        return;
    }
    emptyState.style.display = 'none';
    filteredEvents.sort(function (a, b) { return a.startYear - b.startYear; });

    const categorySides = {};
    filteredEvents.forEach(function (event) {
        if (event.categoryId && !categorySides[event.categoryId]) {
            const category = categories.find(function (c) { return c.id === event.categoryId; });
            let side;
            if (category && category.preferredSide === 'left') side = 'left';
            else if (category && category.preferredSide === 'right') side = 'right';
            else side = (Object.keys(categorySides).length % 2 === 0) ? 'left' : 'right';
            categorySides[event.categoryId] = side;
        }
    });

    const eventPositions = {};
    const eventSides = {};
    const basePositions = {};
    const isMobileLayout = window.innerWidth <= 768;
    const minSpacing = isMobileLayout ? 80 : 75;

    filteredEvents.forEach(function (event, index) {
        const category = categories.find(function (c) { return c.id === event.categoryId; });
        const defaultSide = category ? categorySides[event.categoryId] : (index % 2 === 0 ? 'left' : 'right');
        const yearPos = yearToPixelsCached(event.startYear, event.startMonth, event.startDay);
        basePositions[event.id] = yearPos;
        let adjustedPosition = yearPos;
        let offset = 0;
        let currentSide = defaultSide;
        for (let i = 0; i < index; i++) {
            const prevEvent = filteredEvents[i];
            const prevPosition = eventPositions[prevEvent.id];
            const prevSide = eventSides[prevEvent.id];
            if (prevSide === currentSide && (prevPosition + minSpacing) > yearPos) {
                const sameCategory = event.categoryId && prevEvent.categoryId && String(event.categoryId) === String(prevEvent.categoryId);
                if (sameCategory) {
                    offset = Math.max(offset, prevPosition + minSpacing - yearPos);
                } else {
                    const otherSide = (currentSide === 'left') ? 'right' : 'left';
                    let canSwitch = true;
                    for (let j = 0; j < index; j++) {
                        const checkEvent = filteredEvents[j];
                        if (eventSides[checkEvent.id] === otherSide && (eventPositions[checkEvent.id] + minSpacing) > yearPos) {
                            canSwitch = false;
                            break;
                        }
                    }
                    if (canSwitch) { currentSide = otherSide; }
                    else { offset = Math.max(offset, prevPosition + minSpacing - yearPos); }
                }
            }
        }
        adjustedPosition = yearPos + offset;
        eventPositions[event.id] = adjustedPosition;
        eventSides[event.id] = currentSide;
    });

    // Separate notes
    const notes = [];
    const regularEvents = [];
    filteredEvents.forEach(function (event) {
        if (event.type === 'note') { notes.push(event); }
        else { regularEvents.push(event); }
    });

    // Render notes
    notes.forEach(function (event, noteIndex) {
        const side = eventSides[event.id] || (noteIndex % 2 === 0 ? 'left' : 'right');
        const position = eventPositions[event.id];
        const note = document.createElement('div');
        note.className = 'note-card ' + side + '-side';
        note.style.top = position + 'px';
        note.dataset.eventId = event.id;
        note.setAttribute('tabindex', '0');
        note.setAttribute('role', 'article');
        note.setAttribute('aria-label', 'Nota: ' + (event.title || 'senza titolo'));
        note.setAttribute('aria-expanded', expandedEventId === event.id ? 'true' : 'false');
        if (expandedEventId === event.id) { note.classList.add('expanded'); }
            note.innerHTML = (event.imageUrl ? '<svg class="card-image-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : '') +
            (event.title ? '<div class="note-title">' + escapeHtml(event.title) + '</div>' : '') +
            (event.imageUrl ? '<div class="event-image"><img src="' + escapeHtml(event.imageUrl) + '" alt="" loading="lazy" onclick="event.stopPropagation();openImageLightbox(this.src)" onerror="this.style.display=\'none\'"></div>' : '') +
            (event.description ? '<div class="note-desc">' + formatDescription(event.description) + '</div>' : '') +
            '<div class="note-btns">' +
            '<button class="note-btn note-edit-btn" onclick="event.stopPropagation(); editEvent(\'' + event.id + '\')" aria-label="Modifica nota">Modifica</button>' +
            '<button class="note-btn note-delete-btn" onclick="event.stopPropagation(); deleteEvent(\'' + event.id + '\')" aria-label="Elimina nota">Elimina</button>' +
            '</div>';
        note.addEventListener('click', function (e) { e.stopPropagation(); toggleExpand(event.id); });
        note.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleExpand(event.id); } });
        container.appendChild(note);
    });

    // Compute node offsets for events sharing the same year
    const nodeOffsets = {};
    const posGroups = {};
    regularEvents.forEach(function (event) {
        if (event.isPeriod) return;
        const pos = Math.round(basePositions[event.id]);
        if (!posGroups[pos]) posGroups[pos] = [];
        posGroups[pos].push(event.id);
    });
    Object.keys(posGroups).forEach(function (pos) {
        const ids = posGroups[pos];
        if (ids.length === 1) { nodeOffsets[ids[0]] = 0; return; }
        const maxSpread = Math.min(12, (ids.length - 1) * 4);
        ids.forEach(function (id, i) {
            nodeOffsets[id] = -maxSpread + (maxSpread * 2 * i) / (ids.length - 1 || 1);
        });
    });

    // Render regular events
    const periodLanes = assignPeriodLanes(regularEvents);
    regularEvents.forEach(function (event) {
        const category = categories.find(function (c) { return c.id === event.categoryId; });
        const side = eventSides[event.id];
        const color = category ? category.color : '#7c3aed';
        const position = eventPositions[event.id];
        if (!event.isPeriod) {
            const offset = nodeOffsets[event.id] || 0;
            const node = document.createElement('div');
            node.className = 'event-node' + (expandedEventId === event.id ? ' expanded-node' : '');
            node.style.top = (basePositions[event.id] - 5) + 'px';
            node.style.background = color;
            node.style.marginLeft = offset + 'px';
            container.appendChild(node);
        }
        if (event.isPeriod && event.endYear) {
            const lane = periodLanes[event.id] || side;
            const startPos = yearToPixelsCached(event.startYear, event.startMonth, event.startDay);
            const endPos = yearToPixelsCached(event.endYear, event.endMonth, event.endDay);
            const stripHeight = Math.max(20, endPos - startPos);
            const strip = document.createElement('div');
            strip.className = 'period-strip ' + lane + '-side';
            strip.style.top = startPos + 'px';
            strip.style.height = stripHeight + 'px';
            strip.style.setProperty('--strip-color', color);
            strip.dataset.eventId = event.id;
            strip.setAttribute('tabindex', '0');
            strip.setAttribute('role', 'article');
            strip.setAttribute('aria-label', 'Periodo: ' + (event.title || 'senza titolo'));
            strip.setAttribute('aria-expanded', 'false');
            const topMarker = document.createElement('div');
            topMarker.className = 'period-strip-date-marker top-marker';
            topMarker.textContent = formatYear(event.startYear, event.startMonth, event.startDay);
            topMarker.style.color = color;
            strip.appendChild(topMarker);
            const bottomMarker = document.createElement('div');
            bottomMarker.className = 'period-strip-date-marker bottom-marker';
            bottomMarker.textContent = formatYear(event.endYear, event.endMonth, event.endDay);
            bottomMarker.style.color = color;
            strip.appendChild(bottomMarker);
            const titleEl = document.createElement('div');
            titleEl.className = 'period-title';
            titleEl.textContent = event.title;
            strip.appendChild(titleEl);
            const detailCard = document.createElement('div');
            detailCard.className = 'period-detail-card';
            detailCard.id = 'detail-' + event.id;
            const yearText = formatYear(event.startYear, event.startMonth, event.startDay) + ' - ' + formatYear(event.endYear, event.endMonth, event.endDay);
            detailCard.innerHTML =
                (event.imageUrl ? '<svg class="card-image-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : '') +
                '<div class="detail-date" style="color:' + color + '">' + yearText + '</div>' +
                '<div class="detail-title">' + escapeHtml(event.title) + '</div>' +
                (event.imageUrl ? '<div class="detail-image"><img src="' + escapeHtml(event.imageUrl) + '" alt="" loading="lazy" onclick="event.stopPropagation();openImageLightbox(this.src)" onerror="this.style.display=\'none\'"></div>' : '') +
                (event.description ? '<div class="detail-desc">' + formatDescription(event.description) + '</div>' : '') +
                '<div class="detail-btns">' +
                '<button class="detail-btn" onclick="event.stopPropagation(); editEvent(\'' + event.id + '\')">Modifica</button>' +
                '<button class="detail-btn danger" onclick="event.stopPropagation(); deleteEvent(\'' + event.id + '\')">Elimina</button>' +
                '</div>';
            document.body.appendChild(detailCard);
            const periodClickHandler = function (e) {
                e.stopPropagation();
                const wasActive = strip.classList.contains('active');
                document.querySelectorAll('.period-strip.active').forEach(function (el) {
                    if (el !== strip) { el.classList.remove('active'); el.setAttribute('aria-expanded', 'false'); const otherCard = document.getElementById('detail-' + el.dataset.eventId); if (otherCard) otherCard.classList.remove('visible'); const nodes = document.querySelectorAll('.event-node.period-highlighted'); nodes.forEach(function (n) { n.classList.remove('expanded-node', 'period-highlighted'); }); }
                });
                if (wasActive) { strip.classList.remove('active'); strip.setAttribute('aria-expanded', 'false'); detailCard.classList.remove('visible'); }
                else {
                    strip.classList.add('active'); strip.setAttribute('aria-expanded', 'true'); detailCard.classList.add('visible');
                    const nodes = document.querySelectorAll('.event-node');
                    nodes.forEach(function (n) { if (n.style.background === color && Math.abs(parseFloat(n.style.top) - (basePositions[event.id] - 5)) < 2) { n.classList.add('expanded-node', 'period-highlighted'); } });
                }
                updateDetailCardPosition(strip, detailCard, side);
            };
            strip.addEventListener('click', periodClickHandler);
            strip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); periodClickHandler(e); } });
            let hoverTimeout = null;
            strip.addEventListener('mouseenter', function () {
                if (window.innerWidth <= 768) return;
                clearTimeout(hoverTimeout);
                detailCard.classList.add('visible');
                updateDetailCardPosition(strip, detailCard, side);
            });
            strip.addEventListener('mouseleave', function () {
                if (window.innerWidth <= 768) return;
                if (!strip.classList.contains('active')) {
                    hoverTimeout = setTimeout(function () { if (!detailCard.matches(':hover')) { detailCard.classList.remove('visible'); } }, 150);
                }
            });
            detailCard.addEventListener('mouseenter', function () { if (window.innerWidth <= 768) return; clearTimeout(hoverTimeout); detailCard.classList.add('visible'); });
            detailCard.addEventListener('mouseleave', function () { if (window.innerWidth <= 768) return; if (!strip.classList.contains('active')) { detailCard.classList.remove('visible'); } });
            container.appendChild(strip);
        } else {
            const card = document.createElement('div');
            card.className = 'event-card ' + side + '-side';
            card.style.top = (position - 15) + 'px';
            card.style.borderColor = color;
            card.dataset.eventId = event.id;
            card.dataset.categoryId = event.categoryId || '';
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'article');
            card.setAttribute('aria-label', 'Evento: ' + (event.title || 'senza titolo'));
            card.setAttribute('aria-expanded', expandedEventId === event.id ? 'true' : 'false');
            let yearText = formatYear(event.startYear, event.startMonth, event.startDay);
            if (event.endYear) { yearText += ' - ' + formatYear(event.endYear, event.endMonth, event.endDay); }
            if (expandedEventId === event.id) { card.classList.add('expanded'); }
            card.innerHTML =
                (event.imageUrl ? '<svg class="card-image-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : '') +
                '<div class="event-date" style="color:' + color + '">' + yearText + '</div>' +
                '<div class="event-name">' + escapeHtml(event.title) + '</div>' +
                (event.imageUrl ? '<div class="event-image"><img src="' + escapeHtml(event.imageUrl) + '" alt="" loading="lazy" onclick="event.stopPropagation();openImageLightbox(this.src)" onerror="this.style.display=\'none\'"></div>' : '') +
                (event.description ? '<div class="event-description">' + formatDescription(event.description) + '</div>' : '') +
                '<div class="card-btns">' +
                '<button class="detail-btn" onclick="event.stopPropagation(); editEvent(\'' + event.id + '\')" aria-label="Modifica evento">Modifica</button>' +
                '<button class="detail-btn danger" onclick="event.stopPropagation(); deleteEvent(\'' + event.id + '\')" aria-label="Elimina evento">Elimina</button>' +
                '</div>';
            card.addEventListener('click', function (e) { toggleExpand(event.id); });
            card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(event.id); } });
            container.appendChild(card);
        }
    });
    drawCategoryConnectors(filteredEvents, categorySides, eventSides, eventPositions, categories);
    drawLinkedEventLines(filteredEvents, basePositions, categories);
    updateMiniMap();
    if (activeCategoryFilters.length > 0 && filteredEvents.length > 0) {
        const firstMatching = filteredEvents.find(function (e) {
            if (e.type === 'note') return false;
            return activeCategoryFilters.indexOf(String(e.categoryId)) !== -1;
        });
        if (firstMatching) { scrollToYear(firstMatching.startYear); }
    }
}

function toggleExpand(eventId) {
    const ruler = document.getElementById('timelineRuler');
    const savedScroll = ruler.scrollTop;
    if (expandedEventId === eventId) { expandedEventId = null; }
    else { expandedEventId = eventId; }
    renderEvents();
    ruler.scrollTop = savedScroll;
    if (highlightedCategoryId) { highlightCategoryConnector(highlightedCategoryId, false); }
    reapplySearchFilters();
}

function updateDetailCardPosition(strip, detailCard, side) {
    const stripRect = strip.getBoundingClientRect();
    const cardWidth = Math.min(280, window.innerWidth * 0.35);
    let cardLeft;
    if (side === 'left') {
        cardLeft = Math.max(8, stripRect.right + 8);
        if (cardLeft + cardWidth > window.innerWidth - 8) { cardLeft = window.innerWidth - cardWidth - 8; }
    } else {
        cardLeft = Math.min(window.innerWidth - cardWidth - 8, stripRect.left - cardWidth - 8);
        if (cardLeft < 8) cardLeft = 8;
    }
    let cardTop = stripRect.top + stripRect.height / 2;
    const estimatedCardHeight = 150;
    if (cardTop - estimatedCardHeight / 2 < 8) cardTop = estimatedCardHeight / 2 + 8;
    if (cardTop + estimatedCardHeight / 2 > window.innerHeight - 8) cardTop = window.innerHeight - estimatedCardHeight / 2 - 8;
    detailCard.style.left = cardLeft + 'px';
    detailCard.style.top = cardTop + 'px';
    detailCard.style.transform = 'translateY(-50%)';
}

function assignPeriodLanes(regularEvents) {
    const lanes = {};
    const laneOrder = ['left', 'right'];
    const laneRanges = {};
    const periods = regularEvents.filter(function (e) { return e.isPeriod && e.endYear; });
    periods.sort(function (a, b) {
        const aStart = yearToPixelsCached(a.startYear, a.startMonth, a.startDay);
        const bStart = yearToPixelsCached(b.startYear, b.startMonth, b.startDay);
        return aStart - bStart;
    });
    periods.forEach(function (event) {
        const startPos = yearToPixelsCached(event.startYear, event.startMonth, event.startDay);
        const endPos = yearToPixelsCached(event.endYear, event.endMonth, event.endDay);
        const minY = Math.min(startPos, endPos);
        const maxY = Math.max(startPos, endPos);
        let assignedLane = null;
        for (let li = 0; li < laneOrder.length; li++) {
            const candidate = laneOrder[li];
            const ranges = laneRanges[candidate];
            if (!ranges || ranges.length === 0) { assignedLane = candidate; break; }
            let overlaps = false;
            for (let ri = 0; ri < ranges.length; ri++) {
                const r = ranges[ri];
                if (minY < r.maxY + 5 && maxY > r.minY - 5) { overlaps = true; break; }
            }
            if (!overlaps) { assignedLane = candidate; break; }
        }
        if (!assignedLane) { assignedLane = 'left'; }
        if (!laneRanges[assignedLane]) laneRanges[assignedLane] = [];
        laneRanges[assignedLane].push({ minY: minY, maxY: maxY });
        lanes[event.id] = assignedLane;
    });
    return lanes;
}

function fullRender() {
    renderTimelineSelect();
    renderRuler();
    renderPills();
    renderEvents();
    renderCategorySelect();
    updateEmptyState();
}

// ================================================================
//  CATEGORY CONNECTOR FUNCTIONS
// ================================================================
function highlightCategoryConnector(categoryId, showTooltip) {
    if (!categoryId) return;
    highlightedCategoryId = categoryId;
    const svg = document.getElementById('linksSvg');
    const mobile = isMobile();
    svg.querySelectorAll('.category-connector[data-category-id="' + categoryId + '"]').forEach(function (p) {
        svg.appendChild(p);
        p.setAttribute('opacity', '0.9');
        p.setAttribute('stroke-width', '4');
        if (!mobile) { p.setAttribute('filter', 'url(#glow_cat_' + categoryId + ')'); }
        p.classList.add('highlighted');
    });
    if (showTooltip) {
        const category = getCategories().find(function (c) { return String(c.id) === String(categoryId); });
        if (category) {
            const ttHtml = '<div class="tooltip-label">Categoria</div>' +
                '<div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>';
            showLineTooltip(ttHtml, window.innerWidth / 2, window.innerHeight / 2);
        }
    }
}

function unhighlightCategoryConnector(categoryId) {
    if (!categoryId) return;
    highlightedCategoryId = null;
    const svg = document.getElementById('linksSvg');
    svg.querySelectorAll('.category-connector[data-category-id="' + categoryId + '"]').forEach(function (p) {
        p.setAttribute('opacity', '0.2');
        p.setAttribute('stroke-width', '3');
        p.removeAttribute('filter');
        p.classList.remove('highlighted');
    });
    hideLineTooltip();
}

function getTimelineCenterX() {
    const container = document.querySelector('.timeline-container');
    return container ? container.clientWidth / 2 : window.innerWidth * 0.5;
}

function drawCategoryConnectors(sortedEvents, categorySides, eventSides, eventPositions, categories) {
    const svg = document.getElementById('linksSvg');
    svg.querySelectorAll('.category-connector').forEach(function (el) { el.remove(); });
    const centerX = getTimelineCenterX();
    const mobileLayout = window.innerWidth <= 768;
    const slotWidth = mobileLayout ? 20 : 35;
    const categoryRanges = {};
    Object.keys(categorySides).forEach(function (categoryId) {
        const catEvents = sortedEvents.filter(function (e) { return String(e.categoryId) === String(categoryId) && !e.isPeriod; });
        if (catEvents.length < 2) return;
        const ys = catEvents.map(function (e) { return eventPositions[e.id] || 0; });
        categoryRanges[categoryId] = { minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
    });
    const sideSlots = { left: [], right: [] };
    const categorySlots = {};
    ['left', 'right'].forEach(function (side) {
        const catsOnSide = Object.keys(categoryRanges).filter(function (id) { return categorySides[id] === side; });
        catsOnSide.sort(function (a, b) { return categoryRanges[a].minY - categoryRanges[b].minY; });
        catsOnSide.forEach(function (categoryId) {
            const range = categoryRanges[categoryId];
            let assignedSlot = -1;
            for (let s = 0; s < sideSlots[side].length; s++) {
                const lastEnd = sideSlots[side][s];
                if (range.minY > lastEnd + 10) { assignedSlot = s; break; }
            }
            if (assignedSlot === -1) { assignedSlot = sideSlots[side].length; sideSlots[side].push(0); }
            sideSlots[side][assignedSlot] = range.maxY;
            categorySlots[categoryId] = assignedSlot;
        });
    });
    Object.keys(categorySides).forEach(function (categoryId) {
        const catEvents = sortedEvents.filter(function (e) { return String(e.categoryId) === String(categoryId) && !e.isPeriod; });
        if (catEvents.length < 2) return;
        const category = categories.find(function (c) { return String(c.id) === String(categoryId); });
        if (!category) return;
        if (category.showConnectors === false) return;
        const side = categorySides[categoryId];
        const slotIndex = categorySlots[categoryId] || 0;
        const categoryOffset = slotIndex * slotWidth;
        const leftX = centerX - 30 - categoryOffset;
        const rightX = centerX + 30 + categoryOffset;
        const points = catEvents.map(function (e) {
            const evSide = eventSides[e.id] || side;
            return { x: evSide === 'left' ? leftX : rightX, y: eventPositions[e.id] || 0 };
        });
        let pathData = '';
        if (points.length === 1) { pathData = 'M ' + points[0].x + ' ' + points[0].y; }
        else if (points.length === 2) { pathData = 'M ' + points[0].x + ' ' + points[0].y + ' L ' + points[1].x + ' ' + points[1].y; }
        else {
            pathData = 'M ' + points[0].x + ' ' + points[0].y;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[Math.max(0, i - 1)];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[Math.min(points.length - 1, i + 2)];
                const cp1x = p1.x + (p2.x - p0.x) / 6;
                let cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                let cp2y = p2.y - (p3.y - p1.y) / 6;
                const segDy = p2.y - p1.y;
                const maxTangent = Math.abs(segDy) * 0.8;
                if (segDy > 0) { cp1y = Math.max(cp1y, p1.y); cp1y = Math.min(cp1y, p1.y + maxTangent); cp2y = Math.min(cp2y, p2.y); cp2y = Math.max(cp2y, p2.y - maxTangent); }
                else { cp1y = Math.min(cp1y, p1.y); cp1y = Math.max(cp1y, p1.y - maxTangent); cp2y = Math.max(cp2y, p2.y); cp2y = Math.min(cp2y, p2.y + maxTangent); }
                pathData += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + p2.x + ' ' + p2.y;
            }
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', category.color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.2');
        path.setAttribute('class', 'category-connector');
        path.setAttribute('pointer-events', 'visibleStroke');
        path.setAttribute('style', 'cursor:pointer');
        path.dataset.categoryId = categoryId;
        path.dataset.categoryName = category.name;
        path.dataset.categoryColor = category.color;
        const glowIdCat = 'glow_cat_' + categoryId;
        const catDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        catDefs.classList.add('link-defs');
        catDefs.innerHTML = '<filter id="' + glowIdCat + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        svg.appendChild(catDefs);
        let isHighlighted = false;
        function highlight() { svg.appendChild(path); path.setAttribute('opacity', '0.9'); path.setAttribute('stroke-width', '4'); path.setAttribute('filter', 'url(#' + glowIdCat + ')'); path.setAttribute('stroke', category.color); path.style.pointerEvents = 'auto'; }
        function unhighlight() { path.setAttribute('opacity', '0.2'); path.setAttribute('stroke-width', '3'); path.removeAttribute('filter'); path.setAttribute('stroke', category.color); path.style.pointerEvents = 'auto'; }
        path.addEventListener('mouseenter', function (e) { if (isMobile()) return; highlight(); const ttHtml = '<div class="tooltip-label">Categoria</div><div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); });
        path.addEventListener('mouseleave', function () { if (isMobile()) return; if (path.classList.contains('persistent-highlight')) return; unhighlight(); hideLineTooltip(); });
        path.addEventListener('mousemove', function (e) { if (isMobile()) return; if (isHighlighted) { const tt = document.getElementById('lineTooltip'); if (tt) { tt.style.left = e.clientX + 'px'; tt.style.top = e.clientY + 'px'; } } });
        path.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isMobile()) {
                svg.querySelectorAll('.category-connector.highlighted').forEach(function (el) { if (el !== path) { unhighlightConnector(el); } });
                if (isHighlighted) { unhighlightConnector(path); hideLineTooltip(); }
                else { highlightConnector(path); const ttHtml = '<div class="tooltip-label">Categoria</div><div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
            } else {
                if (path.classList.contains('persistent-highlight')) { path.classList.remove('persistent-highlight'); unhighlightConnector(path); hideLineTooltip(); }
                else { svg.querySelectorAll('.category-connector.persistent-highlight').forEach(function (el) { el.classList.remove('persistent-highlight'); el.setAttribute('opacity', '0.2'); el.setAttribute('stroke-width', '3'); el.removeAttribute('filter'); el.classList.remove('highlighted'); }); path.classList.add('persistent-highlight'); highlightConnector(path); const ttHtml = '<div class="tooltip-label">Categoria</div><div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
            }
        });
        function highlightConnector(p) { svg.appendChild(p); p.setAttribute('opacity', '0.9'); p.setAttribute('stroke-width', '4'); if (!isMobile()) { p.setAttribute('filter', 'url(#' + glowIdCat + ')'); } p.setAttribute('stroke', category.color); p.classList.add('highlighted'); isHighlighted = true; }
        function unhighlightConnector(p) { p.setAttribute('opacity', '0.2'); p.setAttribute('stroke-width', '3'); p.removeAttribute('filter'); p.setAttribute('stroke', category.color); p.classList.remove('highlighted'); isHighlighted = false; }
        svg.appendChild(path);
    });
}

function drawLinkedEventLines(sortedEvents, eventPositions, categories) {
    const svg = document.getElementById('linksSvg');
    svg.querySelectorAll('.link-connector, .link-defs').forEach(function (el) { el.remove(); });
    sortedEvents.forEach(function (event) {
        if (!event.linkedEvents || !Array.isArray(event.linkedEvents)) return;
        if (event.isPeriod) return;
        event.linkedEvents.forEach(function (link) {
            const linkedEventId = link.eventId;
            const linkedEvent = sortedEvents.find(function (e) { return String(e.id) === String(linkedEventId); });
            if (!linkedEvent || linkedEvent.isPeriod) return;
            const categoryA = categories.find(function (c) { return c.id === event.categoryId; });
            const categoryB = categories.find(function (c) { return c.id === linkedEvent.categoryId; });
            const dateA = new Date(event.startYear, event.startMonth || 0, event.startDay || 1);
            const dateB = new Date(linkedEvent.startYear, linkedEvent.startMonth || 0, linkedEvent.startDay || 1);
            const linkedIsEarlier = dateB < dateA;
            let colorA = categoryA ? categoryA.color : '#7c3aed';
            let colorB = categoryB ? categoryB.color : '#7c3aed';
            if (linkedIsEarlier) { const tempColor = colorA; colorA = colorB; colorB = tempColor; }
            const startY = (eventPositions[event.id] || 0);
            const endY = (eventPositions[linkedEvent.id] || 0);
            const centerX = getTimelineCenterX();
            const curveAmount = Math.max(40, Math.abs(endY - startY) * 0.15);
            const gradientId = 'grad_' + event.id + '_' + linkedEventId;
            const glowId = 'glow_' + event.id + '_' + linkedEventId;
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<linearGradient id="' + gradientId + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="' + colorA + '"/><stop offset="100%" stop-color="' + colorB + '"/></linearGradient><filter id="' + glowId + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
            defs.classList.add('link-defs');
            svg.appendChild(defs);
            const side = link.side || 'auto';
            let curveDir;
            if (side === 'left') { curveDir = -1; }
            else if (side === 'right') { curveDir = 1; }
            else { curveDir = linkedIsEarlier ? 1 : -1; }
            const d = 'M ' + centerX + ' ' + startY + ' C ' + (centerX + curveAmount * curveDir) + ' ' + startY + ', ' + (centerX + curveAmount * curveDir) + ' ' + endY + ', ' + centerX + ' ' + endY;
            const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            glowPath.setAttribute('d', d);
            glowPath.setAttribute('stroke', 'url(#' + gradientId + ')');
            glowPath.setAttribute('stroke-width', '9');
            glowPath.setAttribute('fill', 'none');
            glowPath.setAttribute('opacity', '0.3');
            glowPath.setAttribute('filter', 'url(#' + glowId + ')');
            glowPath.setAttribute('pointer-events', 'visibleStroke');
            glowPath.setAttribute('class', 'link-connector link-glow');
            const linkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linkPath.setAttribute('d', d);
            linkPath.setAttribute('stroke', 'url(#' + gradientId + ')');
            linkPath.setAttribute('stroke-width', '3.5');
            linkPath.setAttribute('fill', 'none');
            linkPath.setAttribute('opacity', '0.8');
            linkPath.setAttribute('pointer-events', 'none');
            linkPath.setAttribute('class', 'link-connector link-main');
            const linkId = event.id + '_' + linkedEventId;
            glowPath.dataset.linkId = linkId; linkPath.dataset.linkId = linkId;
            glowPath.dataset.eventAName = event.title || ''; linkPath.dataset.eventAName = event.title || '';
            glowPath.dataset.eventBName = linkedEvent.title || ''; linkPath.dataset.eventBName = linkedEvent.title || '';
            glowPath.dataset.colorA = colorA; linkPath.dataset.colorA = colorA;
            glowPath.dataset.colorB = colorB; linkPath.dataset.colorB = colorB;
            const paths = [glowPath, linkPath];
            let isLinkHighlighted = false;
            function highlightLink() { svg.appendChild(glowPath); svg.appendChild(linkPath); glowPath.setAttribute('opacity', '0.65'); glowPath.setAttribute('stroke-width', '14'); linkPath.setAttribute('opacity', '1'); linkPath.setAttribute('stroke-width', '5.5'); }
            function unhighlightLink() { glowPath.setAttribute('opacity', '0.3'); glowPath.setAttribute('stroke-width', '9'); linkPath.setAttribute('opacity', '0.8'); linkPath.setAttribute('stroke-width', '3.5'); }
            paths.forEach(function (p) {
                p.addEventListener('mouseenter', function (e) { if (isMobile()) return; highlightLink(); isLinkHighlighted = true; const ttHtml = '<div class="tooltip-label">Eventi Collegati</div><div class="tooltip-names"><span style="color:' + colorA + '">' + escapeHtml(event.title) + '</span><span class="tooltip-separator">' + (side === 'left' ? '←' : '→') + '</span><span style="color:' + colorB + '">' + escapeHtml(linkedEvent.title) + '</span></div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); });
                p.addEventListener('mouseleave', function () { if (isMobile()) return; unhighlightLink(); isLinkHighlighted = false; hideLineTooltip(); });
                p.addEventListener('mousemove', function (e) { if (isMobile()) return; if (isLinkHighlighted) { const tt = document.getElementById('lineTooltip'); if (tt) { tt.style.left = e.clientX + 'px'; tt.style.top = e.clientY + 'px'; } } });
                p.addEventListener('click', function (e) {
                    if (!isMobile()) return;
                    e.stopPropagation();
                    svg.querySelectorAll('.link-connector.highlighted').forEach(function (el) { if (el !== glowPath && el !== linkPath) { unhighlightOtherLink(el); } });
                    if (isLinkHighlighted) { unhighlightLink(); isLinkHighlighted = false; svg.querySelectorAll('.link-connector.highlighted').forEach(function (el) { el.classList.remove('highlighted'); }); hideLineTooltip(); }
                    else { highlightLink(); isLinkHighlighted = true; glowPath.classList.add('highlighted'); linkPath.classList.add('highlighted'); const ttHtml = '<div class="tooltip-label">Eventi Collegati</div><div class="tooltip-names"><span style="color:' + colorA + '">' + escapeHtml(event.title) + '</span><span class="tooltip-separator">' + (side === 'left' ? '←' : '→') + '</span><span style="color:' + colorB + '">' + escapeHtml(linkedEvent.title) + '</span></div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
                });
            });
            function unhighlightOtherLink(el) {
                let sibGlow, sibMain;
                if (el.classList.contains('link-glow')) { sibGlow = el; sibMain = el.nextElementSibling; }
                else { sibMain = el; sibGlow = el.previousElementSibling; }
                if (sibGlow) { sibGlow.setAttribute('opacity', '0.3'); sibGlow.setAttribute('stroke-width', '9'); sibGlow.classList.remove('highlighted'); }
                if (sibMain) { sibMain.setAttribute('opacity', '0.8'); sibMain.setAttribute('stroke-width', '3.5'); sibMain.classList.remove('highlighted'); }
            }
            svg.appendChild(glowPath);
            svg.appendChild(linkPath);
        });
    });
}