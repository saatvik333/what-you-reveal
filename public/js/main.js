/**
 * What You Reveal - Main Application Entry Point
 * 
 * This application reveals what information your browser exposes
 * to websites, demonstrating browser fingerprinting techniques.
 */

import { renderToElement } from './utils.js';
import { collectBrowserData } from './modules/browser.js';
import { collectScreenData } from './modules/screen.js';
import { collectHardwareData } from './modules/hardware.js';
import { collectWebGLData } from './modules/webgl.js';
import { fetchServerInfo, parseDeviceInfo, collectNetworkData, formatHeaders } from './modules/network.js';
import { collectFingerprintData } from './modules/identity.js';
import { collectFontData } from './modules/fonts.js';
import { collectMediaData } from './modules/media.js';
import { collectPermissionsData } from './modules/permissions.js';
import { detectBot } from './modules/integrity.js';
import { collectClientHints } from './modules/client_hints.js';
import { collectMediaDevices } from './modules/media_devices.js';
import { collectClipboardData } from './modules/clipboard.js';
import { runBootSequence } from './modules/boot.js';
import { detectPrivacyMode } from './modules/privacy.js';
import { downloadReport } from './modules/report.js';
import { collectIntlData } from './modules/intl.js';
import { initTheme, cycleTheme } from './modules/theme.js';
import { initCursor } from './modules/cursor.js';

// Global Data Store for Report
window.collectedData = {};

/**
 * Executes a task safely and renders the result to the DOM
 * @param {string} elementId 
 * @param {Function} taskFn - Async or sync function returning data
 */
async function runTask(elementId, taskFn, dataKey) {
    try {
        const data = await taskFn();
        if (dataKey) {
            window.collectedData[dataKey] = data;
        }
        renderToElement(elementId, data);
    } catch (e) {
        console.error(`Module failed for ${elementId}:`, e);
        renderToElement(elementId, { Error: 'Failed to load data' });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Initialize Theme System
    initTheme();
    
    // 0.5 Initialize Custom Cursor
    initCursor();
    
    // Setup UI Controls
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', cycleTheme);
    }

    const downloadBtn = document.getElementById('download-report');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadReport();
        });
    }

    // 1. Start Boot Animation (Visuals)
    const bootPromise = runBootSequence();

    // 2. Start Data Collection (Logic) - PARALLEL EXECUTION
    // OPTIMIZATION: Use requestIdleCallback to defer heavy processing
    // This ensures the boot animation starts smoothly without main thread blocking
    const startDataCollection = () => {
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
            runTask('intl-info', collectIntlData, 'Internationalization')
        ];
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(startDataCollection, { timeout: 2000 });
    } else {
        setTimeout(startDataCollection, 500);
    }

    // Network & Server Data (Dependent chain)
    const networkTask = (async () => {
        try {
            // Fetch server info first
            const serverData = await fetchServerInfo();
            
            if (!serverData) {
                throw new Error('No server data');
            }

            // Render Device Info (Parsed from server UA)
            const deviceData = parseDeviceInfo(serverData);
            window.collectedData['Device Info'] = deviceData;
            renderToElement('device-info', deviceData);

            // Render Network Info (GeoIP, Latency, etc.)
            const networkData = await collectNetworkData(serverData, 'network-info');
            window.collectedData['Network Info'] = networkData;
            renderToElement('network-info', networkData);

            // Render Headers
            const headersInfoEl = document.getElementById('headers-info');
            if (headersInfoEl && serverData.headers) {
                window.collectedData['Headers'] = serverData.headers;
                headersInfoEl.innerHTML = formatHeaders(serverData.headers);
            }
        } catch (e) {
            console.error('Server/Network module failed:', e);
            document.getElementById('network-info').innerText = 'Failed to load server info.';
            document.getElementById('device-info').innerText = 'Failed to load device info.';
            document.getElementById('headers-info').innerText = 'Failed to load headers.';
        }
    })();

    tasks.push(networkTask);

    // 3. Wait for visual boot to finish
    await bootPromise;

    // 4. Ensure all tasks are at least initiated (they are)
    // The UI will update as each promise resolves via runTask -> renderToElement
    // We don't strictly need to await Promise.all(tasks) unless we want a "global done" state.
    
    // Optional: Log completion
    Promise.allSettled(tasks).then(() => {
        const logLine = document.getElementById('log-line');
        if (logLine) logLine.textContent = 'System Analysis Complete. Waiting for user input...';
    });
});
