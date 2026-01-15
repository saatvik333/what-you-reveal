/**
 * Digital fingerprinting module
 * Enhanced with WebGL canvas, emoji rendering, and improved audio fingerprint
 */

import { cyrb53 } from './crypto.js';

/**
 * Generates a standard canvas fingerprint with text and shapes
 * @returns {string} Canvas data URL
 */
function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 280;
    canvas.height = 60;
    
    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text with specific font rendering
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint 🎨', 2, 15);
    
    // Emoji rendering (varies significantly across OS/browser)
    ctx.font = '18px Arial';
    ctx.fillText('👨‍👩‍👧‍👦🏳️‍🌈🦄', 2, 38);
    
    // Unicode characters (font rendering differences)
    ctx.font = '12px serif';
    ctx.fillStyle = '#333';
    ctx.fillText('Ωαβγδ中文العربية', 150, 15);
    
    // Shapes with anti-aliasing differences
    ctx.beginPath();
    ctx.arc(240, 30, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 128, 0.7)';
    ctx.fill();
    
    // Overlapping transparent rectangle
    ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
    ctx.fillRect(220, 10, 40, 40);
    
    // Bezier curve (anti-aliasing fingerprint)
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.bezierCurveTo(130, 20, 160, 50, 190, 25);
    ctx.strokeStyle = '#f60';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    return canvas.toDataURL();
}

/**
 * Generates a WebGL-accelerated canvas fingerprint
 * Uses GPU acceleration which varies per device
 * @returns {string} WebGL canvas data URL or error
 */
function getWebGLCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'Not Supported';
        
        // Draw gradient pattern using WebGL
        gl.clearColor(0.3, 0.5, 0.7, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // The way browsers composite WebGL to 2D varies
        return canvas.toDataURL();
    } catch (e) {
        return 'Error';
    }
}

/**
 * Tests emoji rendering variations across platforms
 * @returns {string} Hash of emoji rendering
 */
function getEmojiFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 30;
    
    // Emoji that render very differently across platforms
    const testEmojis = [
        '😀',           // Basic smiley - varies in style
        '🏳️‍🌈',          // Rainbow flag - complex composition
        '👨‍👩‍👧‍👦',      // Family - ZWJ sequence handling
        '🦄',           // Unicorn - newer emoji
        '⚡',           // Lightning - varies between color/monochrome
        '☺️',           // Classic smiley - very variant
        '🫠',           // Melting face - very new, often unsupported
    ];
    
    ctx.font = '20px Arial';
    ctx.fillText(testEmojis.join(''), 0, 22);
    
    return canvas.toDataURL();
}

/**
 * Generates an enhanced audio fingerprint
 * Uses multiple oscillator types and compressor settings
 * @returns {Promise<string>} Audio fingerprint value
 */
async function getAudioFingerprint() {
    try {
        const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!AudioContext) return 'Not Supported';
        
        const context = new AudioContext(1, 5000, 44100);
        
        // Oscillator
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        
        // Compressor with specific settings
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        // Analyser node for more fingerprint data
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        
        // Connect nodes
        oscillator.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(context.destination);
        
        oscillator.start(0);
        const buffer = await context.startRendering();
        
        // Get channel data and create fingerprint
        const channelData = buffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += Math.abs(channelData[i]);
        }
        
        return sum.toString();
    } catch (e) {
        return 'Error';
    }
}

/**
 * Gets speech synthesis voices fingerprint
 * Available voices vary significantly per OS/browser
 * @returns {Promise<Object>} Voice fingerprint data
 */
async function getSpeechVoicesFingerprint() {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            resolve({ available: false, count: 0, hash: 'Not Supported' });
            return;
        }
        
        const getVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                // Voices not loaded yet, wait
                setTimeout(getVoices, 100);
                return;
            }
            
            const voiceData = voices.map(v => `${v.name}|${v.lang}|${v.localService}`).join('||');
            resolve({
                available: true,
                count: voices.length,
                hash: cyrb53(voiceData).toString(16),
                sample: voices.slice(0, 5).map(v => v.name).join(', ')
            });
        };
        
        // Some browsers fire an event when voices are loaded
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = getVoices;
        }
        
        getVoices();
        
        // Timeout fallback
        setTimeout(() => {
            resolve({ available: true, count: 0, hash: 'Timeout' });
        }, 1000);
    });
}

/**
 * Collects digital fingerprint data
 * @returns {Promise<Object>} Fingerprint data object
 */
export async function collectFingerprintData() {
    const canvasFP = getCanvasFingerprint();
    const webglCanvasFP = getWebGLCanvasFingerprint();
    const emojiFP = getEmojiFingerprint();
    const audioFP = await getAudioFingerprint();
    const voicesFP = await getSpeechVoicesFingerprint();
    
    // Composite Hash Data (high entropy combination)
    const fingerprintComponents = [
        canvasFP,
        webglCanvasFP,
        emojiFP,
        audioFP,
        navigator.hardwareConcurrency,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
        voicesFP.hash
    ].join('||');
    
    const deviceHash = cyrb53(fingerprintComponents).toString(16);
    
    return {
        'Canvas Hash': cyrb53(canvasFP).toString(16),
        'Canvas Visual': { 
            element: `<img src="${canvasFP}" style="border: 1px solid var(--primary); max-width: 280px; max-height: 60px; vertical-align: bottom;" alt="Canvas Fingerprint" />`, 
            warning: true 
        },
        'WebGL Canvas Hash': cyrb53(webglCanvasFP).toString(16),
        'Emoji Render Hash': { value: cyrb53(emojiFP).toString(16), warning: true },
        'Audio Hash': cyrb53(audioFP).toString(16),
        'Speech Voices': voicesFP.available ? `${voicesFP.count} voices` : 'Not Supported',
        'Speech Voices Hash': voicesFP.hash,
        'Sample Voices': voicesFP.sample || 'N/A',
        'Composite Device ID': { value: deviceHash.toUpperCase(), warning: true },
        'Trackability Estimate': { value: 'Very High (Multi-Vector Fingerprint)', warning: true }
    };
}
