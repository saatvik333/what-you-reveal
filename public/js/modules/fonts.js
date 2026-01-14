/**
 * Font detection module
 * Detects installed system fonts using document.fonts API (fast) or canvas/span text measurement (fallback)
 */

/**
 * Detects available fonts from a predefined list
 * @returns {Promise<Object>} Detected fonts data
 */
export async function collectFontData() {
    const fontList = [
        'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
        'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
        'Roboto', 'Ubuntu', 'Cantarell', 'Fira Code', 'Open Sans', 'Lato', 'Montserrat'
    ];
    
    const detected = [];

    // METHOD 1: Modern CSS Font Loading API (No layout thrashing)
    if (document.fonts && document.fonts.check) {
        for (const font of fontList) {
            // check() returns true if the font is available/loaded
            // We use '12px FontName' syntax
            if (document.fonts.check(`12px "${font}"`)) {
                detected.push(font);
            }
        }
    } 
    // METHOD 2: Legacy Fallback (OffsetWidth measurement)
    else {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = "mmmmmmmmmmlli";
        const testSize = '72px';
        const h1 = document.body;

        // Create a span for testing
        const s = document.createElement("span");
        s.style.fontSize = testSize;
        s.style.position = 'absolute';
        s.style.left = '-9999px'; // Hide off-screen to minimize visual impact
        s.style.visibility = 'hidden';
        s.innerHTML = testString;
        
        const defaultDimensions = {};

        // 1. Measure baselines (Batch DOM writes then reads)
        h1.appendChild(s);
        
        for (const base of baseFonts) {
            s.style.fontFamily = base;
            defaultDimensions[base] = { w: s.offsetWidth, h: s.offsetHeight };
        }

        // 2. Measure target fonts
        for (const font of fontList) {
            let detectedCount = 0;
            for (const base of baseFonts) {
                s.style.fontFamily = `"${font}", ${base}`;
                const w = s.offsetWidth;
                const h = s.offsetHeight;
                
                if (w !== defaultDimensions[base].w || h !== defaultDimensions[base].h) {
                    detectedCount++;
                }
            }
            if (detectedCount > 0) {
                detected.push(font);
            }
        }
        
        h1.removeChild(s);
    }

    return {
        'Detected Fonts Count': detected.length,
        'Installed Fonts': detected.length > 0 ? detected.join(', ') : 'None detected (Fingerprinting protection?)'
    };
}
