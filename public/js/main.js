/**
 * What You Reveal - Main Application Entry Point
 * 
 * This application reveals what information your browser exposes
 * to websites, demonstrating browser fingerprinting techniques.
 */

import { renderToElement, createTable } from './utils.js';
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

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for CRT "turn on" animation (approx 3s)
    await new Promise(r => setTimeout(r, 3500));
    
    // Run Boot Sequence
    await runBootSequence();

    // --- 1. Browser/Navigator Data ---
    try {
        const browserData = collectBrowserData();
        renderToElement('browser-info', browserData);
    } catch (e) {
        console.error("Browser module failed:", e);
        renderToElement('browser-info', { Error: "Failed to load" });
    }



    // --- 2. Screen Data ---
    try {
        const screenData = collectScreenData();
        renderToElement('screen-info', screenData);
    } catch (e) {
        console.error("Screen module failed:", e);
        renderToElement('screen-info', { Error: "Failed to load" });
    }

    // --- 3. Hardware Data ---
    try {
        const hardwareData = await collectHardwareData();
        renderToElement('hardware-info', hardwareData);
    } catch (e) {
        console.error("Hardware module failed:", e);
        renderToElement('hardware-info', { Error: "Failed to load" });
    }

    // --- 4. WebGL Data ---
    try {
        const webglData = collectWebGLData();
        renderToElement('webgl-info', webglData);
    } catch (e) {
        console.error("WebGL module failed:", e);
        renderToElement('webgl-info', { Error: "Failed to load" });
    }

    // --- 5. Digital Identity ---
    try {
        const fingerprintData = await collectFingerprintData();
        renderToElement('identity-info', fingerprintData);
    } catch (e) {
        console.error("Identity module failed:", e);
        renderToElement('identity-info', { Error: "Failed to load" });
    }

    // --- 10. Fonts ---
    try {
        const fontData = collectFontData();
        renderToElement('fonts-info', fontData);
    } catch (e) {
        console.error("Font module failed:", e);
        renderToElement('fonts-info', { Error: "Failed to load" });
    }

    // --- 11. Media Codecs ---
    try {
        const mediaData = collectMediaData();
        renderToElement('media-info', mediaData);
    } catch (e) {
        console.error("Media module failed:", e);
        renderToElement('media-info', { Error: "Failed to load" });
    }

    // --- 12. Permissions ---
    try {
        const permData = await collectPermissionsData();
        renderToElement('perms-info', permData);
    } catch (e) {
        console.error("Permissions module failed:", e);
        renderToElement('perms-info', { Error: "Failed to load" });
    }

    // --- 13. System Integrity ---
    try {
        const botData = detectBot();
        renderToElement('integrity-info', botData);
    } catch (e) {
        console.error("Integrity check failed:", e);
        renderToElement('integrity-info', { Error: "Failed to load" });
    }

    // --- 14. Advanced Client Hints ---
    try {
        const hintsData = await collectClientHints();
        renderToElement('hints-info', hintsData);
    } catch (e) {
        console.error("Client Hints failed:", e);
        renderToElement('hints-info', { Error: "Failed to load" });
    }

    // --- 15. Media Devices ---
    try {
        const mediaDeviceData = await collectMediaDevices();
        renderToElement('media-devices-info', mediaDeviceData);
    } catch (e) {
        console.error("Media Devices failed:", e);
        renderToElement('media-devices-info', { Error: "Failed to load" });
    }

    // --- 6. Server-Side Data ---
    let serverData = null;
    try {
        serverData = await fetchServerInfo();
        
        if (!serverData) {
            throw new Error("No server data");
        }

        // --- 7. Device Info (from server) ---
        const deviceData = parseDeviceInfo(serverData);
        renderToElement('device-info', deviceData);

        // --- 8. Network & GeoIP Data ---
        const networkData = await collectNetworkData(serverData, 'network-info');
        renderToElement('network-info', networkData);

        // --- 9. Request Headers ---
        // Moved inside try block to verify serverData exists
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

    // --- 9. Request Headers ---
});
