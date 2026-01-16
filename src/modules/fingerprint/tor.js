/**
 * Tor Browser Detection Module
 * Enhanced detection with multiple heuristics
 * 
 * Detection Heuristics:
 * - UTC timezone (Tor forces UTC)
 * - Hardware concurrency = 2 (Tor default)
 * - Standard screen letterboxing dimensions
 * - Empty plugins array
 * - Single en-US language
 * - Platform/dimension mismatches
 */

/**
 * Enhanced Tor Browser detection with multiple heuristics
 * @returns {Object} Tor detection result
 */
export function testTorBrowser() {
  const indicators = [];
  let score = 0;

  // Timezone check (Tor uses UTC)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzOffset = new Date().getTimezoneOffset();
  if (tz === 'UTC' || tz === 'Etc/UTC' || tzOffset === 0) {
    indicators.push('UTC timezone');
    score += 20;
  }

  // Hardware concurrency (Tor reports 2)
  if (navigator.hardwareConcurrency === 2) {
    indicators.push('2 CPU cores reported');
    score += 15;
  }

  // Screen dimensions (Tor uses standard letterboxing)
  const torWidths = [1000, 1200, 1400, 1600];
  const torHeights = [900, 1000];
  if (torWidths.includes(screen.width) || torHeights.includes(screen.height)) {
    indicators.push('Tor-like screen dimensions');
    score += 20;
  }

  // Exact Tor dimensions
  if (screen.width === 1000 && screen.height === 1000) {
    indicators.push('Exact Tor dimensions (1000x1000)');
    score += 25;
  }

  // Plugins array empty (Tor hides plugins)
  if (navigator.plugins.length === 0) {
    indicators.push('No plugins detected');
    score += 20;
  }

  // Languages check (Tor often reports en-US only)
  if (navigator.languages?.length === 1 && navigator.languages[0] === 'en-US') {
    indicators.push('Single en-US language');
    score += 10;
  }

  // Platform mismatch detection
  const platform = navigator.platform;
  if (platform === 'Win32' && screen.width === 1000) {
    indicators.push('Platform/dimension mismatch');
    score += 15;
  }

  const isLikely = score >= 50;
  const isDefinite = score >= 80;

  return {
    triggered: isLikely,
    isDefinite,
    score,
    indicators,
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

  return { signals, score, triggered: score > 0 };
}
