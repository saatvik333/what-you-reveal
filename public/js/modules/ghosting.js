
/**
 * Ghosting/Phosphor Trail Effect Module
 *
 * Implements a fading trail effect for moving/updating text.
 * Uses a canvas overlay to draw "ghosts" of previous frames.
 * Optimized to avoid layout thrashing by caching element metrics.
 */

let canvas;
let ctx;
let container;
let isRunning = false;
let lastActivityTime = 0;
let ghostElements = []; // Cache of text elements and their properties
let rafId;

// Configuration
const TRAIL_DECAY = 0.90; // Fade out factor
const IDLE_TIMEOUT = 500; // ms

export function initGhosting() {
    container = document.querySelector('.crt-screen');
    if (!container) return;

    // Create Canvas
    canvas = document.createElement('canvas');
    canvas.id = 'phosphor-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 5;
        opacity: 0.6;
    `;
    container.appendChild(canvas);

    // Resize & Initial Measure
    const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
        measureElements(); // Re-measure on resize
    });
    resizeObserver.observe(container);
    resizeCanvas();

    // Setup Observers
    const contentLayer = document.querySelector('.crt-content-layer');
    if (contentLayer) {
        // Scroll just triggers activity, doesn't need re-measure (we use scrollTop)
        contentLayer.addEventListener('scroll', handleActivity, { passive: true });

        // Mutation Observer: Re-measure when content changes
        const mutationObserver = new MutationObserver((mutations) => {
            let needsMeasure = false;
            mutations.forEach(m => {
                if (m.type === 'childList' || m.type === 'characterData') {
                    needsMeasure = true;
                }
            });
            if (needsMeasure) {
                measureElements();
                handleActivity();
            }
        });
        mutationObserver.observe(contentLayer, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Initial measure
    measureElements();
    handleActivity();
}

function resizeCanvas() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx = canvas.getContext('2d');
}

/**
 * Scans the DOM for text elements and caches their layout metrics.
 * This is expensive, so we only do it on mutation/resize.
 */
function measureElements() {
    if (!container) return;
    const contentLayer = document.querySelector('.crt-content-layer');
    if (!contentLayer) return;

    // Clear cache
    ghostElements = [];

    // Select candidates
    const candidates = contentLayer.querySelectorAll(
        'h2, pre, .terminal-row .key, .terminal-row .value, .subtitle, .prompt'
    );

    // Get container offset relative to the scrollable layer top?
    // We want position relative to the SCROLL CONTENT.
    // elem.offsetTop gives distance to offsetParent.
    // If offsetParent is contentLayer (which has relative position), then offsetTop is Y position.

    // Check if contentLayer is the offset parent
    // It has `position: relative` in CSS?
    // Let's check computed style logic or just assume.
    // In effects.css: .crt-content-layer { position: relative; }
    // So `el.offsetTop` should be relative to the content layer top.

    candidates.forEach(el => {
        const text = el.innerText;
        if (!text || !text.trim()) return;

        // Get computed style for font and color
        const style = getComputedStyle(el);
        const font = style.font; // e.g. "16px VT323"
        const color = style.color;

        // We handle multiline PRE separately
        const isPre = el.tagName === 'PRE';
        const lineHeightStr = style.lineHeight;
        let lineHeight = 18; // default fallback
        if (lineHeightStr && lineHeightStr !== 'normal') {
            lineHeight = parseFloat(lineHeightStr);
        } else {
            // approx for normal
            const fontSize = parseFloat(style.fontSize);
            lineHeight = fontSize * 1.2;
        }

        ghostElements.push({
            text: text,
            top: el.offsetTop, // Static position in the scrollable document
            left: el.offsetLeft,
            font: font,
            color: color,
            isPre: isPre,
            lineHeight: lineHeight
        });
    });
}

function handleActivity() {
    lastActivityTime = Date.now();
    startLoop();
}

function startLoop() {
    if (!isRunning) {
        isRunning = true;
        renderLoop();
    }
}

function renderLoop() {
    if (!canvas || !ctx || !isRunning) return;

    const now = Date.now();
    if (now - lastActivityTime > IDLE_TIMEOUT + 500) {
        isRunning = false;
        return;
    }

    // Fade out previous frame
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - TRAIL_DECAY})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // If idle but fading, we skip drawing NEW text (so only trails remain)
    if (now - lastActivityTime > IDLE_TIMEOUT) {
        requestAnimationFrame(renderLoop);
        return;
    }

    // Draw current state
    const contentLayer = document.querySelector('.crt-content-layer');
    if (!contentLayer) {
        requestAnimationFrame(renderLoop);
        return;
    }

    const scrollTop = contentLayer.scrollTop;
    const scrollLeft = contentLayer.scrollLeft;

    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;

    // Optimization: Draw only visible elements
    // We iterate the cached array (pure JS, fast)
    // No DOM access here!

    ghostElements.forEach(item => {
        // Calculate current Y on screen
        const y = item.top - scrollTop;
        const x = item.left - scrollLeft; // Assuming horizontal scroll might happen? usually hidden.

        // Culling
        if (y > canvasHeight || y + 100 < 0) return; // Simple culling

        // Set styles
        // Setting ctx properties is somewhat expensive, but necessary if they vary.
        // We could sort by style to batch, but maybe overkill.
        if (ctx.font !== item.font) ctx.font = item.font;
        if (ctx.fillStyle !== item.color) ctx.fillStyle = item.color;

        if (item.isPre) {
            const lines = item.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, x, y + item.lineHeight + (i * item.lineHeight));
            });
        } else {
            // Adjust for baseline approximation.
            // offsetTop is top-left corner. fillText draws from baseline.
            // Using lineHeight as approx baseline offset.
            ctx.fillText(item.text, x, y + item.lineHeight * 0.8);
        }
    });

    rafId = requestAnimationFrame(renderLoop);
}
