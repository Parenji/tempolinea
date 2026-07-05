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
                    label.style.fontSize = '0.9rem';
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
                        label.style.fontSize = '0.9rem';
                        label.style.color = 'var(--text-primary)';
                        label.style.fontWeight = '700';
                    }
                    container.appendChild(label);
                } else if (year % 10 === 0) {
                    const mark = document.createElement('div');
                    mark.className = 'year-mark decade';
                    mark.style.top = position + 'px';
                    container.appendChild(mark);
                    const label = document.createElement('div');
                    const side = (year % 20 === 0) ? 'left-side' : 'right-side';
                    label.className = 'decade-label ' + side;
                    label.style.top = (position - 6) + 'px';
                    label.textContent = formatYear(year);
                    container.appendChild(label);
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
                            label.style.fontSize = '0.9rem';
                            label.style.color = 'var(--text-primary)';
                            label.style.fontWeight = '700';
                        }
                        container.appendChild(label);
                    } else if (y % 10 === 0) {
                        const mark = document.createElement('div');
                        mark.className = 'year-mark decade';
                        mark.style.top = yPos + 'px';
                        container.appendChild(mark);
                        const label = document.createElement('div');
                        const side = (y % 20 === 0) ? 'left-side' : 'right-side';
                        label.className = 'decade-label ' + side;
                        label.style.top = (yPos - 6) + 'px';
                        label.textContent = formatYear(y);
                        container.appendChild(label);
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
//  SVG ICON helpers (inline SVG strings)
// ================================================================
const IMG_ICON_SVG = '<svg class="card-image-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

// ================================================================
//  CARD CONTENT HELPERS
// ================================================================
function cardImageHtml(event) {
    var altText = event.title ? 'Immagine per ' + event.title : '';
    var dataTitle = event.title ? ' data-title="' + escapeHtml(event.title) + '"' : '';
    return event.imageUrl ? '<div class="event-image"><img src="' + escapeHtml(event.imageUrl) + '" alt="' + escapeHtml(altText) + '"' + dataTitle + ' loading="lazy" onclick="event.stopPropagation();openImageLightbox(this.src,this.getAttribute(\'data-title\')||\'\')" onerror="this.style.display=\'none\'"></div>' : '';
}

function cardButtonsHtml(eventId) {
    return '<div class="card-btns">' +
        '<button class="detail-btn" onclick="event.stopPropagation(); editEvent(\'' + eventId + '\')" aria-label="Modifica evento">Modifica</button>' +
        '<button class="detail-btn danger" onclick="event.stopPropagation(); deleteEvent(\'' + eventId + '\')" aria-label="Elimina evento">Elimina</button>' +
        '</div>';
}

function categoryPillsHtml(eventCategories) {
    if (!eventCategories || eventCategories.length === 0) return '';
    var html = '<div class="event-categories">';
    eventCategories.forEach(function(cat) {
        html += '<span class="pill" style="border-left:3px solid ' + escapeHtml(cat.color) + '" onclick="event.stopPropagation();filterByCategory(\'' + escapeHtml(cat.id) + '\')" tabindex="0" role="radio" aria-label="Filtra categoria ' + escapeHtml(cat.name) + '">' + escapeHtml(cat.name) + '</span>';
    });
    html += '</div>';
    return html;
}

function cardContentHtml(event, color, yearText, eventCategories) {
    var html = '';
    if (event.imageUrl) html += IMG_ICON_SVG;
    html += '<div class="event-date" style="color:' + color + '">' + yearText + '</div>';
    html += '<div class="event-name">' + escapeHtml(event.title) + '</div>';
    html += cardImageHtml(event);
    if (event.description) html += '<div class="event-description">' + formatDescription(event.description) + '</div>';
    if (eventCategories && eventCategories.length > 0) html += categoryPillsHtml(eventCategories);
    html += cardButtonsHtml(event.id);
    return html;
}

function noteContentHtml(event, eventCategories) {
    var html = '';
    if (event.imageUrl) html += IMG_ICON_SVG;
    if (event.title) html += '<div class="note-title">' + escapeHtml(event.title) + '</div>';
    html += cardImageHtml(event);
    if (event.description) html += '<div class="note-desc">' + formatDescription(event.description) + '</div>';
    if (eventCategories && eventCategories.length > 0) html += categoryPillsHtml(eventCategories);
    html += '<div class="note-btns">' +
        '<button class="note-btn note-edit-btn" onclick="event.stopPropagation(); editEvent(\'' + event.id + '\')" aria-label="Modifica nota">Modifica</button>' +
        '<button class="note-btn note-delete-btn" onclick="event.stopPropagation(); deleteEvent(\'' + event.id + '\')" aria-label="Elimina nota">Elimina</button>' +
        '</div>';
    return html;
}

function periodDetailHtml(event, color, yearText, eventCategories) {
    var html = '';
    if (event.imageUrl) html += IMG_ICON_SVG;
    html += '<div class="detail-date" style="color:' + color + '">' + yearText + '</div>';
    html += '<div class="detail-title">' + escapeHtml(event.title) + '</div>';
    html += cardImageHtml(event);
    if (event.description) html += '<div class="detail-desc">' + formatDescription(event.description) + '</div>';
    if (eventCategories && eventCategories.length > 0) html += categoryPillsHtml(eventCategories);
    html += '<div class="detail-btns">' +
        '<button class="detail-btn" onclick="event.stopPropagation(); editEvent(\'' + event.id + '\')">Modifica</button>' +
        '<button class="detail-btn danger" onclick="event.stopPropagation(); deleteEvent(\'' + event.id + '\')">Elimina</button>' +
        '</div>';
    return html;
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
    var rawEvents = getEvents().slice();
    if (rawEvents.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'Timeline Vuota';
        emptyState.querySelector('p').textContent = 'Premi il pulsante in basso a destra per aggiungere il tuo primo evento, oppure...';
        const svg = document.getElementById('linksSvg');
        svg.querySelectorAll('.category-connector, .link-connector, .link-defs').forEach(function (el) { el.remove(); });
        return;
    }
    emptyState.style.display = 'none';

    // Use layout engine for all positioning calculations
    var layout = computeFullLayout(getEvents(), categories, {});
    var filteredEvents = layout.sortedEvents;
    var categorySides = layout.categorySides;
    var eventPositions = layout.eventPositions;
    var eventSides = layout.eventSides;
    var basePositions = layout.basePositions;
    var regularEvents = layout.regularEvents;
    var nodeOffsets = layout.nodeOffsets;
    var periodLanes = layout.periodLanes;

    // Render all items in chronological DOM order (notes, events, periods interleaved)
    filteredEvents.forEach(function (event) {
        // Primary category for color/layout
        var primaryCatId = (event.categoryIds && event.categoryIds.length > 0) ? event.categoryIds[0] : null;
        if (!primaryCatId && event.categoryId) primaryCatId = String(event.categoryId);
        const category = categories.find(function (c) { return c.id === primaryCatId; });
        var secondaryCategory = null;
        if (event.categoryIds && event.categoryIds.length > 1) {
            secondaryCategory = categories.find(function (c) { return c.id === event.categoryIds[1]; });
        }
        const side = eventSides[event.id];
        const color = category ? category.color : '#7c3aed';
        const position = eventPositions[event.id];

        // Build event categories array for pills in cards
        var eventCategories = [];
        if (event.categoryIds && event.categoryIds.length > 0) {
            eventCategories = event.categoryIds.map(function(cid) {
                return categories.find(function(c) { return c.id === cid; });
            }).filter(Boolean);
        }

        if (event.type === 'note') {
            const note = document.createElement('div');
            note.className = 'note-card ' + side + '-side';
            note.style.top = position + 'px';
            note.dataset.eventId = event.id;
            note.setAttribute('tabindex', '0');
            note.setAttribute('role', 'article');
            note.setAttribute('aria-label', 'Nota: ' + (event.title || 'senza titolo'));
            note.setAttribute('aria-expanded', expandedEventId === event.id ? 'true' : 'false');
            if (expandedEventId === event.id) { note.classList.add('expanded'); }
            note.innerHTML = noteContentHtml(event, eventCategories);
            var noteId = event.id;
            note.addEventListener('click', function (e) { e.stopPropagation(); toggleExpand(noteId); });
            note.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleExpand(noteId); }
                if (e.key === 'Escape' && expandedEventId === noteId) { e.preventDefault(); e.stopPropagation(); collapseAndFocus(noteId); }
            });
            container.appendChild(note);
        } else if (event.isPeriod && event.endYear) {
            // Render event node dot
            var evtId = event.id;
            const offset = nodeOffsets[event.id] || 0;
            const node = document.createElement('div');
            node.className = 'event-node' + (expandedEventId === event.id ? ' expanded-node' : '');
            node.style.top = (basePositions[event.id] - 5) + 'px';
            node.style.background = color;
            node.style.marginLeft = offset + 'px';
            node.dataset.eventId = event.id;
            container.appendChild(node);

            const lane = periodLanes[event.id] || side;
            const startPos = yearToPixelsCached(event.startYear, event.startMonth, event.startDay);
            const endPos = yearToPixelsCached(event.endYear, event.endMonth, event.endDay);
            const stripHeight = Math.max(20, endPos - startPos);
            const strip = document.createElement('div');
            strip.className = 'period-strip ' + lane + '-side';
            strip.style.top = startPos + 'px';
            strip.style.height = stripHeight + 'px';
            strip.style.setProperty('--strip-color', color);
            // Bicolor for 2 categories on period
            if (secondaryCategory && secondaryCategory.color) {
                strip.style.setProperty('--bicolor-a', color);
                strip.style.setProperty('--bicolor-b', secondaryCategory.color);
                strip.classList.add('two-categories');
            }
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
            detailCard.innerHTML = periodDetailHtml(event, color, yearText, eventCategories);
            document.body.appendChild(detailCard);
            var stripEvtId = event.id;
            // Shared cleanup function for closing the period detail card
            function closePeriodDetail(strip, detailCard, node) {
                strip.classList.remove('active');
                strip.setAttribute('aria-expanded', 'false');
                detailCard.classList.remove('visible');
                if (node) { node.classList.remove('expanded-node', 'period-highlighted'); }
            }
            const periodClickHandler = function (e) {
                e.stopPropagation();
                const wasActive = strip.classList.contains('active');
                document.querySelectorAll('.period-strip.active').forEach(function (el) {
                    if (el !== strip) { const otherCard = document.getElementById('detail-' + el.dataset.eventId); const otherNode = document.querySelector('.event-node[data-event-id="' + el.dataset.eventId + '"]'); closePeriodDetail(el, otherCard, otherNode); const nodes = document.querySelectorAll('.event-node.period-highlighted'); nodes.forEach(function (n) { n.classList.remove('expanded-node', 'period-highlighted'); }); }
                });
                if (wasActive) {
                    var node = document.querySelector('.event-node[data-event-id="' + stripEvtId + '"]');
                    closePeriodDetail(strip, detailCard, node);
                    // Remove scroll listener if it exists
                    if (strip._scrollCloseHandler) {
                        document.getElementById('timelineRuler').removeEventListener('scroll', strip._scrollCloseHandler);
                        strip._scrollCloseHandler = null;
                    }
                }
                else {
                    strip.classList.add('active'); strip.setAttribute('aria-expanded', 'true'); detailCard.classList.add('visible');
                    var node = document.querySelector('.event-node[data-event-id="' + stripEvtId + '"]');
                    if (node) { node.classList.add('expanded-node', 'period-highlighted'); }
                    // On mobile, close detail card when user scrolls the timeline
                    if (window.innerWidth <= 768) {
                        var ruler = document.getElementById('timelineRuler');
                        var scrollHandler = function () {
                            closePeriodDetail(strip, detailCard, document.querySelector('.event-node[data-event-id="' + stripEvtId + '"]'));
                            ruler.removeEventListener('scroll', scrollHandler);
                            strip._scrollCloseHandler = null;
                        };
                        strip._scrollCloseHandler = scrollHandler;
                        ruler.addEventListener('scroll', scrollHandler, { passive: true });
                    }
                }
                // Position vertically at click point, horizontally adjacent to strip
                var clickY = (e && e.clientY) ? e.clientY : null;
                updateDetailCardPosition(strip, detailCard, lane, clickY);
                // Re-position after images load (which may grow the card height)
                repositionAfterImagesLoad(detailCard, strip, lane);
            };
            strip.addEventListener('click', periodClickHandler);
            strip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); periodClickHandler(e); } });
            var hoverTimeout = null;
            strip.addEventListener('mouseenter', function () {
                if (window.innerWidth <= 768) return;
                clearTimeout(hoverTimeout);
                detailCard.classList.add('visible');
                updateDetailCardPosition(strip, detailCard, lane, null);
                repositionAfterImagesLoad(detailCard, strip, lane);
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
            // Render event node dot
            var evtId2 = event.id;
            const offset2 = nodeOffsets[event.id] || 0;
            const node2 = document.createElement('div');
            node2.className = 'event-node' + (expandedEventId === event.id ? ' expanded-node' : '');
            node2.style.top = (basePositions[event.id] - 5) + 'px';
            // Bicolor node for 2 categories
            if (secondaryCategory && secondaryCategory.color) {
                node2.style.background = 'linear-gradient(to right, ' + color + ' 50%, ' + secondaryCategory.color + ' 50%)';
            } else {
                node2.style.background = color;
            }
            node2.style.marginLeft = offset2 + 'px';
            node2.dataset.eventId = event.id;
            container.appendChild(node2);

            const card = document.createElement('div');
            card.className = 'event-card ' + side + '-side';
            card.style.top = (position - 15) + 'px';
            // Bicolor border for 2 categories
            if (secondaryCategory && secondaryCategory.color) {
                card.style.border = 'none';
                card.style.setProperty('--bicolor-a', color);
                card.style.setProperty('--bicolor-b', secondaryCategory.color);
                card.classList.add('bicolor-border');
            } else {
                card.style.borderColor = color;
            }
            card.dataset.eventId = event.id;
            card.dataset.categoryId = primaryCatId || '';
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'article');
            card.setAttribute('aria-label', 'Evento: ' + (event.title || 'senza titolo'));
            card.setAttribute('aria-expanded', expandedEventId === event.id ? 'true' : 'false');
            var yearText = formatYear(event.startYear, event.startMonth, event.startDay);
            if (event.endYear) { yearText += ' - ' + formatYear(event.endYear, event.endMonth, event.endDay); }
            if (expandedEventId === event.id) { card.classList.add('expanded'); }
            card.innerHTML = cardContentHtml(event, color, yearText, eventCategories);
            card.addEventListener('click', function () { toggleExpand(evtId2); });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(evtId2); }
                if (e.key === 'Escape' && expandedEventId === evtId2) { e.preventDefault(); collapseAndFocus(evtId2); }
            });
            container.appendChild(card);
        }
    });
    drawCategoryConnectors(filteredEvents, categorySides, eventSides, eventPositions, categories);
    drawLinkedEventLines(filteredEvents, eventPositions, eventSides, categories);
    updateMiniMap();
    if (activeCategoryFilters.length > 0 && filteredEvents.length > 0) {
        const firstMatching = filteredEvents.find(function (e) {
            if (e.type === 'note') return false;
            return e.categoryIds && e.categoryIds.some(function (cid) { return activeCategoryFilters.indexOf(String(cid)) !== -1; });
        });
        if (firstMatching) { scrollToYear(firstMatching.startYear); }
    }
}

function toggleExpand(eventId) {
    var ruler = document.getElementById('timelineRuler');
    // Collapse previously expanded card (if different)
    if (expandedEventId && expandedEventId !== eventId) {
        var prevCard = document.querySelector('.event-card[data-event-id="' + expandedEventId + '"], .note-card[data-event-id="' + expandedEventId + '"]');
        if (prevCard) {
            prevCard.classList.add('collapsing');
            prevCard.classList.remove('expanded');
            prevCard.setAttribute('aria-expanded', 'false');
            setTimeout(function () {
                prevCard.classList.remove('collapsing');
            }, 500);
        }
        // Also collapse ALL previously expanded event node dots
        document.querySelectorAll('.event-node.expanded-node').forEach(function (n) {
            n.classList.remove('expanded-node');
        });
    }
    // Toggle this card
    var card = document.querySelector('.event-card[data-event-id="' + eventId + '"], .note-card[data-event-id="' + eventId + '"]');
    if (!card) return;
    if (expandedEventId === eventId) {
        // Collapse
        card.classList.add('collapsing');
        card.classList.remove('expanded');
        card.setAttribute('aria-expanded', 'false');
        expandedEventId = null;
        setTimeout(function () {
            card.classList.remove('collapsing');
        }, 500);
        // Collapse the corresponding event node dot
        var thisNode = document.querySelector('.event-node[data-event-id="' + eventId + '"]');
        if (thisNode) { thisNode.classList.remove('expanded-node'); }
        // Keep focus on the card
        card.focus({ preventScroll: true });
    } else {
        // Expand
        card.classList.add('expanded');
        card.setAttribute('aria-expanded', 'true');
        expandedEventId = eventId;
        // Expand only the corresponding event node dot
        var thisNode = document.querySelector('.event-node[data-event-id="' + eventId + '"]');
        if (thisNode) { thisNode.classList.add('expanded-node'); }
        // Keep focus and ensure card is visible after expansion
        card.focus({ preventScroll: true });
        // Wait for CSS transition to complete (0.5s) before measuring expanded size
        setTimeout(function () {
            ensureCardVisible(card, ruler);
        }, 550);
    }
    if (highlightedCategoryId) { highlightCategoryConnector(highlightedCategoryId, false); }
}

// Collapse and focus — same as toggleExpand(collapse) but always collapses
function collapseAndFocus(eventId) {
    var ruler = document.getElementById('timelineRuler');
    var card = document.querySelector('.event-card[data-event-id="' + eventId + '"], .note-card[data-event-id="' + eventId + '"]');
    if (card) {
        card.classList.add('collapsing');
        card.classList.remove('expanded');
        card.setAttribute('aria-expanded', 'false');
        card.focus({ preventScroll: true });
        setTimeout(function () {
            card.classList.remove('collapsing');
        }, 500);
    }
    document.querySelectorAll('.event-node.expanded-node').forEach(function (n) {
        n.classList.remove('expanded-node');
    });
    expandedEventId = null;
    if (highlightedCategoryId) { highlightCategoryConnector(highlightedCategoryId, false); }
}

// Ensure the expanded card is fully visible in the viewport
function ensureCardVisible(card, ruler) {
    if (!card || !ruler) return;
    var cardRect = card.getBoundingClientRect();
    var rulerRect = ruler.getBoundingClientRect();
    // Measure actual toolbar height from the DOM
    var toolbar = document.querySelector('.toolbar');
    var toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
    // Reserve space for FAB at bottom — less on mobile since FAB is smaller and screen is tighter
    var isMobile = window.innerWidth <= 1038;
    var fabReserve = isMobile ? 100 : 0;
    var topThreshold = Math.max(rulerRect.top, toolbarBottom);
    var bottomThreshold = rulerRect.bottom - fabReserve;
    // Usable viewport height for the card
    var availableHeight = bottomThreshold - topThreshold;
    var cardHeight = cardRect.height;
    var scrollNeeded = 0;

    var cardFullyVisible = cardRect.top >= topThreshold && cardRect.bottom <= bottomThreshold;

    if (!cardFullyVisible) {
        // ── Vertical: top-priority approach ──
        // If the card is taller than the available space, only ensure the top is visible
        if (cardHeight > availableHeight) {
            // Card too tall — align its top just below the toolbar
            scrollNeeded = cardRect.top - topThreshold;
        } else {
            // Card fits — only scroll the minimum needed to bring it into view
            var overflowTop = topThreshold - cardRect.top;
            var overflowBottom = cardRect.bottom - bottomThreshold;
            if (overflowTop > 0) {
                // Card extends above the top threshold — scroll up to show its top
                scrollNeeded = -overflowTop;
            } else if (overflowBottom > 0) {
                // Card extends below the bottom threshold — scroll down to show its bottom
                scrollNeeded = overflowBottom;
            }
        }

        if (scrollNeeded !== 0) {
            // Suppress mini-map visibility during automatic scroll on mobile
            if (isMobile) { window._suppressMiniMap = true; }
            ruler.scrollBy({ top: scrollNeeded, behavior: 'smooth' });
            if (isMobile) { setTimeout(function () { window._suppressMiniMap = false; }, 600); }
        }
    }

    // Horizontal check for mobile: ensure card doesn't overflow off-screen
    if (isMobile) {
        var cardLeft = cardRect.left;
        var cardRight = cardRect.right;
        var viewportWidth = window.innerWidth;
        var horizontalMargin = 12;

        if (cardLeft < horizontalMargin) {
            var missingPx = horizontalMargin - cardLeft;
            card.style.marginLeft = (parseInt(card.style.marginLeft) || 0) + missingPx + 'px';
        } else if (cardRight > viewportWidth - horizontalMargin) {
            var overflowPx = cardRight - (viewportWidth - horizontalMargin);
            card.style.marginLeft = (parseInt(card.style.marginLeft) || 0) - overflowPx + 'px';
        }
    }
}

// Re-position the detail card after CSS transitions and image loads complete.
// Two sources of delayed size changes:
//   1) CSS transition on .event-image (max-height 0→300px over 0.5s)
//   2) Actual <img> loading (async network request)
// We listen for both transitionend AND img load/error, then re-position once.
function repositionAfterImagesLoad(detailCard, strip, lane) {
    var eventImages = detailCard.querySelectorAll('.event-image');
    var imgEls = detailCard.querySelectorAll('img');
    if (eventImages.length === 0 && imgEls.length === 0) return;

    var pending = 0;
    var alreadyRan = false;
    var reposition = function () {
        if (alreadyRan) return;
        pending--;
        if (pending <= 0) {
            alreadyRan = true;
            updateDetailCardPosition(strip, detailCard, lane, null);
        }
    };

    // 1) Listen for CSS transition end on each .event-image container
    for (var i = 0; i < eventImages.length; i++) {
        var container = eventImages[i];
        // If the transition is already finished (or the container has non-zero height already), skip
        var style = getComputedStyle(container);
        if (style.maxHeight !== '0px' && style.maxHeight !== '0') continue;
        pending++;
        container.addEventListener('transitionend', function handler(e) {
            if (e.propertyName === 'max-height') {
                container.removeEventListener('transitionend', handler);
                reposition();
            }
        });
    }

    // 2) Listen for actual image load/error
    for (var j = 0; j < imgEls.length; j++) {
        var img = imgEls[j];
        if (img.complete) continue;
        pending++;
        var onDone = function () { reposition(); };
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
    }

    // If nothing is pending (all transitions done and images cached), re-position immediately
    if (pending === 0) {
        updateDetailCardPosition(strip, detailCard, lane, null);
    } else {
        // Safety timeout: if for any reason the events don't fire, reposition after 800ms
        setTimeout(function () {
            if (!alreadyRan) {
                alreadyRan = true;
                updateDetailCardPosition(strip, detailCard, lane, null);
            }
        }, 800);
    }
}

function updateDetailCardPosition(strip, detailCard, side, clickY) {
    const toolbar = document.querySelector('.toolbar');
    const toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
    const margin = 10;
    const isMobile = window.innerWidth <= 768;
    // Desktop: mini-map occupies 35px on the far right
    const miniMapWidth = isMobile ? 0 : 35;
    const safeMargin = 4;

    // Measure actual card dimensions (card must be visible for accurate measurement)
    const cardRect = detailCard.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;

    const sr = strip.getBoundingClientRect();
    const centerX = window.innerWidth / 2;

    // ── STEP 1: Position top-edge, clamp to viewport ──
    let cardCenterY;
    if (clickY !== null && clickY !== undefined) {
        cardCenterY = clickY;
    } else {
        cardCenterY = sr.top + sr.height / 2;
    }
    const minTop = toolbarBottom + margin;
    const maxBottom = window.innerHeight - margin;
    const halfH = cardHeight / 2;
    // Prefer card centered on the target, but use top-edge positioning so
    // that late-loading images (which grow the card) expand downward,
    // never into the toolbar.
    let cardTop = cardCenterY - halfH;
    if (cardTop < minTop) cardTop = minTop;
    if (cardTop + cardHeight > maxBottom) cardTop = maxBottom - cardHeight;
    if (cardTop < minTop) cardTop = minTop;

    // ── STEP 2: Horizontal — symmetric algorithm for left and right ──
    let cardLeft;
    if (side === 'left') {
        // Strip is on the left side → card goes to the right of the strip,
        // ideally between strip and timeline center
        const spaceRight = centerX - sr.right - margin * 2;
        if (cardWidth <= spaceRight) {
            // Fits between strip and center
            cardLeft = sr.right + margin;
        } else {
            // Needs more space, go beyond center
            cardLeft = Math.max(sr.right + margin, centerX - cardWidth / 2);
        }
    } else {
        // Strip is on the right side → card goes to the left of the strip,
        // ideally between timeline center and strip (mirror of left)
        const spaceLeft = sr.left - centerX - margin * 2;
        if (cardWidth <= spaceLeft) {
            // Fits between center and strip
            cardLeft = sr.left - cardWidth - margin;
        } else {
            // Needs more space, go beyond center
            cardLeft = Math.min(sr.left - cardWidth - margin, centerX - cardWidth / 2);
        }
    }

    // ── STEP 3: Final clamp to viewport edges, respecting mini-map on desktop ──
    const minLeft = safeMargin;
    const maxLeft = window.innerWidth - cardWidth - miniMapWidth - safeMargin;
    if (maxLeft > minLeft) {
        cardLeft = Math.max(minLeft, Math.min(maxLeft, cardLeft));
    } else {
        cardLeft = minLeft;
    }

    detailCard.style.left = cardLeft + 'px';
    detailCard.style.top = cardTop + 'px';
    detailCard.style.transform = 'none';
}

function fullRender() {
    renderTimelineSelect();
    renderRuler();
    renderPills();
    renderEvents();
    renderCategorySelects();
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
    const svg = document.getElementById('linksSvg');
    var hasPersistent = false;
    svg.querySelectorAll('.category-connector[data-category-id="' + categoryId + '"]').forEach(function (p) {
        if (p.classList.contains('persistent-highlight')) {
            hasPersistent = true;
            return;
        }
        p.setAttribute('opacity', '0.2');
        p.setAttribute('stroke-width', '3');
        p.removeAttribute('filter');
        p.classList.remove('highlighted');
    });
    if (!hasPersistent) {
        highlightedCategoryId = null;
        hideLineTooltip();
    }
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
        const catEvents = sortedEvents.filter(function (e) { return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1 && !e.isPeriod; });
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
        const catEvents = sortedEvents.filter(function (e) { return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1 && !e.isPeriod; });
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
                if (isHighlighted) { unhighlightConnector(path); hideLineTooltip(); highlightedCategoryId = null; }
                else { highlightConnector(path); highlightedCategoryId = categoryId; const ttHtml = '<div class="tooltip-label">Categoria</div><div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
            } else {
                if (path.classList.contains('persistent-highlight')) { path.classList.remove('persistent-highlight'); unhighlightConnector(path); hideLineTooltip(); highlightedCategoryId = null; }
                else { svg.querySelectorAll('.category-connector.persistent-highlight').forEach(function (el) { el.classList.remove('persistent-highlight'); el.setAttribute('opacity', '0.2'); el.setAttribute('stroke-width', '3'); el.removeAttribute('filter'); el.classList.remove('highlighted'); }); path.classList.add('persistent-highlight'); highlightConnector(path); highlightedCategoryId = categoryId; const ttHtml = '<div class="tooltip-label">Categoria</div><div class="tooltip-names" style="color:' + category.color + '">' + escapeHtml(category.name) + '</div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
            }
        });
        function highlightConnector(p) { svg.appendChild(p); p.setAttribute('opacity', '0.9'); p.setAttribute('stroke-width', '4'); if (!isMobile()) { p.setAttribute('filter', 'url(#' + glowIdCat + ')'); } p.setAttribute('stroke', category.color); p.classList.add('highlighted'); isHighlighted = true; }
        function unhighlightConnector(p) { p.setAttribute('opacity', '0.2'); p.setAttribute('stroke-width', '3'); p.removeAttribute('filter'); p.setAttribute('stroke', category.color); p.classList.remove('highlighted'); isHighlighted = false; }
        svg.appendChild(path);
    });
}

function drawLinkedEventLines(sortedEvents, eventPositions, eventSides, categories) {
    const svg = document.getElementById('linksSvg');
    svg.querySelectorAll('.link-connector, .link-defs').forEach(function (el) { el.remove(); });

    // Helper: get the horizontal center of a card element in the DOM
    function getCardCenterX(eventId, expectedSide) {
        const card = document.querySelector('.event-card[data-event-id="' + eventId + '"], .note-card[data-event-id="' + eventId + '"]');
        if (card) {
            const rect = card.getBoundingClientRect();
            return rect.left + rect.width / 2;
        }
        // Fallback: compute from side and centerX if card not found in DOM
        const centerX = getTimelineCenterX();
        const margin = window.innerWidth <= 1038 ? 14 : 16;
        return expectedSide === 'left' ? centerX - margin - 180 : centerX + margin + 180;
    }

    sortedEvents.forEach(function (event) {
        if (!event.linkedEvents || !Array.isArray(event.linkedEvents)) return;
        if (event.isPeriod) return;
        event.linkedEvents.forEach(function (link) {
            const linkedEventId = link.eventId;
            const linkedEvent = sortedEvents.find(function (e) { return String(e.id) === String(linkedEventId); });
            if (!linkedEvent || linkedEvent.isPeriod) return;
            var catAId = (event.categoryIds && event.categoryIds.length > 0) ? event.categoryIds[0] : null;
            if (!catAId && event.categoryId) catAId = String(event.categoryId);
            var catBId = (linkedEvent.categoryIds && linkedEvent.categoryIds.length > 0) ? linkedEvent.categoryIds[0] : null;
            if (!catBId && linkedEvent.categoryId) catBId = String(linkedEvent.categoryId);
            const categoryA = categories.find(function (c) { return c.id === catAId; });
            const categoryB = categories.find(function (c) { return c.id === catBId; });
            const dateA = new Date(event.startYear, event.startMonth || 0, event.startDay || 1);
            const dateB = new Date(linkedEvent.startYear, linkedEvent.startMonth || 0, linkedEvent.startDay || 1);
            const linkedIsEarlier = dateB < dateA;
            const colorA = categoryA ? categoryA.color : '#7c3aed';
            const colorB = categoryB ? categoryB.color : '#7c3aed';
            const startY = (eventPositions[event.id] || 0);
            const endY = (eventPositions[linkedEvent.id] || 0);
            const startSide = eventSides[event.id] || 'left';
            const endSide = eventSides[linkedEvent.id] || 'right';
            const startX = getCardCenterX(event.id, startSide);
            const endX = getCardCenterX(linkedEvent.id, endSide);
            const centerX = getTimelineCenterX();
            const curveAmount = Math.max(40, Math.abs(endY - startY) * 0.15);
            const gradientId = 'grad_' + event.id + '_' + linkedEventId;
            const glowId = 'glow_' + event.id + '_' + linkedEventId;
            const gradColorTop = (startY < endY) ? colorA : colorB;
            const gradColorBottom = (startY < endY) ? colorB : colorA;
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<linearGradient id="' + gradientId + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="' + gradColorTop + '"/><stop offset="100%" stop-color="' + gradColorBottom + '"/></linearGradient><filter id="' + glowId + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
            defs.classList.add('link-defs');
            svg.appendChild(defs);
            const side = link.side || 'auto';
            let curveDir;
            if (side === 'left') { curveDir = -1; }
            else if (side === 'right') { curveDir = 1; }
            else { curveDir = linkedIsEarlier ? 1 : -1; }
            const midX = (startX + endX) / 2;
            const d = 'M ' + startX + ' ' + startY + ' C ' + (midX + curveAmount * curveDir) + ' ' + startY + ', ' + (midX + curveAmount * curveDir) + ' ' + endY + ', ' + endX + ' ' + endY;
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
                p.addEventListener('mouseenter', function (e) { if (isMobile()) return; highlightLink(); isLinkHighlighted = true; var olderEvent, olderColor, newerEvent, newerColor; if (dateA < dateB) { olderEvent = event; olderColor = colorA; newerEvent = linkedEvent; newerColor = colorB; } else { olderEvent = linkedEvent; olderColor = colorB; newerEvent = event; newerColor = colorA; } const ttHtml = '<div class="tooltip-label">Eventi Collegati</div><div class="tooltip-names"><span style="color:' + olderColor + '">' + escapeHtml(olderEvent.title) + '</span><span class="tooltip-separator">→</span><span style="color:' + newerColor + '">' + escapeHtml(newerEvent.title) + '</span></div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); });
                p.addEventListener('mouseleave', function () { if (isMobile()) return; unhighlightLink(); isLinkHighlighted = false; hideLineTooltip(); });
                p.addEventListener('mousemove', function (e) { if (isMobile()) return; if (isLinkHighlighted) { const tt = document.getElementById('lineTooltip'); if (tt) { tt.style.left = e.clientX + 'px'; tt.style.top = e.clientY + 'px'; } } });
                p.addEventListener('click', function (e) {
                    if (!isMobile()) return;
                    e.stopPropagation();
                    svg.querySelectorAll('.link-connector.highlighted').forEach(function (el) { if (el !== glowPath && el !== linkPath) { unhighlightOtherLink(el); } });
                    if (isLinkHighlighted) { unhighlightLink(); isLinkHighlighted = false; svg.querySelectorAll('.link-connector.highlighted').forEach(function (el) { el.classList.remove('highlighted'); }); hideLineTooltip(); }
                    else { highlightLink(); isLinkHighlighted = true; glowPath.classList.add('highlighted'); linkPath.classList.add('highlighted'); var olderEvent, olderColor, newerEvent, newerColor; if (dateA < dateB) { olderEvent = event; olderColor = colorA; newerEvent = linkedEvent; newerColor = colorB; } else { olderEvent = linkedEvent; olderColor = colorB; newerEvent = event; newerColor = colorA; } const ttHtml = '<div class="tooltip-label">Eventi Collegati</div><div class="tooltip-names"><span style="color:' + olderColor + '">' + escapeHtml(olderEvent.title) + '</span><span class="tooltip-separator">→</span><span style="color:' + newerColor + '">' + escapeHtml(newerEvent.title) + '</span></div>'; showLineTooltip(ttHtml, e.clientX, e.clientY); }
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