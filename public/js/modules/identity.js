/**
 * Digital fingerprinting module
 */

import { cyrb53 } from './crypto.js';

/**
 * Generates a canvas fingerprint
 * @returns {Promise<string>} Canvas data URL
 */
async function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 50;
    
    // Text with mixing
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Hello World 😃", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Hello World 😃", 4, 17);
    
    return canvas.toDataURL();
}

/**
 * Generates an audio fingerprint
 * @returns {Promise<string>} Audio fingerprint value
 */
async function getAudioFingerprint() {
    try {
        const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!AudioContext) return "Not Supported";
        
        const context = new AudioContext(1, 44100, 44100);
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        oscillator.connect(compressor);
        compressor.connect(context.destination);
        
        oscillator.start(0);
        const buffer = await context.startRendering();
        return buffer.getChannelData(0).slice(0, 5000).reduce((acc, val) => acc + val, 0).toString();
    } catch (e) {
        return "Error";
    }
}

/**
 * Collects digital fingerprint data
 * @returns {Promise<Object>} Fingerprint data object
 */
export async function collectFingerprintData() {
    const canvasFP = await getCanvasFingerprint();
    const audioFP = await getAudioFingerprint();
    
    // Composite Hash Data
    const fingerprintComponents = [
        canvasFP,
        audioFP,
        navigator.hardwareConcurrency,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language
    ].join('||');
    
    const deviceHash = cyrb53(fingerprintComponents).toString(16);
    
    return {
        'Canvas Hash': cyrb53(canvasFP).toString(16),
        'Audio Hash': cyrb53(audioFP).toString(16),
        'Composite Device ID': { value: deviceHash.toUpperCase(), warning: true },
        'Trackability Estimate': { value: 'High (Unique Hardware/Canvas)', warning: true }
    };
}
