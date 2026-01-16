/**
 * Privacy Mode Detection Module (Incognito / Tor / Privacy Browsers)
 * Enhanced with state-of-the-art detection and weighted confidence scoring
 * 
 * This module orchestrates detection from sub-modules:
 * - incognito.js: Private browsing mode detection tests
 * - tor.js: Tor Browser and privacy browser detection
 * - extensions.js: Privacy extension detection (ad blockers, etc.)
 * - suggestions.js: Personalized privacy recommendations
 */

import { detectPrivacyExtensions } from './extensions.js';
import {
  detectIncognitoMode,
  testQuotaHeapRatio,
  testIndexedDB,
  testServiceWorker,
  testFileSystem,
  testSafariLocalStorage,
  testCacheAPI,
  testCredentialManagement,
  testStorageQuota,
  testStoragePersist,
  testTrackingProtection,
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
// DETECTION WEIGHTS BY BROWSER
// ============================================================

const DETECTION_WEIGHTS = {
  chromium: {
    quotaHeapRatio: { weight: 40, reliability: 'HIGH' },
    fileSystemAPI: { weight: 35, reliability: 'HIGH' },
    storageQuota: { weight: 15, reliability: 'MEDIUM' },
    serviceWorker: { weight: 10, reliability: 'LOW' },
    credentialManagement: { weight: 20, reliability: 'MEDIUM' },
    indexedDB: { weight: 25, reliability: 'MEDIUM' },
  },
  gecko: {
    indexedDB: { weight: 45, reliability: 'HIGH' },
    cacheAPI: { weight: 35, reliability: 'HIGH' },
    storageQuota: { weight: 15, reliability: 'MEDIUM' },
    serviceWorker: { weight: 15, reliability: 'MEDIUM' },
  },
  webkit: {
    localStorageException: { weight: 50, reliability: 'HIGH' },
    storageQuota: { weight: 25, reliability: 'MEDIUM' },
    indexedDB: { weight: 20, reliability: 'MEDIUM' },
  },
  tor: {
    timezone: { weight: 20, reliability: 'MEDIUM' },
    screenDimensions: { weight: 25, reliability: 'HIGH' },
    hardwareConcurrency: { weight: 15, reliability: 'MEDIUM' },
    pluginsEmpty: { weight: 20, reliability: 'HIGH' },
    webglRenderer: { weight: 15, reliability: 'MEDIUM' },
    languageCheck: { weight: 10, reliability: 'LOW' },
  },
};

// ============================================================
// MAIN DETECTION FUNCTION
// ============================================================

/**
 * Detects privacy mode with weighted confidence scoring
 * @returns {Promise<Object>} Comprehensive privacy detection results
 */
export async function detectPrivacyMode() {
  const browserInfo = detectBrowser();
  const findings = [];
  const detectionResults = {};
  let totalScore = 0;
  let maxPossibleScore = 0;
  let highConfidenceMatches = 0;
  let totalHighConfidenceTests = 0;

  // Get appropriate weights for this browser
  const weights = DETECTION_WEIGHTS[browserInfo.engine] || DETECTION_WEIGHTS.chromium;

  // Run all detection tests in parallel
  const [
    incognitoResult, // Primary detection - browser-specific
    quotaHeapResult,
    idbResult,
    swResult,
    fsResult,
    cacheResult,
    credResult,
    quotaResult,
    extensionResult,
    persistResult,
    trackingResult,
  ] = await Promise.all([
    detectIncognitoMode(), // Primary: reliable browser-specific detection
    testQuotaHeapRatio(),
    testIndexedDB(),
    testServiceWorker(),
    testFileSystem(),
    testCacheAPI(),
    testCredentialManagement(),
    testStorageQuota(),
    detectPrivacyExtensions(),
    testStoragePersist(),
    testTrackingProtection(),
  ]);

  // Synchronous tests
  const safariResult = testSafariLocalStorage();
  const torResult = testTorBrowser();
  const braveResult = await detectBrave();
  const privacySignals = checkPrivacySignals();

  // Primary incognito detection (most reliable)
  if (incognitoResult.isPrivate) {
    totalScore += 50;
    highConfidenceMatches++;
    totalHighConfidenceTests++;
    findings.push(incognitoResult.reason || `${incognitoResult.browserName} Private Mode detected`);
  }

  // Add extension detection to score and findings
  if (extensionResult.hasExtensions) {
    totalScore += extensionResult.score;
    findings.push(...extensionResult.detected);
  }

  // Firefox-specific: Tracking Protection / ETP detection
  if (trackingResult.triggered) {
    totalScore += 20;
    findings.push(trackingResult.reason);
    if (browserInfo.engine === 'gecko') {
      highConfidenceMatches++;
      totalHighConfidenceTests++;
    }
  }

  // Firefox-specific: Storage persist rejection
  if (persistResult.triggered) {
    totalScore += 15;
    findings.push(persistResult.reason);
  }

  // Process Chromium-specific: Quota/Heap Ratio
  if (weights.quotaHeapRatio && quotaHeapResult.available) {
    maxPossibleScore += weights.quotaHeapRatio.weight;
    if (weights.quotaHeapRatio.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (quotaHeapResult.triggered) {
      totalScore += weights.quotaHeapRatio.weight;
      findings.push(quotaHeapResult.reason);
      detectionResults.quotaHeapRatio = { ...quotaHeapResult, weight: weights.quotaHeapRatio.weight };
      if (weights.quotaHeapRatio.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // IndexedDB
  if (weights.indexedDB) {
    maxPossibleScore += weights.indexedDB.weight;
    if (weights.indexedDB.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (idbResult.triggered) {
      totalScore += weights.indexedDB.weight;
      findings.push(idbResult.reason);
      detectionResults.indexedDB = { ...idbResult, weight: weights.indexedDB.weight };
      if (weights.indexedDB.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // ServiceWorker
  if (weights.serviceWorker && swResult.supported) {
    maxPossibleScore += weights.serviceWorker.weight;
    if (weights.serviceWorker.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (swResult.triggered) {
      totalScore += weights.serviceWorker.weight;
      findings.push(swResult.reason);
      detectionResults.serviceWorker = { ...swResult, weight: weights.serviceWorker.weight };
      if (weights.serviceWorker.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // FileSystem API (Chromium)
  if (weights.fileSystemAPI && fsResult.supported) {
    maxPossibleScore += weights.fileSystemAPI.weight;
    if (weights.fileSystemAPI.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (fsResult.triggered) {
      totalScore += weights.fileSystemAPI.weight;
      findings.push(fsResult.reason);
      detectionResults.fileSystemAPI = { ...fsResult, weight: weights.fileSystemAPI.weight };
      if (weights.fileSystemAPI.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // Safari localStorage
  if (weights.localStorageException) {
    maxPossibleScore += weights.localStorageException.weight;
    if (weights.localStorageException.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (safariResult.triggered) {
      totalScore += weights.localStorageException.weight;
      findings.push(safariResult.reason);
      detectionResults.localStorageException = { ...safariResult, weight: weights.localStorageException.weight };
      if (weights.localStorageException.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // Cache API (Firefox)
  if (weights.cacheAPI && cacheResult.supported) {
    maxPossibleScore += weights.cacheAPI.weight;
    if (weights.cacheAPI.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (cacheResult.triggered) {
      totalScore += weights.cacheAPI.weight;
      findings.push(cacheResult.reason);
      detectionResults.cacheAPI = { ...cacheResult, weight: weights.cacheAPI.weight };
      if (weights.cacheAPI.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // Credential Management
  if (weights.credentialManagement && credResult.supported) {
    maxPossibleScore += weights.credentialManagement.weight;
    if (weights.credentialManagement.reliability === 'HIGH') { totalHighConfidenceTests++; }
    
    if (credResult.triggered) {
      totalScore += weights.credentialManagement.weight;
      findings.push(credResult.reason);
      detectionResults.credentialManagement = { ...credResult, weight: weights.credentialManagement.weight };
      if (weights.credentialManagement.reliability === 'HIGH') { highConfidenceMatches++; }
    }
  }

  // Storage Quota
  if (weights.storageQuota && quotaResult.available) {
    maxPossibleScore += weights.storageQuota.weight;
    
    if (quotaResult.triggered && !quotaResult.weak) {
      totalScore += weights.storageQuota.weight;
      findings.push(quotaResult.reason);
      detectionResults.storageQuota = { ...quotaResult, weight: weights.storageQuota.weight };
    }
  }

  // Privacy signals
  if (privacySignals.triggered) {
    totalScore += privacySignals.score;
    findings.push(...privacySignals.signals);
  }

  // Tor Browser detection
  let isTor = false;
  if (torResult.triggered) {
    totalScore += torResult.score;
    findings.push(...torResult.indicators);
    if (torResult.isDefinite) {
      isTor = true;
    }
  }

  // Calculate normalized score (0-100)
  const normalizedScore = Math.min(100, Math.round((totalScore / Math.max(maxPossibleScore, 1)) * 100));
  
  // Determine confidence level
  let confidence = 'LOW';
  if (highConfidenceMatches >= 2 || (highConfidenceMatches === 1 && totalHighConfidenceTests === 1)) {
    confidence = 'HIGH';
  } else if (highConfidenceMatches === 1 || findings.length >= 3) {
    confidence = 'MEDIUM';
  }

  // Determine status
  let status = 'Standard Mode';
  let warning = false;

  if (isTor) {
    status = 'Tor Browser Detected';
    warning = true;
    confidence = 'HIGH';
  } else if (normalizedScore >= 60) {
    status = 'Private / Incognito Detected';
    warning = true;
  } else if (normalizedScore >= 35) {
    status = 'Privacy-Enhanced Mode';
    warning = true;
  } else if (normalizedScore >= 15) {
    status = 'Some Privacy Features Active';
  }

  // Determine if in incognito/private mode based on primary detection
  const isIncognito = incognitoResult.isPrivate || normalizedScore >= 60;
  const hasGPC = navigator.globalPrivacyControl === true;
  const hasDNT = navigator.doNotTrack === '1';

  // Generate personalized suggestions based on detected state
  const personalizedSuggestions = generatePersonalizedSuggestions({
    isTor,
    isBrave: braveResult.detected,
    isIncognito,
    hasGPC,
    hasDNT,
    browserInfo,
    normalizedScore,
    isVPNDetected: false, // Would need network module integration for true detection
    hasPrivacyExtensions: extensionResult.hasExtensions,
    extensionCount: extensionResult.count,
  });

  // Build result object with enhancement suggestions placed after Privacy Score
  const result = {
    'Browsing Mode': { value: status, warning },
    'Privacy Score': `${normalizedScore}/100`,
    'Privacy Recommendations': {
      value: 'View Privacy Recommendations',
      interactive: true,
      suggestions: personalizedSuggestions,
    },
    'Detection Confidence': `${confidence} (${highConfidenceMatches}/${totalHighConfidenceTests} strong indicators)`,
    'Browser Profile': browserInfo.name,
    'IndexedDB': idbResult.available ? 'Available' : 'Blocked',
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
    'Global Privacy Control': navigator.globalPrivacyControl ? 'Enabled' : 'Not Set',
    'Do Not Track': navigator.doNotTrack === '1' ? 'Enabled' : 'Disabled',
  };

  // Add privacy indicators if found
  if (findings.length > 0) {
    result['Privacy Indicators'] = { value: findings.slice(0, 5).join(', '), warning: true };
    if (findings.length > 5) {
      result['Additional Indicators'] = `+${findings.length - 5} more`;
    }
  } else {
    result['Privacy Indicators'] = 'None detected';
  }

  // Brave Browser
  if (braveResult.detected) {
    result['Brave Browser'] = 'Detected';
  }

  // Privacy Extensions
  if (extensionResult.hasExtensions) {
    result['Privacy Extensions'] = { 
      value: `Detected (${extensionResult.count} feature${extensionResult.count > 1 ? 's' : ''})`, 
      warning: false,
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
