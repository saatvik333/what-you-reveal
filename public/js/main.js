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
import { runBootSequence } from './modules/boot.js';
import { detectPrivacyMode } from './modules/privacy.js';
import { downloadReport } from './modules/report.js';

/**
 * Executes a task safely and renders the result to the DOM
 * @param {string} elementId 
 * @param {Function} taskFn - Async or sync function returning data
 */
async function runTask(elementId, taskFn) {
    try {
        const data = await taskFn();
        renderToElement(elementId, data);
    } catch (e) {
        console.error(`Module failed for ${elementId}:`, e);
        renderToElement(elementId, { Error: "Failed to load data" });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Setup UI Controls
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('amber-mode');
        });
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
    // We do NOT await these immediately. We let them run in the background.
    // However, we want to ensure the boot sequence 'feels' like it's initializing them.
    // Ideally, we wait for the boot to finish before *revealing* them, but the 'renderToElement'
    // function uses an IntersectionObserver which handles visibility. 
    // If the element is hidden by the boot overlay, it's fine.
    
    const tasks = [
        runTask('incognito-info', detectPrivacyMode),
        runTask('browser-info', collectBrowserData),
        runTask('screen-info', collectScreenData),
        runTask('hardware-info', collectHardwareData),
        runTask('webgl-info', collectWebGLData),
        runTask('identity-info', collectFingerprintData),
        runTask('fonts-info', collectFontData), // Now Async
        runTask('media-info', collectMediaData),
        runTask('perms-info', collectPermissionsData),
        runTask('integrity-info', detectBot),
        runTask('hints-info', collectClientHints),
        runTask('media-devices-info', collectMediaDevices)
    ];

    // Network & Server Data (Dependent chain)
    const networkTask = (async () => {
        try {
            // Fetch server info first
            const serverData = await fetchServerInfo();
            
            if (!serverData) {
                throw new Error("No server data");
            }

            // Render Device Info (Parsed from server UA)
            const deviceData = parseDeviceInfo(serverData);
            renderToElement('device-info', deviceData);

            // Render Network Info (GeoIP, Latency, etc.)
            const networkData = await collectNetworkData(serverData, 'network-info');
            renderToElement('network-info', networkData);

            // Render Headers
            const headersInfoEl = document.getElementById('headers-info');
            if (headersInfoEl && serverData.headers) {
                headersInfoEl.innerHTML = formatHeaders(serverData.headers);
            }
        } catch (e) {
            console.error("Server/Network module failed:", e);
            document.getElementById('network-info').innerText = "Failed to load server info.";
            document.getElementById('device-info').innerText = "Failed to load device info.";
            document.getElementById('headers-info').innerText = "Failed to load headers.";
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
        if (logLine) logLine.textContent = "System Analysis Complete. Waiting for user input...";
    });
});
