// ================================================================
//  LAYOUT ENGINE — pure computation, zero DOM dependencies
//  Extracted from render.js for testability and reuse
// ================================================================

/**
 * Assign initial sides to categories based on preferredSide or alternation.
 * @param {Array} events - sorted array of events
 * @param {Array} categories - array of category objects
 * @returns {Object} { [categoryId]: 'left'|'right' }
 */
function assignCategorySides(events, categories) {
    const categorySides = {};
    events.forEach(function (event) {
        // Use the first category (primary) for side assignment
        var primaryCatId = (event.categoryIds && event.categoryIds.length > 0) ? event.categoryIds[0] : null;
        // Backward compat: migrate old categoryId
        if (!primaryCatId && event.categoryId) primaryCatId = String(event.categoryId);
        if (primaryCatId && !categorySides[primaryCatId]) {
            const category = categories.find(function (c) { return c.id === primaryCatId; });
            let side;
            if (category && category.preferredSide === 'left') side = 'left';
            else if (category && category.preferredSide === 'right') side = 'right';
            else side = (Object.keys(categorySides).length % 2 === 0) ? 'left' : 'right';
            categorySides[primaryCatId] = side;
        }
    });
    return categorySides;
}

/**
 * Compute event positions, sides, and base positions.
 * @param {Array} sortedEvents - events sorted by startYear
 * @param {Array} categories - array of category objects
 * @param {Object} categorySides - initial category sides
 * @param {number} minSpacing - minimum spacing between events
 * @returns {{ eventPositions: Object, eventSides: Object, basePositions: Object }}
 */
function assignEventPositionsSides(sortedEvents, categories, categorySides, minSpacing) {
    const eventPositions = {};
    const eventSides = {};
    const basePositions = {};

    sortedEvents.forEach(function (event, index) {
        // Use primary category for side assignment
        var primaryCatId = (event.categoryIds && event.categoryIds.length > 0) ? event.categoryIds[0] : null;
        if (!primaryCatId && event.categoryId) primaryCatId = String(event.categoryId);
        const category = categories.find(function (c) { return c.id === primaryCatId; });
        const defaultSide = category ? categorySides[primaryCatId] : (index % 2 === 0 ? 'left' : 'right');
        const yearPos = yearToPixelsCached(event.startYear, event.startMonth, event.startDay);
        basePositions[event.id] = yearPos;
        
        // Period events are lateral strips — they don't need vertical offset
        // and shouldn't reserve space in the event column
        if (event.isPeriod) {
            eventPositions[event.id] = yearPos;
            eventSides[event.id] = defaultSide;
            return;
        }
        
        let adjustedPosition = yearPos;
        let offset = 0;
        let currentSide = defaultSide;
        for (let i = 0; i < index; i++) {
            const prevEvent = sortedEvents[i];
            // Period events are lateral strips — skip them in conflict resolution
            if (prevEvent.isPeriod) continue;
            const prevPosition = eventPositions[prevEvent.id];
            const prevSide = eventSides[prevEvent.id];
            if (prevSide === currentSide && (prevPosition + minSpacing) > yearPos) {
                var prevCatId = (prevEvent.categoryIds && prevEvent.categoryIds.length > 0) ? prevEvent.categoryIds[0] : null;
                if (!prevCatId && prevEvent.categoryId) prevCatId = String(prevEvent.categoryId);
                const sameCategory = primaryCatId && prevCatId && String(primaryCatId) === String(prevCatId);
                if (sameCategory) {
                    offset = Math.max(offset, prevPosition + minSpacing - yearPos);
                } else {
                    const otherSide = (currentSide === 'left') ? 'right' : 'left';
                    let canSwitch = true;
                    for (let j = 0; j < index; j++) {
                        const checkEvent = sortedEvents[j];
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

    return { eventPositions: eventPositions, eventSides: eventSides, basePositions: basePositions };
}

/**
 * Correct category sides based on actual event sides.
 * (Events may have been pushed to the opposite side by positioning algorithm.)
 * @param {Object} categorySides - initial category sides (mutated in place)
 * @param {Array} sortedEvents - sorted events
 * @param {Object} eventSides - computed event sides
 * @returns {Object} the (possibly corrected) categorySides
 */
function correctCategorySides(categorySides, sortedEvents, eventSides) {
    Object.keys(categorySides).forEach(function (catId) {
        const catEvents = sortedEvents.filter(function (e) {
            return e.categoryIds && e.categoryIds.indexOf(String(catId)) !== -1;
        });
        if (catEvents.length === 0) return;
        const leftCount = catEvents.filter(function (e) { return eventSides[e.id] === 'left'; }).length;
        const rightCount = catEvents.filter(function (e) { return eventSides[e.id] === 'right'; }).length;
        if (leftCount === 0 && rightCount > 0) {
            categorySides[catId] = 'right';
        } else if (rightCount === 0 && leftCount > 0) {
            categorySides[catId] = 'left';
        }
    });
    return categorySides;
}

/**
 * Extract regular (non-note) events from the list.
 * @param {Array} events
 * @returns {Array}
 */
function filterRegularEvents(events) {
    const regularEvents = [];
    events.forEach(function (event) {
        if (event.type !== 'note') { regularEvents.push(event); }
    });
    return regularEvents;
}

/**
 * Compute pixel offsets for event nodes sharing the same year position.
 * @param {Array} regularEvents - non-note events
 * @param {Object} basePositions - { [eventId]: pixelPosition }
 * @returns {Object} { [eventId]: offsetPx }
 */
function computeNodeOffsets(regularEvents, basePositions) {
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
    return nodeOffsets;
}

/**
 * Assign non-overlapping lanes to period strips.
 * @param {Array} regularEvents - non-note events
 * @returns {Object} { [eventId]: 'left'|'right' }
 */
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

/**
 * Compute category connector slot indices to avoid overlapping lines.
 * @param {Array} sortedEvents - all sorted events
 * @param {Object} eventSides - computed event sides { [eventId]: 'left'|'right' }
 * @param {Object} categorySides - corrected category sides { [categoryId]: 'left'|'right' }
 * @returns {Object} { categoryRanges, sideSlots, categorySlots }
 */
function computeCategorySlots(sortedEvents, eventSides, categorySides) {
    const categoryRanges = {};
    Object.keys(categorySides).forEach(function (categoryId) {
        const catEvents = sortedEvents.filter(function (e) { return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1 && !e.isPeriod; });
        if (catEvents.length < 2) return;
        const ys = catEvents.map(function (e) { return eventSides[e.id] ? (/* eventPositions are computed elsewhere; for ranges we need to approximate */ 0) : 0; });
        // Note: actual Y positions are computed in assignEventPositionsSides;
        // we'll rely on the caller to pass eventPositions.
    });
    return { categoryRanges: categoryRanges };
}

/**
 * Compute category connector slot indices with actual positions.
 * @param {Array} sortedEvents - all sorted events
 * @param {Object} eventPositions - { [eventId]: pixelPosition }
 * @param {Object} eventSides - { [eventId]: 'left'|'right' }
 * @param {Object} categorySides - corrected category sides
 * @param {number} slotWidth - width per slot in px (mobile: 20, desktop: 35)
 * @returns {Object} { categoryRanges, categorySlots }
 */
function computeCategoryConnectorLayout(sortedEvents, eventPositions, eventSides, categorySides, slotWidth) {
    // Compute Y ranges per category
    const categoryRanges = {};
    Object.keys(categorySides).forEach(function (categoryId) {
        const catEvents = sortedEvents.filter(function (e) { return e.categoryIds && e.categoryIds.indexOf(String(categoryId)) !== -1 && !e.isPeriod; });
        if (catEvents.length < 2) return;
        const ys = catEvents.map(function (e) { return eventPositions[e.id] || 0; });
        categoryRanges[categoryId] = { minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
    });

    // Assign slots per side to avoid overlaps
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

    return { categoryRanges: categoryRanges, categorySlots: categorySlots };
}

/**
 * Master function: compute the complete layout for a given set of events.
 * Pure computation — no DOM access.
 *
 * @param {Array} events - all events
 * @param {Array} categories - all categories
 * @param {Object} options
 * @param {number} options.pixelsPerYear - current zoom level (unused directly, yearToPixelsCached reads global)
 * @param {boolean} options.isMobileLayout - whether to use mobile spacing
 * @returns {Object} complete layout data
 */
function computeFullLayout(events, categories, options) {
    options = options || {};
    const isMobileLayout = options.isMobileLayout !== undefined ? options.isMobileLayout : (window.innerWidth <= 768);
    const minSpacing = isMobileLayout ? 80 : 75;
    const slotWidth = isMobileLayout ? 20 : 35;

    // 1. Sort events
    const sortedEvents = events.slice().sort(function (a, b) { return a.startYear - b.startYear; });

    // 2. Assign category sides
    const initialCategorySides = assignCategorySides(sortedEvents, categories);

    // 3. Assign event positions and sides
    const posResult = assignEventPositionsSides(sortedEvents, categories, initialCategorySides, minSpacing);
    const eventPositions = posResult.eventPositions;
    const eventSides = posResult.eventSides;
    const basePositions = posResult.basePositions;

    // 4. Correct category sides based on actual event sides
    const categorySides = correctCategorySides(initialCategorySides, sortedEvents, eventSides);

    // 5. Filter regular events (non-notes)
    const regularEvents = filterRegularEvents(sortedEvents);

    // 6. Compute node offsets
    const nodeOffsets = computeNodeOffsets(regularEvents, basePositions);

    // 7. Compute period lanes
    const periodLanes = assignPeriodLanes(regularEvents);

    // 8. Compute category connector layout
    const connectorLayout = computeCategoryConnectorLayout(sortedEvents, eventPositions, eventSides, categorySides, slotWidth);
    const categoryRanges = connectorLayout.categoryRanges;
    const categorySlots = connectorLayout.categorySlots;

    return {
        sortedEvents: sortedEvents,
        regularEvents: regularEvents,
        categorySides: categorySides,
        eventPositions: eventPositions,
        eventSides: eventSides,
        basePositions: basePositions,
        nodeOffsets: nodeOffsets,
        periodLanes: periodLanes,
        categoryRanges: categoryRanges,
        categorySlots: categorySlots,
        slotWidth: slotWidth
    };
}