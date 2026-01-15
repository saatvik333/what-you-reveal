/**
 * Custom Cursor Module
 * Creates a DOM-based cursor that follows CRT effects
 */

let cursorElement = null;
let crtScreen = null;
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let rafId = null;

/**
 * Create the cursor DOM element
 */
function createCursor() {
    crtScreen = document.querySelector('.crt-screen');
    if (!crtScreen) {
        // Fallback to body if no CRT screen
        crtScreen = document.body;
    }
    
    cursorElement = document.createElement('div');
    cursorElement.className = 'custom-cursor';
    cursorElement.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="0" x2="12" y2="9" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="15" x2="12" y2="24" stroke="currentColor" stroke-width="2"/>
            <line x1="0" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="12" x2="24" y2="12" stroke="currentColor" stroke-width="2"/>
        </svg>
    `;
    crtScreen.appendChild(cursorElement);
}

/**
 * Update cursor position immediately (no lerp/lag)
 */
function updateCursorPosition(x, y) {
    if (cursorElement && crtScreen) {
        // Convert viewport coords to container-relative coords
        const rect = crtScreen.getBoundingClientRect();
        const relX = x - rect.left + crtScreen.scrollLeft - 12;
        const relY = y - rect.top + crtScreen.scrollTop - 12;
        
        // Use translate3d for GPU acceleration
        cursorElement.style.transform = `translate3d(${relX}px, ${relY}px, 0)`;
    }
}

/**
 * Handle mouse movement
 */
function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update immediately for 1:1 hardware feel
    requestAnimationFrame(() => updateCursorPosition(mouseX, mouseY));
}

/**
 * Handle mouse leave (hide cursor when outside window)
 */
function onMouseLeave() {
    if (cursorElement) {
        cursorElement.style.opacity = '0';
    }
}

/**
 * Handle mouse enter (show cursor when inside window)
 */
function onMouseEnter() {
    if (cursorElement) {
        cursorElement.style.opacity = '1';
    }
}

/**
 * Initialize the custom cursor
 */
export function initCursor() {
    createCursor();

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
}

/**
 * Cleanup (if needed)
 */
export function destroyCursor() {
    if (cursorElement) {
        cursorElement.remove();
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
    document.removeEventListener('mouseenter', onMouseEnter);
}
