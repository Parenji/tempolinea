// ================================================================
//  MINI-MAP (vertical on desktop, horizontal on mobile)
// ================================================================
let miniMapCanvas = null;
let miniMapCtx = null;
let miniMapHideTimer = null;

function positionMiniMap() {
    const container = document.getElementById('miniMapContainer');
    if (!container) return;
    const toolbar = document.querySelector('.toolbar');
    const toolbarBottom = toolbar ? toolbar.getBoundingClientRect().bottom : 85;
    if (isMobile()) {
        container.style.top = (toolbarBottom) + 'px';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = 'auto';
        container.style.width = 'auto';
        container.style.height = '24px';
        // Reset timeline ruler padding for mobile
        const ruler = document.getElementById('timelineRuler');
        if (ruler) {
            ruler.style.paddingRight = '0';
        }
    } else {
        container.style.top = toolbarBottom + 'px';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.left = 'auto';
        container.style.width = '35px';
        container.style.height = 'auto';
        // Adjust timeline ruler padding for desktop mini-map
        const ruler = document.getElementById('timelineRuler');
        if (ruler) {
            ruler.style.paddingRight = '37px';
        }
    }
}

function initMiniMap() {
    const container = document.createElement('div');
    container.id = 'miniMapContainer';
    container.className = 'mini-map ' + (isMobile() ? 'horizontal' : 'vertical');
    const canvas = document.createElement('canvas');
    canvas.id = 'miniMapCanvas';
    const viewport = document.createElement('div');
    viewport.className = 'mini-map-viewport';
    viewport.id = 'miniMapViewport';
    container.appendChild(canvas);
    container.appendChild(viewport);
    document.body.appendChild(container);
    miniMapCanvas = canvas;
    miniMapCtx = canvas.getContext('2d');

    positionMiniMap();

    // Click to navigate
    container.addEventListener('click', function (e) {
        // Ignore clicks when mini-map is hidden (mobile only)
        if (isMobile() && !container.classList.contains('visible')) return;
        const rect = canvas.getBoundingClientRect();
        const ruler = document.getElementById('timelineRuler');
        const totalHeight = yearToPixelsCached(MAX_YEAR);
        if (isMobile()) {
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            ruler.scrollTop = ratio * totalHeight - window.innerHeight / 2;
        } else {
            const clickY = e.clientY - rect.top;
            const ratio = clickY / rect.height;
            ruler.scrollTop = ratio * totalHeight - window.innerHeight / 2;
        }
    });

    const ruler = document.getElementById('timelineRuler');
    ruler.addEventListener('scroll', function () {
        updateMiniMapViewport();
        if (isMobile()) {
            container.classList.add('visible');
            clearTimeout(miniMapHideTimer);
            miniMapHideTimer = setTimeout(function () {
                container.classList.remove('visible');
            }, 1500);
        }
    });
    window.addEventListener('resize', function () {
        const c = document.getElementById('miniMapContainer');
        if (c) {
            c.className = 'mini-map ' + (isMobile() ? 'horizontal' : 'vertical');
        }
        positionMiniMap();
        updateMiniMap();
    });

    // Show briefly on init (like year indicator)
    if (isMobile()) {
        container.classList.add('visible');
        miniMapHideTimer = setTimeout(function () {
            container.classList.remove('visible');
        }, 1500);
    }
}

function updateMiniMap() {
    if (!miniMapCanvas || !miniMapCtx) return;
    const container = miniMapCanvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    miniMapCanvas.width = width;
    miniMapCanvas.height = height;
    miniMapCtx.clearRect(0, 0, width, height);

    const totalHeight = yearToPixelsCached(MAX_YEAR);
    const events = getEvents();
    const categories = getCategories();

    if (isMobile()) {
        // Horizontal layout: timeline runs left-to-right
        const scaleX = width / totalHeight;
        events.forEach(function (event) {
            const x = yearToPixelsCached(event.startYear, event.startMonth, event.startDay) * scaleX;
            const category = categories.find(function (c) { return c.id === event.categoryId; });
            const color = category ? category.color : '#7c3aed';
            if (event.isPeriod && event.endYear) {
                const endX = yearToPixelsCached(event.endYear, event.endMonth, event.endDay) * scaleX;
                const w = Math.max(1, endX - x);
                miniMapCtx.fillStyle = color;
                miniMapCtx.globalAlpha = 0.5;
                miniMapCtx.fillRect(x, 1, w, height - 2);
            } else {
                miniMapCtx.fillStyle = color;
                miniMapCtx.globalAlpha = 0.8;
                miniMapCtx.beginPath();
                miniMapCtx.arc(x, height / 2, 1.5, 0, Math.PI * 2);
                miniMapCtx.fill();
            }
        });
    } else {
        // Vertical layout: timeline runs top-to-bottom
        const scaleY = height / totalHeight;
        events.forEach(function (event) {
            const y = yearToPixelsCached(event.startYear, event.startMonth, event.startDay) * scaleY;
            const category = categories.find(function (c) { return c.id === event.categoryId; });
            const color = category ? category.color : '#7c3aed';
            if (event.isPeriod && event.endYear) {
                const endY = yearToPixelsCached(event.endYear, event.endMonth, event.endDay) * scaleY;
                const h = Math.max(1, endY - y);
                miniMapCtx.fillStyle = color;
                miniMapCtx.globalAlpha = 0.5;
                miniMapCtx.fillRect(1, y, width - 2, h);
            } else {
                miniMapCtx.fillStyle = color;
                miniMapCtx.globalAlpha = 0.8;
                miniMapCtx.beginPath();
                miniMapCtx.arc(width / 2, y, 1.5, 0, Math.PI * 2);
                miniMapCtx.fill();
            }
        });
    }
    miniMapCtx.globalAlpha = 1;
    updateMiniMapViewport();
}

function updateMiniMapViewport() {
    const container = document.getElementById('miniMapContainer');
    const viewport = document.getElementById('miniMapViewport');
    if (!container || !viewport) return;
    const ruler = document.getElementById('timelineRuler');
    const totalHeight = yearToPixelsCached(MAX_YEAR);
    const scrollTop = ruler.scrollTop;
    const viewportWinHeight = window.innerHeight;

    if (isMobile()) {
        const containerWidth = container.clientWidth;
        const scaleX = containerWidth / totalHeight;
        const left = scrollTop * scaleX;
        const vw = viewportWinHeight * scaleX;
        viewport.style.left = Math.max(0, left) + 'px';
        viewport.style.width = Math.min(containerWidth - left, vw) + 'px';
    } else {
        const containerHeight = container.clientHeight;
        const scaleY = containerHeight / totalHeight;
        const top = scrollTop * scaleY;
        const vh = viewportWinHeight * scaleY;
        viewport.style.top = Math.max(0, top) + 'px';
        viewport.style.height = Math.min(containerHeight - top, vh) + 'px';
    }
}