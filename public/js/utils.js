/**
 * Utility functions for What You Reveal
 */

/**
 * Creates ASCII-style table output with filtering for unknown/unsupported values
 * @param {Object} data - Key-value pairs to display
 * @returns {string} HTML string with formatted table
 */
export function createTable(data) {
    let output = '';
    // Filter keys first
    const entries = Object.entries(data).filter(([k, v]) => {
        if (!v) return false;
        const strVal = (typeof v === 'object' && v.value) ? v.value : String(v);
        const lower = strVal.toLowerCase();
        return !lower.includes('unknown') && 
               !lower.includes('unsupported') && 
               !lower.includes('not accessible') &&
               !lower.includes('undefined') &&
               strVal !== '';
    });
    
    if (entries.length === 0) return '<span class="loading">No accessible data.</span>';

    const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
    
    for (const [key, value] of entries) {
        // Handle nested objects or arrays by converting to string
        let displayValue = value;
        let warning = false;

        // Check if value is an object containing 'value' and 'warning' properties (for our alerts)
        if (typeof value === 'object' && value !== null && 'value' in value && 'warning' in value) {
            displayValue = value.value;
            if (value.warning) {
                warning = true;
            }
        } else if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value, null, 2); 
        }

        // ASCII Formatting: KEY ............ VALUE
        const padding = '.'.repeat(maxKeyLen - key.length + 4);
        const line = `${key} ${padding} ${displayValue}\n`;
        
        if (warning) {
            output += `<span class="warning">${line}</span>`;
        } else {
            output += line;
        }
    }
    return '<pre>' + output + '</pre>';
}

/**
 * Simple mixing hash function (cyrb53)
 * @param {string} str - String to hash
 * @param {number} seed - Optional seed
 * @returns {number} Hash value
 */
export function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Global Observer for reveal effects
 */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const content = el.getAttribute('data-content');
            if (content) {
                // Determine speed based on content length
                const speed = 5; 
                typeWriterEffect(el, content, speed);
                revealObserver.unobserve(el);
            }
        }
    });
}, { threshold: 0.1 });

/**
 * Simulates typing effect for text content.
 * Note: For HTML tables, we'll blast the HTML but animate the lines if possible, 
 * or just fade in to avoid breaking markup structure during typing.
 * @param {HTMLElement} element 
 * @param {string} html 
 * @param {number} speed 
 */
function typeWriterEffect(element, html, speed) {
    // If it's a pre block (ASCII table), we can split by lines
    if (html.startsWith('<pre>') || html.includes('<pre>')) {
        element.innerHTML = html;
        element.classList.add('flicker-in');
        
        // Optional: Sequential line reveal could go here but is complex with HTML tags.
        // Simple flicker-in is strictly "retro" enough for data dumps.
        // But let's try to add a "scanning" class
        element.style.opacity = '1';
        return;
    }
    
    // For simple text, we can type it
    element.textContent = '';
    element.style.opacity = '1';
    
    let i = 0;
    function type() {
        if (i < html.length) {
            element.textContent += html.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

/**
 * Renders data to a DOM element with effect
 * @param {string} elementId - ID of target element
 * @param {Object} data - Data to render
 */
export function renderToElement(elementId, data) {
    const element = document.getElementById(elementId);
    if (element) {
        const htmlContent = createTable(data);
        
        // If element is already visible, run immediately? 
        // Or strictly use observer?
        // Let's use observer for everything to be consistent.
        
        element.setAttribute('data-content', htmlContent);
        element.style.opacity = '0'; // Hide initially
        revealObserver.observe(element);
    }
}
