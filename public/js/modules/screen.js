/**
 * Screen information collection module
 */

/**
 * Collects screen and display information
 * @returns {Object} Screen data object
 */
export function collectScreenData() {
    const dpr = window.devicePixelRatio || 1;
    const screenData = {
        'Screen Width (CSS)': screen.width + 'px',
        'Screen Height (CSS)': screen.height + 'px',
        'Physical Width (Est.)': (screen.width * dpr) + 'px',
        'Physical Height (Est.)': (screen.height * dpr) + 'px',
        'Available Width': screen.availWidth + 'px',
        'Available Height': screen.availHeight + 'px',
        'Color Depth': screen.colorDepth + ' bits',
        'Pixel Depth': screen.pixelDepth + ' bits',
        'Window Inner Width': window.innerWidth + 'px',
        'Window Inner Height': window.innerHeight + 'px',
        'Window Outer Width': window.outerWidth + 'px',
        'Window Outer Height': window.outerHeight + 'px',
        'Device Pixel Ratio': dpr,
        'Screen Orientation': (screen.orientation ? (screen.orientation.type + ' (' + screen.orientation.angle + 'deg)') : 'Unknown/Desktop'),
        'Touch Support': ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ? 'Yes' : 'No'
    };
    
    // Media Query Checks
    const mediaQueries = {
        'Dark Mode': window.matchMedia('(prefers-color-scheme: dark)').matches,
        'Light Mode': window.matchMedia('(prefers-color-scheme: light)').matches,
        'Reduced Motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        'High Contrast': window.matchMedia('(prefers-contrast: more)').matches,
        'Portrait': window.matchMedia('(orientation: portrait)').matches,
        'Landscape': window.matchMedia('(orientation: landscape)').matches
    };
    
    // Merge Media Queries into Screen Data
    Object.assign(screenData, mediaQueries);

    return screenData;
}
