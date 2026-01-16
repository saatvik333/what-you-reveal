/**
 * Tor Detection Module
 * Browser-compatible implementation with localStorage caching
 */

const TOR_LIST_KEY = 'wyr_tor_exit_nodes';
const TOR_TIMESTAMP_KEY = 'wyr_tor_timestamp';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * LocalStorage-based persistence for Tor exit node list
 */
class LocalStoragePersistence {
  getIpList() {
    try {
      const data = localStorage.getItem(TOR_LIST_KEY);
      if (!data) return new Set();
      return new Set(JSON.parse(data));
    } catch (e) {
      console.warn('Error reading Tor list from localStorage:', e);
      return new Set();
    }
  }

  saveIpList(ipList) {
    try {
      localStorage.setItem(TOR_LIST_KEY, JSON.stringify([...ipList]));
    } catch (e) {
      console.warn('Error saving Tor list to localStorage:', e);
    }
  }

  getTimestamp() {
    try {
      const ts = localStorage.getItem(TOR_TIMESTAMP_KEY);
      return ts ? parseInt(ts, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveTimestamp(timestamp) {
    try {
      localStorage.setItem(TOR_TIMESTAMP_KEY, timestamp.toString());
    } catch (e) {
      console.warn('Error saving Tor timestamp:', e);
    }
  }
}

const persistence = new LocalStoragePersistence();

// In-memory cache for fast repeated lookups
let cachedIpList = null;
let cacheTimestamp = 0;
const MEMORY_CACHE_TTL = 60000; // 1 minute

/**
 * Fetches the user's current IP address
 */
async function getIpAddress() {
  try {
    // Use ipify (CORS-friendly)
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.warn('Error fetching IP address:', e);
    return 'unknown';
  }
}

/**
 * Fetches Tor exit node list from the official source
 * Uses CORS proxy if direct fetch fails
 */
async function fetchTorExitNodes() {
  const TOR_LIST_URL = 'https://check.torproject.org/torbulkexitlist';
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Try direct fetch first
    let response;
    try {
      response = await fetch(TOR_LIST_URL, { signal: controller.signal });
    } catch (corsError) {
      // CORS blocked, try proxy
      console.info('Direct fetch blocked, trying CORS proxy...');
      response = await fetch(CORS_PROXY + encodeURIComponent(TOR_LIST_URL), {
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch Tor list: ${response.status}`);
    }

    const data = await response.text();
    const ipSet = new Set();

    for (const line of data.split('\n')) {
      const ip = line.trim();
      if (!ip) continue;

      // Basic IPv4 validation
      const parts = ip.split('.');
      if (parts.length !== 4) continue;

      let valid = true;
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          valid = false;
          break;
        }
      }

      if (valid) ipSet.add(ip);
    }

    if (ipSet.size === 0) {
      throw new Error('No valid IPs found in Tor list');
    }

    // Save to localStorage
    persistence.saveIpList(ipSet);
    persistence.saveTimestamp(Date.now());

    return ipSet;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Error fetching Tor exit nodes:', e);
    return new Set();
  }
}

/**
 * Gets the Tor exit node list (from cache or network)
 */
async function getTorExitNodes(forceUpdate = false) {
  // Check memory cache first
  if (
    cachedIpList &&
    cachedIpList.size > 0 &&
    !forceUpdate &&
    Date.now() - cacheTimestamp < MEMORY_CACHE_TTL
  ) {
    return cachedIpList;
  }

  // Check localStorage cache
  const storedTimestamp = persistence.getTimestamp();
  const isExpired = Date.now() - storedTimestamp > CACHE_TTL;

  let ipList = persistence.getIpList();

  if (ipList.size === 0 || isExpired || forceUpdate) {
    ipList = await fetchTorExitNodes();
  }

  // Update memory cache
  cachedIpList = ipList;
  cacheTimestamp = Date.now();

  return ipList;
}

/**
 * Checks if the current user IP is in the Tor exit node list
 */
export async function isUsingTor() {
  const [userIp, torNodes] = await Promise.all([
    getIpAddress(),
    getTorExitNodes(),
  ]);

  if (userIp === 'unknown') {
    return { isTor: false, ip: 'unknown', error: true };
  }

  return {
    isTor: torNodes.has(userIp),
    ip: userIp,
    nodeCount: torNodes.size,
  };
}

/**
 * Collects Privacy Mode data (Tor + Incognito + Privacy Signals + VPN + Score)
 */
export async function collectTorData() {
  // Import detectIncognito and privacy signals dynamically
  const { detectIncognito } = await import('detectincognitojs');
  const { collectPrivacySignals, detectVPNProxy, calculatePrivacyScore } = await import('./signals.js');
  
  const [torResult, incognitoResult, signalsData, vpnResult] = await Promise.all([
    isUsingTor(),
    detectIncognito().catch(() => ({ isPrivate: false, browserName: 'Unknown' })),
    collectPrivacySignals().catch(() => ({})),
    detectVPNProxy().catch(() => ({ isVPN: false, error: true })),
  ]);

  // Extract factor states for scoring
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  const scoreFactors = {
    adBlocker: signalsData['Ad Blocker']?.value === 'Active',
    webrtcProtected: signalsData['WebRTC IP Leak']?.value?.includes('Protected'),
    webrtcLeaking: signalsData['WebRTC IP Leak']?.value?.includes('Leaking'),
    gpcEnabled: navigator.globalPrivacyControl === true,
    gpcDisabled: navigator.globalPrivacyControl === false,
    storagePartitioned: signalsData['Storage Partitioning']?.value?.includes('Partitioned'),
    vpnDetected: vpnResult.isVPN === true,
    torDetected: torResult.isTor === true,
    privateBrowsing: incognitoResult.isPrivate === true,
    dntEnabled: dnt === '1' || dnt === 'yes',
    dntDisabled: dnt === '0' || dnt === 'no',
    braveShields: signalsData['Brave Shields']?.value === 'Active',
    webdriverDetected: navigator.webdriver === true,
  };

  const scoreResult = calculatePrivacyScore(scoreFactors);

  const data = {};

  // Privacy Score (FIRST in display)
  data['Privacy Score'] = { 
    value: `${scoreResult.score}/100`, 
    warning: scoreResult.score < 50,
    action: 'enhance',
    actionLabel: 'How to Enhance?'
  };
  data['Privacy Grade'] = { 
    value: scoreResult.grade,
    warning: scoreResult.score < 50
  };

  // Score Breakdown (show each factor's contribution)
  if (scoreResult.breakdown.length > 0) {
    const breakdownStr = scoreResult.breakdown
      .map(b => `${b.factor}: ${b.points}`)
      .join(' | ');
    data['Score Breakdown'] = { 
      value: breakdownStr,
      action: 'scoring',
      actionLabel: 'Info'
    };
  }

  // Incognito Detection
  if (incognitoResult.isPrivate) {
    data['Private Browsing'] = { value: `DETECTED (${incognitoResult.browserName})`, warning: true };
  } else {
    data['Private Browsing'] = { value: 'Not Detected' };
  }

  // VPN/Proxy Detection
  if (vpnResult.error) {
    data['VPN/Proxy'] = { value: 'Check Failed' };
  } else if (vpnResult.isVPN) {
    const reasons = [];
    if (vpnResult.isDatacenter) reasons.push('Datacenter');
    if (vpnResult.isProxy) reasons.push('Proxy');
    if (vpnResult.isSuspiciousISP) reasons.push('VPN ISP');
    data['VPN/Proxy'] = { value: `DETECTED (${reasons.join(', ')})`, warning: true };
  } else {
    data['VPN/Proxy'] = { value: 'Not Detected (Residential IP)' };
  }

  // Tor Detection
  data['Your IP Address'] = { value: torResult.ip };

  if (torResult.error) {
    data['Tor Network'] = { value: 'Failed (IP Unknown)', warning: true };
  } else if (torResult.isTor) {
    data['Tor Network'] = { value: 'DETECTED - Using Tor Exit Node', warning: true };
  } else {
    data['Tor Network'] = { value: 'Not Detected' };
  }

  // Merge privacy signals (without score-related data which is already at top)
  const filteredSignals = { ...signalsData };
  delete filteredSignals['Detection Accuracy']; // Remove redundant disclaimer
  Object.assign(data, filteredSignals);

  data['Exit Nodes Cached'] = { value: torResult.nodeCount || 0 };

  return data;
}

export default isUsingTor;
