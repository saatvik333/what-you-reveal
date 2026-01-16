/**
 * Tor Browser Detection Module
 * Enhanced detection with multiple heuristics
 * 
 * Detection Heuristics:
 * - UTC timezone (Tor forces UTC)
 * - Hardware concurrency = 2 (Tor default)
 * - Standard screen letterboxing dimensions  
 * - Window dimensions rounded to 100px (Tor's letterboxing)
 * - Empty plugins array (Tor hides plugins)
 * - Single en-US language
 * - WebGL renderer = Mesa (software rendering)
 * - navigator.webdriver undefined (Tor hides automation detection)
 * - deviceMemory hidden
 * - Platform/dimension mismatches
 */

/**
 * Get WebGL renderer info for Tor detection
 * @returns {Object} WebGL renderer details
 */
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return { available: false };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return { available: true, renderer: 'unknown', vendor: 'unknown' };
    }

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

    return { available: true, renderer, vendor };
  } catch (e) {
    return { available: false, error: e.message };
  }
}

/**
 * Enhanced Tor Browser detection with multiple heuristics
 * @returns {Object} Tor detection result
 */
export function testTorBrowser() {
  const indicators = [];
  let score = 0;

  // 1. Timezone check (Tor uses UTC)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzOffset = new Date().getTimezoneOffset();
  if (tz === 'UTC' || tz === 'Etc/UTC' || tzOffset === 0) {
    indicators.push('UTC timezone');
    score += 15;
  }

  // 2. Hardware concurrency (Tor reports 2)
  if (navigator.hardwareConcurrency === 2) {
    indicators.push('2 CPU cores (Tor default)');
    score += 15;
  }

  // 3. Screen dimensions letterboxing (Tor rounds to specific sizes)
  const torWidths = [1000, 1200, 1400, 1600, 1800];
  const torHeights = [900, 1000, 1100];
  if (torWidths.includes(screen.width) || torHeights.includes(screen.height)) {
    indicators.push('Tor letterbox dimensions');
    score += 15;
  }

  // 4. Window inner dimensions rounded to 200px (Tor's letterboxing feature)
  // Tor rounds window.innerWidth and innerHeight to nearest 200px in recent versions
  const innerWidthRounded = window.innerWidth % 200 === 0 || window.innerWidth % 100 === 0;
  const innerHeightRounded = window.innerHeight % 200 === 0 || window.innerHeight % 100 === 0;
  if (innerWidthRounded && innerHeightRounded) {
    // Additional check: if both are suspiciously round numbers
    if (window.innerWidth >= 800 && window.innerWidth <= 1800 && 
        window.innerHeight >= 600 && window.innerHeight <= 1200) {
      indicators.push(`Window dimensions rounded (${window.innerWidth}x${window.innerHeight})`);
      score += 20;
    }
  }

  // 5. Plugins array empty (Tor hides plugins)
  if (navigator.plugins.length === 0) {
    indicators.push('No plugins detected');
    score += 15;
  }

  // 6. Languages check (Tor reports en-US only)
  if (navigator.languages?.length === 1 && navigator.languages[0] === 'en-US') {
    indicators.push('Single en-US language');
    score += 10;
  }

  // 7. WebGL renderer check (Tor uses Mesa software renderer or blocks WebGL)
  const webglInfo = getWebGLInfo();
  if (webglInfo.available) {
    const renderer = (webglInfo.renderer || '').toLowerCase();
    const vendor = (webglInfo.vendor || '').toLowerCase();
    
    // Tor uses software rendering (Mesa, llvmpipe) or spoofed values
    if (renderer.includes('mesa') || 
        renderer.includes('llvmpipe') || 
        renderer.includes('swiftshader') ||
        renderer.includes('software') ||
        renderer === 'webgl' || // Generic spoofed value
        vendor.includes('mesa')) {
      indicators.push('Software WebGL renderer (Mesa/llvmpipe)');
      score += 25;
    }
  } else {
    // WebGL blocked entirely is also a Tor indicator
    indicators.push('WebGL unavailable');
    score += 10;
  }

  // 8. navigator.webdriver check (Tor Browser hides this)
  // In Tor, navigator.webdriver is typically undefined, not false
  if (navigator.webdriver === undefined && !('webdriver' in navigator)) {
    indicators.push('webdriver property hidden');
    score += 10;
  }

  // 9. deviceMemory hidden (Tor hides this)
  if (!('deviceMemory' in navigator)) {
    indicators.push('deviceMemory hidden');
    score += 10;
  }

  // 10. Platform mismatch with screen size
  const platform = navigator.platform;
  if (platform === 'Win32' && (screen.width === 1000 || screen.width === 1200)) {
    indicators.push('Platform/dimension suggests Tor');
    score += 10;
  }

  // 11. Color depth check (Tor often reports 24)
  if (screen.colorDepth === 24) {
    // Not adding directly to score, but combined with others
    if (score >= 30) {
      indicators.push('Standard color depth');
      score += 5;
    }
  }

  // Calculate confidence
  const isLikely = score >= 50;
  const isDefinite = score >= 80;

  return {
    triggered: isLikely,
    isDefinite,
    score,
    indicators,
    webglInfo,
    reason: isDefinite ? 'Tor Browser detected' : isLikely ? 'Possible Tor Browser' : null,
  };
}

/**
 * Detects Brave browser's privacy features
 * @returns {Promise<Object>} Brave detection result
 */
export async function detectBrave() {
  try {
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      const isBrave = await navigator.brave.isBrave();
      return { triggered: true, detected: true, confirmed: isBrave };
    }
    return { triggered: false, detected: false };
  } catch (e) {
    return { triggered: false, detected: false };
  }
}

/**
 * Check privacy signals (GPC, DNT)
 * @returns {Object} Privacy signals status
 */
export function checkPrivacySignals() {
  const signals = [];
  let score = 0;

  if (navigator.globalPrivacyControl === true) {
    signals.push('Global Privacy Control');
    score += 15;
  }

  if (navigator.doNotTrack === '1') {
    signals.push('Do Not Track');
    score += 5;
  }

  if (!('deviceMemory' in navigator)) {
    signals.push('deviceMemory hidden');
    score += 10;
  }

  // Check for reduced motion preference (privacy conscious users often enable this)
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    signals.push('Reduced motion preference');
    score += 5;
  }

  return { signals, score, triggered: score > 0 };
}
