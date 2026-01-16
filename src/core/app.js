/**
 * What You Reveal - Main Application Entry Point
 *
 * A browser fingerprinting demonstration showing what information
 * your browser exposes to websites.
 *
 * Architecture:
 * - Modules in /js/modules/ handle specific data collection
 * - Theme system supports CRT and Terminal modes
 * - Data is collected in parallel for performance
 */

// Core & Utils
import { renderToElement } from './utils.js';

// UI
import { initDecryptedText } from '../modules/ui/decrypt-text.js';

// Core Features
import { downloadReport } from './report.js';

// Network Modules
import { collectBrowserData } from '../modules/network/browser.js';
import {
  collectLocalNetworkData,
  collectGeoIPData,
  fetchServerInfo,
  parseDeviceInfo,
  formatHeaders,
} from '../modules/network/network.js';
import { collectClientHints } from '../modules/network/client_hints.js';

// System/Hardware Modules
import { collectScreenData } from '../modules/system/screen.js';
import { collectHardwareData } from '../modules/system/hardware.js';
import { collectMediaData } from '../modules/system/media.js';
import { collectPermissionsData } from '../modules/system/permissions.js';
import { collectMediaDevices } from '../modules/system/media_devices.js';
import { collectClipboardData } from '../modules/system/clipboard.js';

// Fingerprinting Modules
import { collectWebGLData } from '../modules/fingerprint/webgl.js';
import { collectFingerprintData } from '../modules/fingerprint/identity.js';
import { collectFontData } from '../modules/fingerprint/fonts.js';
import { detectBot } from '../modules/fingerprint/integrity.js';
import { detectPrivacyMode } from '../modules/fingerprint/privacy.js';
import { collectIntlData } from '../modules/fingerprint/intl.js';

// ============================================================
// GLOBAL STATE
// ============================================================

/** Collected data for report generation */
window.collectedData = {};

// ============================================================
// TASK RUNNER
// ============================================================

/**
 * Execute a data collection task and render results
 * @param {string} elementId - Target DOM element ID
 * @param {Function} taskFn - Data collection function
 * @param {string} dataKey - Key for storing in collectedData
 */
async function runTask(elementId, taskFn, dataKey) {
  try {
    const data = await taskFn();
    if (dataKey) {
      window.collectedData[dataKey] = data;
    }
    renderToElement(elementId, data);
  } catch (e) {
    console.error(`[${dataKey || elementId}] Collection failed:`, e);
    renderToElement(elementId, { Error: 'Data unavailable' });
  }
}

// ============================================================
// NETWORK DATA (DEPENDENT CHAIN)
// ============================================================

/**
 * Fetch and render network-related data
 * These tasks depend on server response so run sequentially
 */
/**
 * Fetch and render network-related data (Parallelized)
 */
async function collectNetworkChain() {
  const elementId = 'network-info';
  // Shared state for the Network Card
  let networkState = {
    'Status': 'Initializing parallel scan...',
  };

  const updateUI = () => {
    // Remove "Status" if we have real data
    if (Object.keys(networkState).length > 1 && networkState['Status']) {
      delete networkState['Status'];
    }
    renderToElement(elementId, networkState);
    // Update global store
    window.collectedData['Network Info'] = networkState;
  };

  // 1. Start Local Scan (Immediate Feedback)
  const localTask = collectLocalNetworkData((partial) => {
    // Merge updates from local scan (latency, webrtc)
    networkState = { ...networkState, ...partial };
    updateUI();
  });

  // 2. Start Server Fetch (Parallel)
  const serverTask = (async () => {
    try {
      const serverData = await fetchServerInfo();
      if (!serverData) {throw new Error('No server data');}

      // 2a. Render Device Info & Headers immediately
      const deviceData = parseDeviceInfo(serverData);
      window.collectedData['Device Info'] = deviceData;
      renderToElement('device-info', deviceData);

      if (serverData.headers) {
          window.collectedData['Headers'] = serverData.headers;
          document.getElementById('headers-info').innerHTML = formatHeaders(serverData.headers);
      }

      // 2b. Start GeoIP (Depends on Server IP)
      const geoData = await collectGeoIPData(serverData);
      
      // Merge GeoIP into shared state
      networkState = { ...networkState, ...geoData };
      updateUI();
      
      // Check for VPN detection
      const vpnDetected = geoData['VPN/Proxy Detected']?.value === 'YES';
      return { vpnDetected };

    } catch (e) {
      console.error('[Network] Server chain failed:', e);
      networkState['Server Connection'] = 'Failed';
      updateUI();
      return { vpnDetected: false };
    }
  })();

  const results = await Promise.allSettled([localTask, serverTask]);
  const serverResult = results[1].status === 'fulfilled' ? results[1].value : { vpnDetected: false };
  
  // If VPN detected, re-run privacy check to update score
  if (serverResult?.vpnDetected) {
    runTask('incognito-info', () => detectPrivacyMode({ vpnDetected: true }), 'Privacy Mode');
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI systems
  initDecryptedText();

  // 1b. Inject Version
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.textContent = `SYSTEM ANALYSIS TOOL v${__APP_VERSION__} // BROWSER FINGERPRINT DEMO`;
  }

  // 2. Setup UI controls
  document.getElementById('download-report')?.addEventListener('click', downloadReport);

  // 3. Start data collection (parallel for independent tasks)
  const tasks = [
    runTask('incognito-info', detectPrivacyMode, 'Privacy Mode'),
    runTask('browser-info', collectBrowserData, 'Browser Info'),
    runTask('screen-info', collectScreenData, 'Screen Info'),
    runTask('hardware-info', collectHardwareData, 'Hardware Info'),
    runTask('webgl-info', collectWebGLData, 'WebGL Info'),
    runTask('identity-info', collectFingerprintData, 'Fingerprint'),
    runTask('fonts-info', collectFontData, 'Fonts'),
    runTask('media-info', collectMediaData, 'Media Codecs'),
    runTask('perms-info', collectPermissionsData, 'Permissions'),
    runTask('integrity-info', detectBot, 'System Integrity'),
    runTask('hints-info', collectClientHints, 'Client Hints'),
    runTask('media-devices-info', collectMediaDevices, 'Media Devices'),
    runTask('clipboard-info', collectClipboardData, 'Clipboard'),
    runTask('intl-info', collectIntlData, 'Internationalization'),
    collectNetworkChain(),
  ];

  // 4. Update footer when complete
  Promise.allSettled(tasks).then(() => {
    const logLine = document.getElementById('log-line');
    if (logLine) {
      logLine.textContent = 'Analysis complete. All modules loaded.';
    }
  });
});
