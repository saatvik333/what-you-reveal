/**
 * Digital identity card: canvas, WebGL-composited canvas, emoji, audio and speech-voice
 * vectors, combined into one composite device ID.
 */

import { cyrb53 } from '../../utils/crypto.js';
import { detectCanvasProtection, isCanvasProtected } from './canvas.js';

const hash = (value) => cyrb53(String(value)).toString(16).toUpperCase();

function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text and emoji: font rasterization and emoji sets differ by OS, browser and GPU.
  ctx.textBaseline = 'alphabetic';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#069';
  ctx.fillText('Browser Fingerprint 🎨', 2, 15);
  ctx.font = '18px Arial';
  ctx.fillText('👨‍👩‍👧‍👦🏳️‍🌈🦄', 2, 38);
  ctx.font = '12px serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Ωαβγδ中文العربية', 150, 15);

  // Blended shapes and curves: anti-aliasing and compositing differences.
  ctx.beginPath();
  ctx.arc(240, 30, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 0, 128, 0.7)';
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
  ctx.fillRect(220, 10, 40, 40);
  ctx.beginPath();
  ctx.moveTo(100, 50);
  ctx.bezierCurveTo(130, 20, 160, 50, 190, 25);
  ctx.strokeStyle = '#f60';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL();
}

/** How the browser composites a WebGL buffer into an image (differs from the WebGL card's render hash). */
function getWebGLCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const gl = canvas.getContext('webgl');
  if (!gl) return null;
  try {
    gl.clearColor(0.3, 0.5, 0.7, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return canvas.toDataURL();
  } finally {
    // Browsers cap live WebGL contexts; release this one now instead of at garbage collection.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

function getEmojiFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 30;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Basic, ZWJ sequence, flag, newer and text-vs-emoji presentation code points.
  ctx.font = '20px Arial';
  ctx.fillText('😀🏳️‍🌈👨‍👩‍👧‍👦🦄⚡☺️🫠', 0, 22);
  return canvas.toDataURL();
}

async function getAudioFingerprint() {
  if (typeof OfflineAudioContext !== 'function') return null;
  try {
    const context = new OfflineAudioContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    // Compressor output depends on the platform's floating-point audio pipeline.
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const samples = (await context.startRendering()).getChannelData(0);
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += Math.abs(samples[i]);
    return sum.toString();
  } catch {
    return null;
  }
}

/** Voices load asynchronously in most browsers; wait for `voiceschanged`, at most one second. */
function getSpeechVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      speechSynthesis.removeEventListener?.('voiceschanged', check);
      resolve(speechSynthesis.getVoices());
    };
    const check = () => {
      if (speechSynthesis.getVoices().length > 0) finish();
    };
    const timer = setTimeout(finish, 1000);
    speechSynthesis.addEventListener?.('voiceschanged', check);
    check();
  });
}

export async function collectFingerprintData() {
  const canvasFP = getCanvasFingerprint();
  const webglCanvasFP = getWebGLCanvasFingerprint();
  const emojiFP = getEmojiFingerprint();
  const protection = detectCanvasProtection();
  const [audioFP, voices] = await Promise.all([getAudioFingerprint(), getSpeechVoices()]);

  const voiceList = voices?.map((v) => `${v.name}|${v.lang}|${v.localService}`).join('||') ?? '';

  const deviceHash = hash([
    canvasFP,
    webglCanvasFP,
    emojiFP,
    audioFP,
    navigator.hardwareConcurrency,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    voiceList,
  ].join('||'));

  const protectedCanvas = isCanvasProtected(protection);
  const data = {
    'Composite Device ID': { value: deviceHash, warning: !protectedCanvas },
    'Stability Across Sites': protectedCanvas
      ? { value: 'Reduced (canvas readback altered; hashes may vary per site or session)' }
      : { value: 'High (no canvas protection detected)', warning: true },
    'Canvas Hash': { value: canvasFP ? hash(canvasFP) : 'Not Supported' },
  };
  if (canvasFP) {
    data['Canvas Render'] = {
      value: 'Image below',
      element: { type: 'image', src: canvasFP, alt: 'The test image this browser rendered for canvas fingerprinting' },
    };
  }
  Object.assign(data, {
    'WebGL Canvas Hash': { value: webglCanvasFP ? hash(webglCanvasFP) : 'Not Supported' },
    'Emoji Render Hash': { value: emojiFP ? hash(emojiFP) : 'Not Supported' },
    'Audio Hash': {
      value: audioFP ? hash(audioFP) : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext',
    },
    'Speech Voices': {
      value: voices === null ? 'Not Supported' : voices.length > 0 ? `${voices.length} (hash ${hash(voiceList)})` : 'None loaded',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices',
    },
  });
  if (voices?.length > 0) {
    data['Sample Voices'] = { value: voices.slice(0, 5).map((v) => v.name).join(', ') };
  }
  return data;
}
