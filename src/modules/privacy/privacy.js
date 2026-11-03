/**
 * Privacy card: Tor, VPN, private browsing, WebRTC, canvas protection and browser signals,
 * combined into the privacy score.
 */

import { fetchCachedGeoIP, hostingProvider } from '../../utils/geoip.js';
import { probeWebRTC, webrtcLeakStatus } from '../network/webrtc.js';
import { detectCanvasProtection, isCanvasProtected } from '../fingerprint/canvas.js';
import { isUsingTor } from './tor.js';
import { detectAdBlocker, globalPrivacyControl, isBrave, signalRows } from './signals.js';
import { calculatePrivacyScore, formatPoints } from './score.js';

async function detectPrivateBrowsing() {
  try {
    // detectincognitojs is only needed here; keep it out of the main bundle.
    const { detectIncognito } = await import('detectincognitojs');
    return await detectIncognito();
  } catch {
    return null;
  }
}

async function detectVPN() {
  try {
    return { provider: hostingProvider(await fetchCachedGeoIP()) };
  } catch {
    return { error: true };
  }
}

const TOR_URL = 'https://metrics.torproject.org/onionoo.html';

export async function collectPrivacyData() {
  const canvasProtection = detectCanvasProtection();
  const [tor, incognito, vpn, webrtc, adBlocker, brave] = await Promise.all([
    isUsingTor(),
    detectPrivateBrowsing(),
    detectVPN(),
    probeWebRTC(),
    detectAdBlocker(),
    isBrave(),
  ]);
  const leak = webrtcLeakStatus(webrtc);

  const factors = {
    adBlocker,
    fingerprintProtection: isCanvasProtected(canvasProtection),
    webrtcProtected: leak.protected,
    webrtcLeaking: leak.leaking,
    gpcEnabled: globalPrivacyControl() === true,
    vpnDetected: Boolean(vpn.provider),
    torDetected: tor.isTor,
    privateBrowsing: incognito?.isPrivate === true,
    brave,
    webdriverDetected: navigator.webdriver === true,
  };
  const { score, grade, breakdown } = calculatePrivacyScore(factors);

  const data = {
    // The score is the summary of the flags below, not an exposure itself, so it is not flagged.
    'Privacy Score': {
      value: `${score}/100`,
      // Read by the scan summary (headline score, tips tailored to these factors); not rendered in the card.
      summary: { score, grade, factors },
    },
    'Privacy Grade': { value: grade },
    'Score Breakdown': {
      value: breakdown.length > 0
        ? breakdown.map((b) => `${b.label}: ${formatPoints(b.points)}`).join(' | ')
        : 'No protections detected (base score only)',
    },
    'Private Browsing': incognito === null
      ? { value: 'Check Failed' }
      : incognito.isPrivate
        ? { value: `Detected (${incognito.browserName})` }
        : { value: 'Not Detected' },
    'VPN/Proxy': vpn.error
      ? { value: 'Check Failed (GeoIP unavailable)', warning: true }
      : vpn.provider
        ? { value: `Detected (${vpn.provider} network)` }
        : { value: 'Not Detected' },
    'Tor Network': tor.error === 'ip'
      ? { value: 'Check Failed (public IP unknown)', warning: true, url: TOR_URL }
      : tor.isTor
        ? { value: 'Detected (Tor exit node)', url: TOR_URL }
        : tor.error === 'lookup'
          ? { value: 'Check Failed (relay lookup unavailable)', warning: true, url: TOR_URL }
          : { value: 'Not Detected', url: TOR_URL },
    'WebRTC IP Leak': leak.row,
    'Canvas Protection': {
      value: {
        altered: 'Detected (readback altered)',
        blocked: 'Detected (readback blocked)',
        unaltered: 'Not Detected',
        unsupported: 'Canvas Unsupported',
      }[canvasProtection],
      warning: canvasProtection === 'unaltered',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData',
    },
    ...signalRows({ adBlocker, brave }),
  };

  if (factors.webdriverDetected) {
    data['Automation'] = {
      value: 'WebDriver Detected',
      warning: true,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver',
    };
  }

  return data;
}
