/**
 * Privacy Mode Detection Module (Incognito / Tor / Privacy Browsers)
 * 
 * NEW ARCHITECTURE: Multi-dimensional privacy analysis
 * 
 * This module provides SEPARATE metrics for:
 * 1. Incognito Detection - Binary YES/NO with confidence level
 * 2. Privacy Protection Score - Based on extensions, signals, protections
 * 3. Anonymity Indicators - VPN, Tor, Proxy detection
 * 4. Fingerprint Resistance - API protection levels
 * 
 * This replaces the old conflated single-score system that caused
 * false positives (e.g., Privacy Badger triggering "incognito detected").
 */

import { detectPrivacyExtensions } from './extensions.js';
import {
  detectIncognitoMode,
  testServiceWorker,
  testFileSystem,
  testCacheAPI,
  testStorageQuota,
} from './incognito.js';
import { testTorBrowser, detectBrave, checkPrivacySignals } from './tor.js';
import { generatePersonalizedSuggestions } from './suggestions.js';

// ============================================================
// BROWSER DETECTION
// ============================================================

/**
 * Detect browser engine and type
 * @returns {Object} Browser detection result
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  
  // Brave detection
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    return { engine: 'chromium', browser: 'brave', name: 'Brave' };
  }
  
  // Safari detection (must come before Chrome check)
  if (/Safari/.test(ua) && /Apple Computer/.test(vendor) && !/Chrome/.test(ua)) {
    return { engine: 'webkit', browser: 'safari', name: 'Safari' };
  }
  
  // Firefox detection
  if (/Firefox/.test(ua)) {
    return { engine: 'gecko', browser: 'firefox', name: 'Firefox' };
  }
  
  // Chrome/Chromium detection
  if (/Chrome/.test(ua)) {
    if (/Edg/.test(ua)) {
      return { engine: 'chromium', browser: 'edge', name: 'Edge' };
    }
    if (/OPR/.test(ua)) {
      return { engine: 'chromium', browser: 'opera', name: 'Opera' };
    }
    return { engine: 'chromium', browser: 'chrome', name: 'Chrome' };
  }
  
  return { engine: 'unknown', browser: 'unknown', name: 'Unknown' };
}

// ============================================================
// PRIVACY PROTECTION SCORE WEIGHTS
// ============================================================

const PROTECTION_WEIGHTS = {
  // Extensions (max 40 points)
  adBlocker: 20,
  canvasProtection: 10,
  webrtcProtection: 10,
  
  // Browser Signals (max 20 points)
  globalPrivacyControl: 15,
  doNotTrack: 5,
  
  // Incognito Mode (max 20 points)
  incognitoMode: 20,
  
  // Fingerprint Protection (max 20 points)
  canvasNoise: 10,
  webglBlocked: 5,
  audioBlocked: 5,
};

// ============================================================
// INCOGNITO CONFIDENCE CALCULATION
// ============================================================

/**
 * Determine incognito confidence based on detection results
 * @param {Object} incognitoResult - Result from detectIncognitoMode()
 * @param {Object} extensionResult - Result from detectPrivacyExtensions()
 * @returns {string} Confidence level
 */
function calculateIncognitoConfidence(incognitoResult, extensionResult) {
  if (!incognitoResult.isPrivate) {
    return 'NONE';
  }
  
  // If extensions are heavily present, they might be causing false positives
  // Reduce confidence if we detect many privacy extensions
  const extensionInterference = extensionResult.hasExtensions && extensionResult.count >= 2;
  
  // Check the detection method reliability
  const reliableMethods = ['opfs', 'webkitTemporaryStorage', 'indexeddb-blob'];
  const methodIsReliable = reliableMethods.includes(incognitoResult.method);
  
  // If quota-based detection with possible extension interference, be cautious
  if (incognitoResult.method === 'webkitTemporaryStorage' && extensionInterference) {
    // Check if quota is VERY low (true incognito) vs just somewhat low (extension)
    // True incognito typically has <150MB quota
    if (incognitoResult.quotaMB && incognitoResult.quotaMB < 150) {
      return 'HIGH';
    }
    return 'LOW'; // Possible false positive from extension
  }
  
  if (methodIsReliable) {
    return 'HIGH';
  }
  
  return 'MEDIUM';
}

// ============================================================
// PRIVACY PROTECTION SCORE CALCULATION
// ============================================================

/**
 * Calculate privacy protection score based on detected protections
 * This is SEPARATE from incognito detection
 * @param {Object} params - Detection results
 * @returns {Object} Score breakdown
 */
function calculatePrivacyProtectionScore({
  incognitoResult,
  extensionResult,
  hasGPC,
  hasDNT,
}) {
  let score = 0;
  const breakdown = [];
  
  // Extensions contribution (max 40 points)
  if (extensionResult.hasExtensions) {
    if (extensionResult.details.baitBlocked || extensionResult.details.networkBlocked) {
      score += PROTECTION_WEIGHTS.adBlocker;
      breakdown.push({ name: 'Ad Blocker', points: PROTECTION_WEIGHTS.adBlocker });
    }
    if (extensionResult.details.canvasProtection) {
      score += PROTECTION_WEIGHTS.canvasProtection;
      breakdown.push({ name: 'Canvas Protection', points: PROTECTION_WEIGHTS.canvasProtection });
    }
    if (extensionResult.details.webrtcProtection) {
      score += PROTECTION_WEIGHTS.webrtcProtection;
      breakdown.push({ name: 'WebRTC Protection', points: PROTECTION_WEIGHTS.webrtcProtection });
    }
  }
  
  // Browser Signals contribution (max 20 points)
  if (hasGPC) {
    score += PROTECTION_WEIGHTS.globalPrivacyControl;
    breakdown.push({ name: 'Global Privacy Control', points: PROTECTION_WEIGHTS.globalPrivacyControl });
  }
  if (hasDNT) {
    score += PROTECTION_WEIGHTS.doNotTrack;
    breakdown.push({ name: 'Do Not Track', points: PROTECTION_WEIGHTS.doNotTrack });
  }
  
  // Incognito Mode contribution (max 20 points)
  // Only add if we're CONFIDENT it's incognito (not a false positive)
  if (incognitoResult.isPrivate && incognitoResult.confidence === 'HIGH') {
    score += PROTECTION_WEIGHTS.incognitoMode;
    breakdown.push({ name: 'Private Browsing Mode', points: PROTECTION_WEIGHTS.incognitoMode });
  }
  
  return {
    score: Math.min(100, score),
    maxScore: 100,
    breakdown,
  };
}

// ============================================================
// MAIN DETECTION FUNCTION
// ============================================================

/**
 * Detects privacy mode with MULTI-DIMENSIONAL analysis
 * Returns separate metrics for incognito, protection score, anonymity, etc.
 * @param {Object} options - Optional configuration
 * @param {boolean} options.vpnDetected - VPN detection result from network module
 * @returns {Promise<Object>} Comprehensive privacy detection results
 */
export async function detectPrivacyMode(options = {}) {
  const browserInfo = detectBrowser();
  const { vpnDetected = false } = options;

  // Run all detection tests in parallel
  const [
    incognitoResult,
    extensionResult,
    swResult,
    fsResult,
    cacheResult,
    quotaResult,
  ] = await Promise.all([
    detectIncognitoMode(),
    detectPrivacyExtensions(),
    testServiceWorker(),
    testFileSystem(),
    testCacheAPI(),
    testStorageQuota(),
  ]);

  // Synchronous tests
  const torResult = testTorBrowser();
  const braveResult = await detectBrave();
  const privacySignals = checkPrivacySignals();
  
  // Browser signals
  const hasGPC = navigator.globalPrivacyControl === true;
  const hasDNT = navigator.doNotTrack === '1';

  // ============================================================
  // SECTION 1: INCOGNITO DETECTION (Binary + Confidence)
  // ============================================================
  
  // Add confidence to incognito result
  const incognitoConfidence = calculateIncognitoConfidence(incognitoResult, extensionResult);
  const incognitoData = {
    detected: incognitoResult.isPrivate && incognitoConfidence !== 'LOW',
    confidence: incognitoConfidence,
    method: incognitoResult.method || 'unknown',
    browserName: incognitoResult.browserName,
    rawResult: incognitoResult, // For debugging
  };

  // ============================================================
  // SECTION 2: PRIVACY PROTECTION SCORE (0-100)
  // ============================================================
  
  const protectionScore = calculatePrivacyProtectionScore({
    incognitoResult: { ...incognitoResult, confidence: incognitoConfidence },
    extensionResult,
    hasGPC,
    hasDNT,
  });

  // ============================================================
  // SECTION 3: ANONYMITY INDICATORS
  // ============================================================
  
  const anonymityData = {
    vpn: {
      detected: vpnDetected,
      source: vpnDetected ? 'network-api' : null,
    },
    tor: {
      detected: torResult.isDefinite || false,
      likely: torResult.triggered || false,
      confidence: torResult.score || 0,
      indicators: torResult.indicators || [],
    },
    proxy: {
      detected: false, // Would need network module integration
    },
  };

  // ============================================================
  // SECTION 4: FINGERPRINT RESISTANCE
  // ============================================================
  
  const protectedAPIs = [];
  if (extensionResult.details?.canvasProtection) protectedAPIs.push('Canvas');
  if (extensionResult.details?.webrtcProtection) protectedAPIs.push('WebRTC');
  if (!fsResult.available && fsResult.supported) protectedAPIs.push('FileSystem');
  if (!cacheResult.available && cacheResult.supported) protectedAPIs.push('Cache API');
  
  let resistanceLevel = 'LOW';
  if (protectedAPIs.length >= 3 || torResult.isDefinite) {
    resistanceLevel = 'HIGH';
  } else if (protectedAPIs.length >= 1 || extensionResult.hasExtensions) {
    resistanceLevel = 'MEDIUM';
  }
  
  const fingerprintResistance = {
    level: resistanceLevel,
    protectedAPIs,
    spoofingDetected: extensionResult.details?.canvasProtection || false,
  };

  // ============================================================
  // SECTION 5: GENERATE SUGGESTIONS
  // ============================================================
  
  const personalizedSuggestions = generatePersonalizedSuggestions({
    isTor: anonymityData.tor.detected,
    isBrave: braveResult.detected,
    isIncognito: incognitoData.detected,
    hasGPC,
    hasDNT,
    browserInfo,
    protectionScore: protectionScore.score,
    isVPNDetected: vpnDetected,
    hasPrivacyExtensions: extensionResult.hasExtensions,
    extensionCount: extensionResult.count,
  });

  // ============================================================
  // BUILD OUTPUT FOR UI
  // ============================================================
  
  // Determine overall status label
  let browsingModeLabel = 'Standard Browsing';
  let browsingModeWarning = false;
  
  if (anonymityData.tor.detected) {
    browsingModeLabel = 'Tor Browser';
    browsingModeWarning = true;
  } else if (incognitoData.detected && incognitoData.confidence === 'HIGH') {
    browsingModeLabel = `${incognitoData.browserName} Private Mode`;
    browsingModeWarning = true;
  } else if (incognitoData.detected && incognitoData.confidence === 'MEDIUM') {
    browsingModeLabel = 'Likely Private Mode';
    browsingModeWarning = true;
  } else if (protectionScore.score >= 50) {
    browsingModeLabel = 'Privacy-Enhanced Browsing';
  }

  const result = {
    // Header section
    'Browsing Mode': { value: browsingModeLabel, warning: browsingModeWarning },
    'Browser': browserInfo.name,
    
    // Incognito Section
    '── INCOGNITO DETECTION ──': '',
    'Private Mode': incognitoData.detected 
      ? { value: 'DETECTED', warning: true }
      : 'Not Detected',
    'Detection Confidence': incognitoData.detected 
      ? incognitoData.confidence
      : 'N/A',
    'Detection Method': incognitoData.detected 
      ? incognitoData.method
      : 'N/A',
    
    // Privacy Protection Section
    '── PRIVACY PROTECTION ──': '',
    'Protection Score': `${protectionScore.score}/100`,
    'Score Breakdown': protectionScore.breakdown.length > 0
      ? protectionScore.breakdown.map(b => `${b.name} (+${b.points})`).join(', ')
      : 'No active protections detected',
    
    // Privacy Signals
    'Global Privacy Control': hasGPC ? { value: 'Enabled', warning: false } : 'Disabled',
    'Do Not Track': hasDNT ? 'Enabled' : 'Disabled',
    
    // Extensions
    'Privacy Extensions': extensionResult.hasExtensions 
      ? { value: `Detected (${extensionResult.count} feature${extensionResult.count > 1 ? 's' : ''})`, warning: false }
      : 'None Detected',
    
    // Anonymity Section
    '── ANONYMITY ──': '',
    'VPN/Proxy': anonymityData.vpn.detected 
      ? { value: 'Detected', warning: true }
      : 'Not Detected',
    'Tor Browser': anonymityData.tor.detected 
      ? { value: 'DETECTED', warning: true }
      : anonymityData.tor.likely 
        ? { value: `Possible (${anonymityData.tor.confidence}% confidence)`, warning: true }
        : 'Not Detected',
    
    // Fingerprint Resistance Section
    '── FINGERPRINT RESISTANCE ──': '',
    'Resistance Level': resistanceLevel === 'HIGH' 
      ? { value: 'HIGH', warning: false }
      : resistanceLevel,
    'Protected APIs': protectedAPIs.length > 0 
      ? protectedAPIs.join(', ')
      : 'None',
    
    // Recommendations
    'Privacy Recommendations': {
      value: 'View Recommendations',
      interactive: true,
      suggestions: personalizedSuggestions,
    },
    
    // API Status (detailed)
    '── API STATUS ──': '',
    'IndexedDB': incognitoResult.available !== false ? 'Available' : 'Blocked',
    'ServiceWorker': swResult.supported
      ? swResult.triggered
        ? 'Restricted'
        : 'Available'
      : 'Not Supported',
    'FileSystem API': fsResult.supported
      ? fsResult.available
        ? 'Available'
        : 'Blocked'
      : 'Not Supported',
    'Cache API': cacheResult.supported
      ? cacheResult.available
        ? 'Available'
        : 'Restricted'
      : 'Not Supported',
  };

  // Add Brave Browser indicator if detected
  if (braveResult.detected) {
    result['Brave Browser'] = { value: 'Detected', warning: false };
  }

  // Add Tor indicators if detected
  if (anonymityData.tor.likely && anonymityData.tor.indicators.length > 0) {
    result['Tor Indicators'] = { 
      value: anonymityData.tor.indicators.slice(0, 3).join(', '),
      warning: true,
    };
  }

  // Storage Access API
  if ('hasStorageAccess' in document) {
    try {
      const hasAccess = await document.hasStorageAccess();
      result['Storage Access'] = hasAccess ? 'Granted' : 'Partitioned';
    } catch (e) {
      result['Storage Access'] = 'Error';
    }
  }

  // Privacy Sandbox APIs
  if ('browsingTopics' in document) {
    result['Topics API'] = 'Supported';
  }
  if ('sharedStorage' in window) {
    result['Shared Storage'] = 'Supported';
  }

  return result;
}
