/**
 * Font detection module
 * Detects installed system fonts using canvas text measurement
 */

/**
 * Detects available fonts from a predefined list
 * @returns {Object} Detected fonts data
 */
export function collectFontData() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = "mmmmmmmmmmlli";
    const testSize = '72px';
    const h1 = document.getElementsByTagName("body")[0];

    // Create a span for testing
    const s = document.createElement("span");
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidths = {};
    const defaultHeights = {};

    // Calculate dimensions of base fonts
    for (const base of baseFonts) {
        s.style.fontFamily = base;
        h1.appendChild(s);
        defaultWidths[base] = s.offsetWidth;
        defaultHeights[base] = s.offsetHeight;
        h1.removeChild(s);
    }

    // List of common fonts to check (Windows, macOS, Linux, Common)
    const fontList = [
        'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
        'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
        'Roboto', 'Ubuntu', 'Cantarell', 'Fira Code', 'Open Sans', 'Lato', 'Montserrat'
    ];

    const detected = [];

    for (const font of fontList) {
        let detectedCount = 0;
        for (const base of baseFonts) {
            s.style.fontFamily = `"${font}", ${base}`;
            h1.appendChild(s);
            const matched = (s.offsetWidth !== defaultWidths[base] || s.offsetHeight !== defaultHeights[base]);
            h1.removeChild(s);
            if (matched) {
                detectedCount++;
            }
        }
        // If it differs from at least one base font, it's likely present
        if (detectedCount > 0) {
            detected.push(font);
        }
    }

    return {
        'Detected Fonts Count': detected.length,
        'Installed Fonts': detected.length > 0 ? detected.join(', ') : 'None detected (Fingerprinting protection?)'
    };
}
