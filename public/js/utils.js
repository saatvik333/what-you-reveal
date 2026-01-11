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
 * Types HTML content line by line to an element
 * @param {HTMLElement} element 
 * @param {string} html 
 */
async function typeWriterHTML(element, html) {
    // Basic implementation: Set content immediately but animate opacity or just "add" lines?
    // "Typing" HTML is hard because of tags. 
    // Hack: Parse output into lines (since it's <pre> content usually) and append line by line.
    
    // Check if it is a pre block
    if (html.startsWith('<pre>') && html.endsWith('</pre>')) {
        element.innerHTML = '<pre></pre>';
        const pre = element.querySelector('pre');
        const content = html.substring(5, html.length - 6);
        // Split by newlines, but be careful with nested tags like <span class="warning">
        // Our createTable generates specific format: line\n or <span..>line</span>
        // Let's rely on the fact that createTable puts \n at end of lines
        
        // Actually, simpler: Just set it. The boot sequence is the main effect. 
        // Typing every single panel might be too slow for UX.
        // Let's do a "fast reveal" - add a class that flickers in.
        element.innerHTML = html;
        element.classList.add('flicker-in');
        return;
    }
    
    element.innerHTML = html;
}

/**
 * Renders data to a DOM element with effect
 * @param {string} elementId - ID of target element
 * @param {Object} data - Data to render
 */
export function renderToElement(elementId, data) {
    const element = document.getElementById(elementId);
    if (element) {
        typeWriterHTML(element, createTable(data));
    }
}
