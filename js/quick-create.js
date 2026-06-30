// ================================================================
//  QUICK CREATE — Click on empty timeline space to create
// ================================================================
let quickCreateYear = 0;
let quickCreateVisible = false;
let isDraggingCursor = false;
let dragJustEnded = false;
let dragEndTimer = null;
let dragStartY = 0;
let dragStartYear = 0;
let dragStartScroll = 0;
let edgeScrollInterval = null;
let fadeOutTimer = null;
let isCursorInViewport = true;

// ================================================================
//  SHOW / HIDE
// ================================================================
function showQuickCreate(year) {
    quickCreateYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
    quickCreateVisible = true;

    // Reset fade state
    clearTimeout(fadeOutTimer);
    fadeOutTimer = null;
    isCursorInViewport = true;

    const cursor = document.getElementById('quickCreateCursor');
    const balloon = document.getElementById('quickCreateBalloon');

    cursor.classList.add('visible');
    updateCursorPosition();

    document.getElementById('quickCreateBalloonYear').textContent = formatYear(quickCreateYear);
    balloon.classList.remove('fading');
    balloon.classList.add('visible');
    updateBalloonPosition();

    // Focus the handle for keyboard accessibility
    setTimeout(function () {
        document.getElementById('quickCreateHandle').focus();
    }, 50);
}

function hideQuickCreate() {
    if (!quickCreateVisible) return;
    quickCreateVisible = false;
    isDraggingCursor = false;
    stopEdgeScroll();

    document.getElementById('quickCreateCursor').classList.remove('visible', 'dragging');
    document.getElementById('quickCreateBalloon').classList.remove('visible');
}

function isQuickCreateVisible() {
    return quickCreateVisible;
}

// ================================================================
//  CURSOR & BALLOON POSITION
// ================================================================
function updateCursorPosition() {
    const cursor = document.getElementById('quickCreateCursor');
    if (!cursor) return;
    const ruler = document.getElementById('timelineRuler');
    const container = document.querySelector('.timeline-container');
    if (!ruler || !container) return;

    const yearPos = yearToPixelsCached(quickCreateYear);
    cursor.style.top = yearPos + 'px';
}

function updateBalloonPosition() {
    const balloon = document.getElementById('quickCreateBalloon');
    const cursor = document.getElementById('quickCreateCursor');
    if (!balloon || !cursor) return;

    const isMobile = window.innerWidth <= 768;
    const ruler = document.getElementById('timelineRuler');
    const toolbar = document.querySelector('.toolbar');
    const toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
    const cursorRect = cursor.getBoundingClientRect();
    const cursorCenterY = cursorRect.top + cursorRect.height / 2;
    const balloonHeight = balloon.offsetHeight;
    if (!balloonHeight) return; // not rendered yet, will retry on next frame
    const gap = 20;

    // Reserve space at the bottom for mini-map (horizontal on mobile) + FAB
    var miniMapReserve = 0;
    if (isMobile) {
        var miniMap = document.querySelector('.mini-map.horizontal');
        if (miniMap && miniMap.offsetHeight) {
            miniMapReserve = miniMap.getBoundingClientRect().height + 8;
        }
    }
    var fabReserve = isMobile ? 60 : 80;

    var minTop = toolbarBottom + gap;
    var maxBottom = window.innerHeight - gap - miniMapReserve - fabReserve;

    if (isMobile) {
        // Position above or below the cursor, whichever has more space
        var spaceAbove = cursorCenterY - minTop;
        var spaceBelow = maxBottom - cursorCenterY;
        var balloonTop;

        balloon.style.left = '50%';
        balloon.style.transform = 'translateX(-50%)';

        if (spaceAbove >= balloonHeight + gap) {
            balloonTop = cursorCenterY - balloonHeight - gap;
            if (balloonTop < minTop) balloonTop = minTop;
        } else if (spaceBelow >= balloonHeight + gap) {
            balloonTop = cursorCenterY + gap;
        } else {
            if (spaceAbove > spaceBelow) {
                balloonTop = cursorCenterY - balloonHeight - gap;
                if (balloonTop < minTop) balloonTop = minTop;
            } else {
                balloonTop = cursorCenterY + gap;
                if (balloonTop + balloonHeight > maxBottom) balloonTop = maxBottom - balloonHeight;
            }
        }

        // Final vertical clamp
        if (balloonTop < minTop) balloonTop = minTop;
        if (balloonTop + balloonHeight > maxBottom) balloonTop = maxBottom - balloonHeight;

        balloon.style.top = balloonTop + 'px';
    } else {
        // Desktop: position to the side
        if (!ruler) return;
        var rulerRect = ruler.getBoundingClientRect();
        var cursorTop = cursorRect.top;
        var centerX = rulerRect.left + rulerRect.width / 2;
        var balloonWidth = balloon.offsetWidth || 240;

        var balloonLeft = centerX + gap + 20;
        var balloonTopDT = cursorTop;

        if (balloonLeft + balloonWidth > window.innerWidth - gap - 35) {
            balloonLeft = centerX - balloonWidth - gap - 20;
        }

        var halfBalloon = balloonHeight / 2;
        if (balloonTopDT - halfBalloon < minTop) balloonTopDT = minTop + halfBalloon;
        if (balloonTopDT + halfBalloon > maxBottom) balloonTopDT = maxBottom - halfBalloon;

        balloon.style.left = balloonLeft + 'px';
        balloon.style.top = balloonTopDT + 'px';
        balloon.style.transform = 'translateY(-50%)';
    }
}

// ================================================================
//  DRAG HANDLING
// ================================================================
function startDrag(e) {
    if (!quickCreateVisible) return;
    isDraggingCursor = true;
    const cursor = document.getElementById('quickCreateCursor');
    cursor.classList.add('dragging');

    dragStartY = e.clientY;
    dragStartYear = quickCreateYear;
    dragStartScroll = document.getElementById('timelineRuler').scrollTop;

    e.preventDefault();
    e.stopPropagation();
}

function onDragMove(e) {
    if (!isDraggingCursor || !quickCreateVisible) return;

    const ruler = document.getElementById('timelineRuler');
    const rulerRect = ruler.getBoundingClientRect();
    const toolbar = document.querySelector('.toolbar');
    const toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;

    const mouseY = e.clientY;

    // Edge scrolling
    const edgeThreshold = 60;
    const scrollSpeed = 8;

    if (mouseY < toolbarBottom + edgeThreshold) {
        const distFromEdge = Math.max(0, mouseY - toolbarBottom);
        const speed = scrollSpeed * (1 - distFromEdge / edgeThreshold);
        ruler.scrollTop -= speed;
        startEdgeScroll(-speed);
    } else if (mouseY > window.innerHeight - edgeThreshold) {
        const distFromEdge = Math.max(0, window.innerHeight - mouseY);
        const speed = scrollSpeed * (1 - distFromEdge / edgeThreshold);
        ruler.scrollTop += speed;
        startEdgeScroll(speed);
    } else {
        stopEdgeScroll();
    }

    // Convert mouse position to year
    const relativeY = mouseY - rulerRect.top + ruler.scrollTop;
    var year = estimateYearFromScroll(relativeY);
    year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));

    if (year !== quickCreateYear) {
        quickCreateYear = year;
        updateCursorPosition();
        document.getElementById('quickCreateBalloonYear').textContent = formatYear(quickCreateYear);
        updateBalloonPosition();
    }
}

function startEdgeScroll(speed) {
    stopEdgeScroll();
    edgeScrollInterval = setInterval(function () {
        const ruler = document.getElementById('timelineRuler');
        ruler.scrollTop += speed;
        const rulerRect = ruler.getBoundingClientRect();
        const centerY = window.innerHeight / 2;
        const relativeY = centerY - rulerRect.top + ruler.scrollTop;
        var year = estimateYearFromScroll(relativeY);
        year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
        if (year !== quickCreateYear && quickCreateVisible) {
            quickCreateYear = year;
            updateCursorPosition();
            document.getElementById('quickCreateBalloonYear').textContent = formatYear(quickCreateYear);
            updateBalloonPosition();
        }
    }, 30);
}

function stopEdgeScroll() {
    if (edgeScrollInterval) {
        clearInterval(edgeScrollInterval);
        edgeScrollInterval = null;
    }
}

function endDrag(e) {
    if (!isDraggingCursor) return;
    isDraggingCursor = false;
    stopEdgeScroll();

    const cursor = document.getElementById('quickCreateCursor');
    cursor.classList.remove('dragging');

    dragJustEnded = true;
    clearTimeout(dragEndTimer);
    dragEndTimer = setTimeout(function () {
        dragJustEnded = false;
        dragEndTimer = null;
    }, 150);

    updateBalloonPosition();
}

// ================================================================
//  BALLOON ACTION: user clicked an option
// ================================================================
function quickCreateSelect(type) {
    const year = quickCreateYear;
    hideQuickCreate();
    openModal({ year: year, type: type });
}

// ================================================================
//  DRAG EVENT LISTENERS (set up once on init)
// ================================================================
function setupQuickCreateListeners() {
    const handle = document.getElementById('quickCreateHandle');

    handle.addEventListener('mousedown', function (e) {
        startDrag(e);
    });

    handle.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            startDrag({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: function () { e.preventDefault(); }, stopPropagation: function () { e.stopPropagation(); } });
        }
    }, { passive: false });

    document.addEventListener('mousemove', function (e) {
        onDragMove(e);
    });

    document.addEventListener('touchmove', function (e) {
        if (isDraggingCursor && e.touches.length === 1) {
            const touch = e.touches[0];
            onDragMove({ clientX: touch.clientX, clientY: touch.clientY });
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('mouseup', function (e) {
        endDrag(e);
    });

    document.addEventListener('touchend', function (e) {
        endDrag(e);
    });

    // Click on balloon itself: stop propagation to prevent hiding
    const balloon = document.getElementById('quickCreateBalloon');
    balloon.addEventListener('click', function (e) {
        e.stopPropagation();
    });
    balloon.addEventListener('mousedown', function (e) {
        e.stopPropagation();
    });

    handle.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Scroll listener: fade out balloon when cursor scrolls out of viewport
    const ruler = document.getElementById('timelineRuler');
    if (ruler) {
        ruler.addEventListener('scroll', function () {
            if (!quickCreateVisible || isDraggingCursor) return;

            var cursorEl = document.getElementById('quickCreateCursor');
            var balloonEl = document.getElementById('quickCreateBalloon');
            if (!cursorEl || !balloonEl) return;

            var toolbar = document.querySelector('.toolbar');
            var toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 0;
            var cursorTop = cursorEl.getBoundingClientRect().top;
            var cursorBottom = cursorEl.getBoundingClientRect().bottom;

            var isVisible = (cursorBottom > toolbarBottom && cursorTop < window.innerHeight);

            if (isVisible) {
                updateBalloonPosition();
                if (!isCursorInViewport) {
                    isCursorInViewport = true;
                    clearTimeout(fadeOutTimer);
                    fadeOutTimer = null;
                    balloonEl.classList.remove('fading');
                }
            } else if (!isVisible && isCursorInViewport) {
                isCursorInViewport = false;
                balloonEl.classList.add('fading');
                clearTimeout(fadeOutTimer);
                fadeOutTimer = setTimeout(function () {
                    hideQuickCreate();
                    fadeOutTimer = null;
                    isCursorInViewport = true;
                }, 400);
            }
        }, { passive: true });
    }
}