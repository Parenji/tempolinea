// ================================================================
//  LINE TOOLTIP
// ================================================================
function ensureLineTooltip() {
    let tt = document.getElementById('lineTooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'lineTooltip';
        tt.className = 'line-tooltip';
        document.body.appendChild(tt);
    }
    return tt;
}

function showLineTooltip(html, x, y) {
    const tt = ensureLineTooltip();
    tt.innerHTML = html;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
    tt.classList.add('visible');
}

function hideLineTooltip() {
    const tt = document.getElementById('lineTooltip');
    if (tt) tt.classList.remove('visible');
}

function adjustTooltipPosition(tooltip) {
    if (window.innerWidth > 768) return;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let isOffScreen = false;
    let newLeft = rect.left;
    let newTop = rect.top;
    if (rect.left < 0) { isOffScreen = true; newLeft = 8; }
    else if (rect.right > viewportWidth) { isOffScreen = true; newLeft = viewportWidth - rect.width - 8; }
    if (rect.top < 0) { isOffScreen = true; newTop = 8; }
    else if (rect.bottom > viewportHeight) { isOffScreen = true; newTop = viewportHeight - rect.height - 8; }
    if (isOffScreen) {
        tooltip.style.position = 'fixed';
        tooltip.style.left = newLeft + 'px';
        tooltip.style.top = newTop + 'px';
        tooltip.style.transform = 'none';
        tooltip.style.marginLeft = '0';
        tooltip.style.marginRight = '0';
    }
}