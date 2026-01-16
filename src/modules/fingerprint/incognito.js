/**
 * Incognito/Private Mode Detection Module
 * Based on detectIncognito library techniques (MIT License)
 * https://github.com/Joe12387/detectIncognito
 * 
 * Detection Techniques:
 * - Firefox: navigator.storage.getDirectory() "Security error"
 * - Chrome: webkitTemporaryStorage quota check
 * - Safari: storage.getDirectory() "unknown transient reason"
 * - Fallback: IndexedDB, FileSystem API, localStorage
 */

/**
 * Identifies browser engine using toFixed error message length
 * This is a reliable cross-browser detection method
 * @returns {Object} Browser identification
 */
function identifyBrowserEngine() {
  let toFixedEngineID = 0;
  try {
    const neg = parseInt('-1');
    neg.toFixed(neg);
  } catch (e) {
    toFixedEngineID = e.message.length;
  }

  // Engine identification by error message length
  const isSafari = toFixedEngineID === 44 || toFixedEngineID === 43;
  const isChrome = toFixedEngineID === 51;
  const isFirefox = toFixedEngineID === 25;

  return { isSafari, isChrome, isFirefox, engineId: toFixedEngineID };
}

/**
 * Firefox Private Mode Detection
 * Uses navigator.storage.getDirectory() which throws "Security error" in private mode
 * @returns {Promise<Object>} Firefox detection result
 */
export async function testFirefoxPrivate() {
  const { isFirefox } = identifyBrowserEngine();
  
  if (!isFirefox) {
    return { triggered: false, available: false, supported: false, engine: 'not-firefox' };
  }

  // Modern Firefox (with OPFS support)
  if (typeof navigator.storage?.getDirectory === 'function') {
    try {
      await navigator.storage.getDirectory();
      return { triggered: false, available: true, supported: true, method: 'opfs' };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const errorName = e instanceof Error ? e.name : '';
      
      // Firefox private mode throws SecurityError when accessing OPFS
      // Check both error name and message for various Firefox versions
      const isPrivate = 
        errorName === 'SecurityError' ||
        message.includes('Security') ||
        message.includes('security') ||
        message.includes('not allowed') ||
        message.includes('denied');
      
      return { 
        triggered: isPrivate, 
        available: !isPrivate,
        supported: true,
        method: 'opfs',
        reason: isPrivate ? 'Firefox Private Browsing detected (OPFS blocked)' : null,
        error: message,
        errorName,
      };
    }
  }

  // Older Firefox (IndexedDB InvalidStateError)
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('firefoxPrivateTest');

      request.onerror = (event) => {
        const errorName = request.error?.name || '';
        // Firefox private mode throws InvalidStateError or other errors
        if (errorName === 'InvalidStateError' || errorName === 'SecurityError') {
          event.preventDefault();
          resolve({ 
            triggered: true, 
            available: false, 
            supported: true,
            method: 'indexeddb',
            reason: `Firefox Private Browsing detected (${errorName})`,
          });
        } else {
          resolve({ triggered: false, available: false, supported: true, method: 'indexeddb', errorName });
        }
      };

      request.onsuccess = () => {
        indexedDB.deleteDatabase('firefoxPrivateTest');
        resolve({ triggered: false, available: true, supported: true, method: 'indexeddb' });
      };

      // Timeout fallback
      setTimeout(() => {
        resolve({ triggered: false, available: false, supported: true, method: 'timeout' });
      }, 2000);
    } catch (e) {
      resolve({ triggered: true, available: false, supported: true, error: e.message });
    }
  });
}

/**
 * Chrome/Chromium Private Mode Detection
 * Uses webkitTemporaryStorage quota check
 * @returns {Promise<Object>} Chrome detection result
 */
export async function testChromePrivate() {
  const { isChrome } = identifyBrowserEngine();
  
  if (!isChrome) {
    return { triggered: false, available: false, supported: false, engine: 'not-chrome' };
  }

  // Get heap size limit for comparison
  const heapLimit = window.performance?.memory?.jsHeapSizeLimit ?? 1073741824;

  // Modern Chrome (>= 76) - webkitTemporaryStorage quota
  if (navigator.webkitTemporaryStorage?.queryUsageAndQuota) {
    return new Promise((resolve) => {
      navigator.webkitTemporaryStorage.queryUsageAndQuota(
        (usage, quota) => {
          const quotaInMib = Math.round(quota / (1024 * 1024));
          const quotaLimitInMib = Math.round(heapLimit / (1024 * 1024)) * 2;
          const isPrivate = quotaInMib < quotaLimitInMib;
          
          resolve({
            triggered: isPrivate,
            available: true,
            supported: true,
            method: 'webkitTemporaryStorage',
            quotaMB: quotaInMib,
            limitMB: quotaLimitInMib,
            reason: isPrivate ? `Chrome Incognito detected (quota ${quotaInMib}MB < ${quotaLimitInMib}MB limit)` : null,
          });
        },
        (error) => {
          resolve({ triggered: false, available: false, supported: true, error: error.message });
        },
      );
    });
  }

  // Older Chrome (50-75) - FileSystem API
  if (window.webkitRequestFileSystem) {
    return new Promise((resolve) => {
      window.webkitRequestFileSystem(
        window.TEMPORARY,
        1,
        () => resolve({ triggered: false, available: true, supported: true, method: 'filesystem' }),
        () => resolve({ 
          triggered: true, 
          available: false, 
          supported: true,
          method: 'filesystem',
          reason: 'Chrome Incognito detected (FileSystem blocked)',
        }),
      );
    });
  }

  return { triggered: false, available: false, supported: false };
}

/**
 * Safari Private Mode Detection  
 * Uses navigator.storage.getDirectory() "unknown transient reason" error
 * @returns {Promise<Object>} Safari detection result
 */
export async function testSafariPrivate() {
  const { isSafari } = identifyBrowserEngine();
  
  if (!isSafari) {
    return { triggered: false, available: false, supported: false, engine: 'not-safari' };
  }

  // Modern Safari with OPFS
  if (typeof navigator.storage?.getDirectory === 'function') {
    try {
      await navigator.storage.getDirectory();
      return { triggered: false, available: true, supported: true, method: 'opfs' };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const isPrivate = message.includes('unknown transient reason');
      return {
        triggered: isPrivate,
        available: !isPrivate,
        supported: true,
        method: 'opfs',
        reason: isPrivate ? 'Safari Private Browsing detected (OPFS blocked)' : null,
        error: message,
      };
    }
  }

  // Safari 13-18: IndexedDB Blob test
  if (navigator.maxTouchPoints !== undefined && window.indexedDB) {
    return new Promise((resolve) => {
      const tmp = String(Math.random());
      try {
        const dbReq = indexedDB.open(tmp, 1);

        dbReq.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          try {
            db.createObjectStore('t', { autoIncrement: true }).put(new Blob());
            db.close();
            indexedDB.deleteDatabase(tmp);
            resolve({ triggered: false, available: true, supported: true, method: 'indexeddb-blob' });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const isPrivate = message.includes('are not yet supported');
            db.close();
            indexedDB.deleteDatabase(tmp);
            resolve({
              triggered: isPrivate,
              available: !isPrivate,
              supported: true,
              method: 'indexeddb-blob',
              reason: isPrivate ? 'Safari Private Browsing detected (Blob storage blocked)' : null,
            });
          }
        };

        dbReq.onerror = () => resolve({ triggered: false, available: false, supported: true });
      } catch {
        resolve({ triggered: false, available: false, supported: false });
      }
    });
  }

  // Old Safari: openDatabase + localStorage test
  try {
    const openDB = window.openDatabase;
    if (openDB) {
      try {
        openDB(null, null, null, null);
      } catch (e) {
        return { triggered: true, available: false, supported: true, reason: 'Safari Private (openDatabase blocked)' };
      }
    }
    
    localStorage.setItem('safariTest', '1');
    localStorage.removeItem('safariTest');
    return { triggered: false, available: true, supported: true, method: 'localstorage' };
  } catch (e) {
    return { triggered: true, available: false, supported: true, reason: 'Safari Private (localStorage blocked)' };
  }
}

/**
 * Universal incognito detection - runs appropriate test based on browser
 * @returns {Promise<Object>} Detection result with isPrivate flag
 */
export async function detectIncognitoMode() {
  const { isSafari, isChrome, isFirefox, engineId } = identifyBrowserEngine();

  let result;
  let browserName = 'Unknown';

  if (isSafari) {
    browserName = 'Safari';
    result = await testSafariPrivate();
  } else if (isChrome) {
    // Identify specific Chromium browser
    const ua = navigator.userAgent;
    if (navigator.brave !== undefined) {
      browserName = 'Brave';
    } else if (ua.match(/Edg/)) {
      browserName = 'Edge';
    } else if (ua.match(/OPR/)) {
      browserName = 'Opera';
    } else {
      browserName = 'Chrome';
    }
    result = await testChromePrivate();
  } else if (isFirefox) {
    browserName = 'Firefox';
    result = await testFirefoxPrivate();
  } else {
    // Unknown browser - try all methods
    const firefoxResult = await testFirefoxPrivate();
    if (firefoxResult.triggered) {
      result = firefoxResult;
    } else {
      const chromeResult = await testChromePrivate();
      result = chromeResult.triggered ? chromeResult : { triggered: false, available: false };
    }
  }

  return {
    ...result,
    browserName,
    engineId,
    isPrivate: result.triggered,
  };
}

// Legacy exports for backwards compatibility
export { testFirefoxPrivate as testIndexedDB };
export { testChromePrivate as testQuotaHeapRatio };
export { testSafariPrivate as testSafariLocalStorage };

// Re-export other tests that are still useful
export async function testServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) {
      return { triggered: false, available: false, supported: false };
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    return { triggered: false, available: true, supported: true, registrations: registrations.length };
  } catch (e) {
    return { triggered: true, available: false, supported: true, reason: 'ServiceWorker restricted', error: e.message };
  }
}

export async function testFileSystem() {
  return new Promise((resolve) => {
    if (!window.webkitRequestFileSystem && !window.requestFileSystem) {
      resolve({ triggered: false, available: false, supported: false });
      return;
    }
    const requestFS = window.webkitRequestFileSystem || window.requestFileSystem;
    requestFS(
      window.TEMPORARY,
      1024 * 1024,
      () => resolve({ triggered: false, available: true, supported: true }),
      () => resolve({ triggered: true, available: false, supported: true, reason: 'FileSystem API blocked' }),
    );
    setTimeout(() => resolve({ triggered: false, available: false, supported: true }), 2000);
  });
}

export async function testCacheAPI() {
  try {
    if (!('caches' in window)) {
      return { triggered: false, available: false, supported: false };
    }
    const cacheName = `privacy_test_${Date.now()}`;
    await caches.open(cacheName);
    await caches.delete(cacheName);
    return { triggered: false, available: true, supported: true };
  } catch (e) {
    return { triggered: true, available: false, supported: true, reason: 'Cache API restricted' };
  }
}

export async function testCredentialManagement() {
  try {
    if (!navigator.credentials) {
      return { triggered: false, available: false, supported: false };
    }
    await navigator.credentials.get({ password: true, mediation: 'silent' }).catch(() => null);
    return { triggered: false, available: true, supported: true };
  } catch (e) {
    return { triggered: true, available: false, supported: true, reason: 'Credential API restricted' };
  }
}

export async function testStorageQuota() {
  if (!navigator.storage?.estimate) {
    return { triggered: false, available: false, supported: false };
  }
  try {
    const { quota } = await navigator.storage.estimate();
    const quotaMB = quota / (1024 * 1024);
    if (quotaMB < 50) {
      return { triggered: true, available: true, quotaMB: quotaMB.toFixed(0), reason: `Very low quota: ${quotaMB.toFixed(0)}MB` };
    }
    return { triggered: false, available: true, quotaMB: quotaMB.toFixed(0) };
  } catch (e) {
    return { triggered: true, available: false, reason: 'Storage API blocked' };
  }
}

export async function testStoragePersist() {
  if (!navigator.storage?.persist) {
    return { triggered: false, available: false, supported: false };
  }
  try {
    await navigator.storage.persist();
    return { triggered: false, available: true, supported: true };
  } catch (e) {
    return { triggered: true, available: false, supported: true, reason: 'Storage persist blocked' };
  }
}

export async function testTrackingProtection() {
  return new Promise((resolve) => {
    const img = new Image();
    let resolved = false;
    img.onload = () => { if (!resolved) { resolved = true; resolve({ triggered: false }); } };
    img.onerror = () => { if (!resolved) { resolved = true; resolve({ triggered: true, reason: 'Tracking blocked' }); } };
    setTimeout(() => { if (!resolved) { resolved = true; resolve({ triggered: true, reason: 'Tracking timeout' }); } }, 1000);
    img.src = 'https://www.facebook.com/tr/?id=test&ev=PageView';
  });
}
