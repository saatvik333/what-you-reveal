/**
 * Privacy Mode Detection Module (Incognito / Tor / Privacy Browsers)
 * Enhanced with IndexedDB, ServiceWorker, and FileSystem API checks
 */

/**
 * Tests IndexedDB quota (often limited in incognito)
 * @returns {Promise<Object>} IndexedDB status
 */
async function testIndexedDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('fingerprint_test', 1);

      request.onerror = () => {
        resolve({ available: false, reason: 'Blocked' });
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        db.close();
        indexedDB.deleteDatabase('fingerprint_test');
        resolve({ available: true });
      };

      // Timeout
      setTimeout(() => {
        resolve({ available: 'Timeout' });
      }, 1000);
    } catch (e) {
      resolve({ available: false, reason: e.message });
    }
  });
}

/**
 * Tests ServiceWorker availability (often disabled in incognito)
 * @returns {Promise<Object>} ServiceWorker status
 */
async function testServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) {
      return { supported: false };
    }

    // In incognito, registration often fails or is limited
    const registrations = await navigator.serviceWorker.getRegistrations();
    return {
      supported: true,
      registrations: registrations.length,
      // Can't register in incognito on some browsers
      likelyIncognito: false,
    };
  } catch (e) {
    return { supported: true, error: e.message, likelyIncognito: true };
  }
}

/**
 * Tests FileSystem API (Chrome blocks in incognito)
 * @returns {Promise<Object>} FileSystem status
 */
async function testFileSystem() {
  return new Promise((resolve) => {
    try {
      if (!window.webkitRequestFileSystem && !window.requestFileSystem) {
        resolve({ supported: false });
        return;
      }

      const requestFS = window.webkitRequestFileSystem || window.requestFileSystem;

      requestFS(
        window.TEMPORARY,
        1024 * 1024, // 1MB
        () => {
          resolve({ supported: true, available: true });
        },
        () => {
          // Error = likely incognito
          resolve({ supported: true, available: false, likelyIncognito: true });
        },
      );

      // Timeout
      setTimeout(() => {
        resolve({ supported: true, available: 'Timeout' });
      }, 1000);
    } catch (e) {
      resolve({ supported: false, error: e.message });
    }
  });
}

/**
 * Tests for Firefox-specific private browsing indicators
 * @returns {Promise<boolean>} True if likely Firefox private
 */
async function testFirefoxPrivate() {
  return new Promise((resolve) => {
    try {
      const db = indexedDB.open('test');
      db.onerror = () => resolve(true); // Firefox private mode blocks IDB
      db.onsuccess = () => {
        db.result.close();
        indexedDB.deleteDatabase('test');
        resolve(false);
      };

      setTimeout(() => resolve(false), 500);
    } catch (e) {
      resolve(true);
    }
  });
}

/**
 * Detects Brave browser's privacy features
 * @returns {Object} Brave detection result
 */
function detectBrave() {
  try {
    // Brave exposes navigator.brave
    if (navigator.brave && navigator.brave.isBrave) {
      return { detected: true, confirmed: true };
    }

    // Fallback heuristics
    // Brave blocks some APIs
    return { detected: false };
  } catch (e) {
    return { detected: false };
  }
}

/**
 * Attempts to detect if the user is in Incognito / Private Browsing mode
 * or using privacy-focused browsers like Tor or Brave.
 */
export async function detectPrivacyMode() {
  const findings = [];
  let score = 0;

  // 1. Storage Quota Check
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      const quotaMB = quota / (1024 * 1024);

      if (quotaMB < 120) {
        findings.push(`Very Low Storage Quota (${quotaMB.toFixed(0)}MB)`);
        score += 50;
      } else if (quotaMB < 500) {
        findings.push(`Low Storage Quota (${quotaMB.toFixed(0)}MB)`);
        score += 25;
      }
    } catch (e) {
      findings.push('Storage API blocked');
      score += 20;
    }
  }

  // 2. IndexedDB Test
  const idbResult = await testIndexedDB();
  if (!idbResult.available) {
    findings.push('IndexedDB blocked');
    score += 40;
  }

  // 3. ServiceWorker Test
  const swResult = await testServiceWorker();
  if (swResult.likelyIncognito) {
    findings.push('ServiceWorker restricted');
    score += 30;
  }

  // 4. FileSystem API Test (Chrome specific)
  const fsResult = await testFileSystem();
  if (fsResult.supported && fsResult.likelyIncognito) {
    findings.push('FileSystem API blocked (Chrome Incognito indicator)');
    score += 50;
  }

  // 5. Firefox Private Mode Check
  const firefoxPrivate = await testFirefoxPrivate();
  if (firefoxPrivate) {
    findings.push('Firefox Private Browsing detected');
    score += 50;
  }

  // 6. Tor Browser Detection
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isLikelyTor =
    (tz === 'UTC' || tz === 'Etc/UTC') &&
    navigator.hardwareConcurrency === 2 &&
    screen.width === 1000 &&
    screen.height === 1000;

  if (isLikelyTor) {
    findings.push('Tor Browser profile detected');
    score += 80;
  } else if (tz === 'UTC' && navigator.hardwareConcurrency === 2) {
    findings.push('Possible Tor-like fingerprint (UTC + 2 cores)');
    score += 30;
  }

  // 7. Brave Browser Detection
  const braveResult = detectBrave();
  if (braveResult.detected) {
    findings.push('Brave Browser detected (privacy shields active)');
    score += 20; // Not incognito but privacy-focused
  }

  // 8. Check for hidden deviceMemory (privacy feature)
  if (!('deviceMemory' in navigator)) {
    findings.push('deviceMemory hidden');
    score += 10;
  }

  // 9. Check for navigator.globalPrivacyControl (new privacy signal)
  if (navigator.globalPrivacyControl === true) {
    findings.push('Global Privacy Control enabled');
    score += 15;
  }

  // 10. Check for Do Not Track
  if (navigator.doNotTrack === '1') {
    findings.push('Do Not Track enabled');
    score += 5;
  }

  // Result Interpretation
  let status = 'Standard Mode';
  let warning = false;

  if (score >= 60) {
    status = 'Private / Incognito Detected';
    warning = true;
  } else if (score >= 30) {
    status = 'Privacy-Enhanced Mode';
    warning = true;
  } else if (score >= 15) {
    status = 'Some Privacy Features Active';
  }

  // Tor override
  if (isLikelyTor) {
    status = 'Tor Browser Detected';
    warning = true;
  }

  const result = {
    'Browsing Mode': { value: status, warning: warning },
    'Privacy Score': score + '/100',
    IndexedDB: idbResult.available ? 'Available' : 'Blocked',
    ServiceWorker: swResult.supported
      ? swResult.error
        ? 'Limited'
        : 'Available'
      : 'Not Supported',
    'FileSystem API': fsResult.supported
      ? fsResult.available
        ? 'Available'
        : 'Blocked'
      : 'Not Supported',
    'Global Privacy Control': navigator.globalPrivacyControl ? 'Enabled' : 'Not Set',
    'Do Not Track': navigator.doNotTrack === '1' ? 'Enabled' : 'Disabled',
  };

  if (findings.length > 0) {
    result['Privacy Indicators'] = { value: findings.join(', '), warning: true };
  } else {
    result['Privacy Indicators'] = 'None detected';
  }

  if (braveResult.detected) {
    result['Brave Browser'] = 'Detected';
  }

  // 11. Storage Access API (Third-party cookie partitioning)
  if ('hasStorageAccess' in document) {
    try {
      const hasAccess = await document.hasStorageAccess();
      result['Storage Access API'] = 'Supported';
      result['Has Storage Access'] = hasAccess ? 'Yes' : 'No (Partitioned)';
    } catch (e) {
      result['Storage Access API'] = 'Error';
    }
  } else {
    result['Storage Access API'] = 'Not Supported';
  }

  // 12. Topics API (Privacy Sandbox)
  if ('browsingTopics' in document) {
    result['Topics API (Privacy Sandbox)'] = 'Supported';
  } else {
    result['Topics API'] = 'Not Available';
  }

  // 13. Attribution Reporting API
  if ('attributionReporting' in window) {
    result['Attribution Reporting API'] = 'Supported';
  }

  // 14. Shared Storage API (Privacy Sandbox)
  if ('sharedStorage' in window) {
    result['Shared Storage API'] = 'Supported';
  }

  // 15. Fenced Frames (Privacy Sandbox)
  if (typeof HTMLFencedFrameElement !== 'undefined') {
    result['Fenced Frames API'] = 'Supported';
  }

  return result;
}

