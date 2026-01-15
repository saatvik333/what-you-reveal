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
  fetchServerInfo,
  parseDeviceInfo,
  collectNetworkData,
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
async function collectNetworkChain() {
  try {
    const serverData = await fetchServerInfo();

    if (!serverData) {
      throw new Error('No server data received');
    }

    // Device info from User-Agent
    const deviceData = parseDeviceInfo(serverData);
    window.collectedData['Device Info'] = deviceData;
    renderToElement('device-info', deviceData);

    // Network info (GeoIP, latency)
    const networkData = await collectNetworkData(serverData, 'network-info');
    window.collectedData['Network Info'] = networkData;
    renderToElement('network-info', networkData);

    // Raw headers
    const headersEl = document.getElementById('headers-info');
    if (headersEl && serverData.headers) {
      window.collectedData['Headers'] = serverData.headers;
      headersEl.innerHTML = formatHeaders(serverData.headers);
    }
  } catch (e) {
    console.error('[Network] Chain failed:', e);
    const fallback = 'Connection failed';
    document.getElementById('network-info')?.replaceChildren(document.createTextNode(fallback));
    document.getElementById('device-info')?.replaceChildren(document.createTextNode(fallback));
    document.getElementById('headers-info')?.replaceChildren(document.createTextNode(fallback));
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI systems
  initDecryptedText();

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
