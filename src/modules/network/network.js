/**
 * Network card: connection hints, public addresses, IP geolocation, WebRTC exposure and
 * latency. Sections fill in as they finish; `onUpdate` receives a fresh copy each time so
 * Vue sees a new object, and the returned promise resolves with the complete result.
 */

import { fetchCachedGeoIP } from '../../utils/geoip.js';
import { fetchPublicIPs } from '../../utils/publicip.js';
import { probeWebRTC } from './webrtc.js';

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

function connectionRows() {
  const conn = navigator.connection;
  if (!conn) return { 'Network Information API': { value: 'Not Supported', url: `${MDN}Network_Information_API` } };
  return {
    'Effective Type': { value: conn.effectiveType?.toUpperCase() ?? 'Unknown', url: `${MDN}NetworkInformation/effectiveType` },
    'RTT (Browser Est.)': { value: `${conn.rtt ?? 0} ms`, url: `${MDN}NetworkInformation/rtt` },
    'Downlink (Browser Est.)': { value: `${conn.downlink ?? 0} Mbps`, url: `${MDN}NetworkInformation/downlink` },
    'Save-Data': { value: conn.saveData ? 'On' : 'Off', url: `${MDN}NetworkInformation/saveData` },
  };
}

async function publicIPRows() {
  const { v4, v6 } = await fetchPublicIPs();
  return {
    'Public IPv4': { value: v4 ?? 'None / Lookup Failed', url: 'https://www.ipify.org/' },
    'Public IPv6': { value: v6 ?? 'None / Lookup Failed', url: 'https://www.ipify.org/' },
  };
}

async function geoRows() {
  try {
    const geo = await fetchCachedGeoIP();
    const place = [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'Unknown';
    const rows = {
      'ISP / Organization': { value: geo.org || 'Unknown' },
      'AS Number': { value: geo.asn || 'Unknown', url: geo.asn ? `https://bgp.he.net/${geo.asn}` : undefined },
      'Location (Approx.)': {
        value: place,
        url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(place)}`,
      },
      'Coordinates (Approx.)': {
        value: `${geo.latitude}, ${geo.longitude}`,
        url: `https://www.openstreetmap.org/#map=11/${geo.latitude}/${geo.longitude}`,
      },
    };
    if (geo.postal) rows['Postal Code'] = { value: geo.postal };

    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const comparison = compareTimeZones(browserTz, geo.timezone);
    if (comparison) rows['Timezone vs IP'] = comparison;
    rows['GeoIP Source'] = { value: geo.source, url: `https://${geo.source}` };
    return rows;
  } catch (e) {
    return { 'GeoIP': { value: `Lookup Failed (${e.message})`, warning: true } };
  }
}

/** Canonical name via the engine's own tz database, so aliases (Asia/Calcutta = Asia/Kolkata) compare equal. */
function canonicalZone(zone) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
  } catch {
    return null; // unknown to this engine
  }
}

function utcOffset(zone) {
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName')?.value;
}

/**
 * Sites flag VPN and proxy users when the clock's UTC offset disagrees with the IP's location.
 * Neighboring zones with the same offset (IP geolocated one border over) are not a mismatch.
 */
function compareTimeZones(browserTz, ipTz) {
  const browser = canonicalZone(browserTz);
  const ip = canonicalZone(ipTz);
  if (!browser || !ip) return null;
  if (browser === ip) return { value: `Consistent (${browser})` };
  const [browserOffset, ipOffset] = [utcOffset(browser), utcOffset(ip)];
  if (browserOffset === ipOffset) return { value: `Same offset (${browserOffset}; browser ${browser}, IP ${ip})` };
  return { value: `Mismatch (browser ${browser} ${browserOffset}, IP ${ip} ${ipOffset})`, warning: true };
}

async function webrtcRows() {
  const result = await probeWebRTC();
  const url = `${MDN}RTCIceCandidate/address`;
  if (!result.supported) return { 'WebRTC': { value: 'Not Available', url } };
  return {
    'Local IP (WebRTC)': result.localIPs.length > 0
      ? { value: result.localIPs.join(', '), warning: true, url }
      : { value: result.mdnsHidden ? 'Hidden (mDNS)' : 'Not Exposed', url },
    'Public IP (WebRTC STUN)': result.stunIPs.length > 0
      ? { value: result.stunIPs.join(', '), warning: result.leakedPublicIPs.length > 0, url }
      : { value: 'Not Exposed (STUN unreachable or blocked)', url },
  };
}

/**
 * Sequential round trips to this site; parallel requests would measure queueing, not latency.
 * Each sample is the browser's own request-sent → first-byte time (Resource Timing), so main-thread
 * work by the other cards running at the same time does not inflate it.
 */
async function latencyRows() {
  const url = 'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming';
  const samples = [];
  try {
    for (let i = 0; i < 5; i++) {
      const target = new URL(`/robots.txt?ping=${Date.now()}-${i}`, location.href).href;
      const start = performance.now();
      const response = await fetch(target, { cache: 'no-store' });
      await response.arrayBuffer(); // finish the exchange before timing the next one
      const timing = performance.getEntriesByName(target).pop();
      samples.push(timing?.responseStart > 0 ? timing.responseStart - timing.requestStart : performance.now() - start);
    }
  } catch {
    return { 'Latency': { value: 'Failed', warning: true, url } };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  // Jitter as the mean difference between consecutive samples (RFC 3550 style).
  const jitter = samples.slice(1).reduce((sum, s, i) => sum + Math.abs(s - samples[i]), 0) / (samples.length - 1);
  return {
    'Latency to Site (Median)': { value: `${sorted[2].toFixed(1)} ms`, url },
    'Latency (Min/Max)': { value: `${sorted[0].toFixed(1)} / ${sorted[4].toFixed(1)} ms`, url },
    'Jitter': { value: `${jitter.toFixed(1)} ms`, url: 'https://developer.mozilla.org/en-US/docs/Glossary/Jitter' },
  };
}

export async function collectNetworkData(onUpdate) {
  // Fixed section order, so rows don't jump around as sections finish.
  const sections = [connectionRows(), {}, {}, {}, {}];
  const merge = () => Object.assign({}, ...sections);
  onUpdate?.(merge());

  await Promise.all([publicIPRows, geoRows, webrtcRows, latencyRows].map(async (collect, i) => {
    sections[i + 1] = await collect();
    onUpdate?.(merge());
  }));

  return merge();
}
