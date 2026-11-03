import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchCachedGeoIP, clearGeoIPCache, hostingProvider } from '../src/utils/geoip.js';
import { clearPublicIPCache } from '../src/utils/publicip.js';
import { calculatePrivacyScore, BASE_SCORE } from '../src/modules/privacy/score.js';

const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const IPAPI = { ip: '203.0.113.1', city: 'Springfield', region: 'IL', country_name: 'United States', org: 'Example ISP', asn: 'AS64500', timezone: 'America/Chicago' };
const GEOJS = { ip: '203.0.113.1', city: 'Springfield', region: 'IL', country: 'United States', organization_name: 'Example ISP', asn: 64500, timezone: 'America/Chicago' };

function routeFetch(t, routes) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url);
    const route = Object.entries(routes).find(([prefix]) => String(url).startsWith(prefix));
    if (!route) throw new TypeError(`unexpected fetch ${url}`);
    return route[1](url);
  });
  return calls;
}

test('GeoIP falls back to geojs.io when ipapi.co rate-limits, with the same field names', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  routeFetch(t, {
    'https://ipapi.co/': () => json({}, 429),
    'https://get.geojs.io/': () => json(GEOJS),
  });
  const geo = await fetchCachedGeoIP();
  assert.equal(geo.source, 'geojs.io');
  assert.equal(geo.country, 'United States');
  assert.equal(geo.org, 'Example ISP');
  assert.equal(geo.asn, 'AS64500');
});

test('GeoIP treats an ipapi.co error body served with HTTP 200 as a failure', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  routeFetch(t, {
    'https://ipapi.co/': () => json({ error: true, reason: 'RateLimited' }),
    'https://get.geojs.io/': () => json(GEOJS),
  });
  assert.equal((await fetchCachedGeoIP()).source, 'geojs.io');
});

test('GeoIP shares one attempt between concurrent callers and retries after both providers fail', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  let healthy = false;
  const calls = routeFetch(t, {
    'https://ipapi.co/': () => (healthy ? json(IPAPI) : json({}, 503)),
    'https://get.geojs.io/': () => json({}, 503),
  });
  const results = await Promise.allSettled([fetchCachedGeoIP(), fetchCachedGeoIP()]);
  assert.deepEqual(results.map((r) => r.status), ['rejected', 'rejected']);
  assert.match(results[0].reason.message, /ipapi\.co: .*503.*geojs\.io: .*503/);
  assert.equal(calls.length, 2);

  healthy = true;
  assert.equal((await fetchCachedGeoIP()).source, 'ipapi.co');
  await fetchCachedGeoIP();
  assert.equal(calls.length, 3);
});

test('an obsolete failed GeoIP lookup does not evict the lookup that replaced it', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  let failOld;
  let ipapiCalls = 0;
  const calls = routeFetch(t, {
    'https://ipapi.co/': () => (++ipapiCalls === 1 ? new Promise((_, reject) => { failOld = reject; }) : json(IPAPI)),
    'https://get.geojs.io/': () => json({}, 503),
  });
  const old = fetchCachedGeoIP();
  clearGeoIPCache();
  await fetchCachedGeoIP();
  failOld(new TypeError('offline'));
  await assert.rejects(old, /offline/);
  await fetchCachedGeoIP();
  assert.equal(calls.length, 3); // old ipapi + new ipapi + old fallback; no fourth lookup
});

test('hosting/VPN classification matches operators, not generic words in residential ISP names', () => {
  assert.equal(hostingProvider({ org: 'DigitalOcean, LLC' }), 'DigitalOcean');
  assert.equal(hostingProvider({ org: 'Mullvad VPN AB' }), 'Mullvad');
  assert.equal(hostingProvider({ org: 'Google LLC' }), 'Google LLC');
  assert.equal(hostingProvider({ org: 'Excitel Broadband Private Limited' }), null);
  assert.equal(hostingProvider({ org: 'Google Fiber Inc.' }), null);
  assert.equal(hostingProvider({ org: 'Cloudnet Haus Telecom' }), null);
  assert.equal(hostingProvider({}), null);
});

async function torCheck(t, { v4 = null, v6 = null, onionoo }) {
  clearPublicIPCache();
  t.after(clearPublicIPCache);
  routeFetch(t, {
    'https://api.ipify.org': () => (v4 ? json({ ip: v4 }) : json({}, 503)),
    'https://api6.ipify.org': () => (v6 ? json({ ip: v6 }) : Promise.reject(new TypeError('no IPv6 route'))),
    'https://onionoo.torproject.org/': (url) => onionoo(new URL(url).searchParams.get('search')),
  });
  const { isUsingTor } = await import(`../src/modules/privacy/tor.js?scenario=${encodeURIComponent(t.name)}`);
  return isUsingTor();
}

const relays = (list) => json({ relays: list });

test('Tor check without a public IP is an error, not a negative result', async (t) => {
  const result = await torCheck(t, { onionoo: () => relays([]) });
  assert.deepEqual(result, { isTor: false, ips: [], error: 'ip' });
});

test('failed relay lookup cannot rule out Tor', async (t) => {
  const result = await torCheck(t, { v4: '203.0.113.1', onionoo: () => json({}, 503) });
  assert.equal(result.isTor, false);
  assert.equal(result.error, 'lookup');
});

test('an exit address match detects Tor', async (t) => {
  const result = await torCheck(t, {
    v4: '203.0.113.1',
    onionoo: () => relays([{ or_addresses: ['198.51.100.7:9001'], exit_addresses: ['203.0.113.1'], flags: ['Exit', 'Running'] }]),
  });
  assert.equal(result.isTor, true);
  assert.equal(result.error, undefined);
});

test('Onionoo prefix matches do not count as Tor', async (t) => {
  // Searching 203.0.113.1 also returns relays at 203.0.113.10–19.
  const result = await torCheck(t, {
    v4: '203.0.113.1',
    onionoo: () => relays([{ or_addresses: ['203.0.113.17:443'], exit_addresses: ['203.0.113.17'], flags: ['Exit'] }]),
  });
  assert.deepEqual(result, { isTor: false, ips: ['203.0.113.1'] });
});

test('an IPv6 onion-routing address only counts for relays with the Exit flag', async (t) => {
  const ip = '2001:db8::25';
  const exit = await torCheck(t, { v6: ip, onionoo: () => relays([{ or_addresses: [`[${ip}]:443`], flags: ['Exit'] }]) });
  assert.equal(exit.isTor, true);
});

test('a non-exit relay at the same address is not a Tor exit', async (t) => {
  const result = await torCheck(t, {
    v4: '203.0.113.1',
    onionoo: () => relays([{ or_addresses: ['203.0.113.1:9001'], flags: ['Guard', 'Running'] }]),
  });
  assert.equal(result.isTor, false);
});

function fakePeerConnection(candidates) {
  return class {
    createDataChannel() {}
    async createOffer() { return {}; }
    async setLocalDescription() {
      queueMicrotask(() => {
        for (const c of candidates) this.onicecandidate({ candidate: { candidate: `candidate:1 1 udp 1 ${c.address} 5000 typ ${c.type}`, ...c } });
        this.onicecandidate({ candidate: null });
      });
    }
    close() {}
  };
}

async function webrtcProbe(t, { candidates, v4 = null, v6 = null }) {
  clearPublicIPCache();
  t.after(clearPublicIPCache);
  routeFetch(t, {
    'https://api.ipify.org': () => (v4 ? json({ ip: v4 }) : json({}, 503)),
    'https://api6.ipify.org': () => (v6 ? json({ ip: v6 }) : Promise.reject(new TypeError('no IPv6 route'))),
  });
  // Node has no WebRTC; install a fake that emits the given ICE candidates.
  globalThis.RTCPeerConnection = fakePeerConnection(candidates);
  t.after(() => delete globalThis.RTCPeerConnection);
  const { probeWebRTC, webrtcLeakStatus } = await import(`../src/modules/network/webrtc.js?scenario=${encodeURIComponent(t.name)}`);
  return webrtcLeakStatus(await probeWebRTC());
}

test('WebRTC public IP that differs from the HTTP IP is a leak', async (t) => {
  const status = await webrtcProbe(t, {
    v4: '198.51.100.9', // VPN exit seen over HTTP
    candidates: [{ address: 'f2c1.local', type: 'host' }, { address: '203.0.113.50', type: 'srflx' }],
  });
  assert.equal(status.leaking, true);
  assert.match(status.row.value, /203\.0\.113\.50/);
});

test('WebRTC on a dual-stack connection is compared per address family', async (t) => {
  // HTTP lookups return both families; the STUN result equals the IPv4 one.
  const status = await webrtcProbe(t, {
    v4: '203.0.113.50',
    v6: '2001:db8::1',
    candidates: [{ address: 'f2c1.local', type: 'host' }, { address: '203.0.113.50', type: 'srflx' }],
  });
  assert.equal(status.leaking, false);
  assert.equal(status.protected, true);
});

test('WebRTC IPv6 in brackets from another temporary address of the same /64 is not a leak', async (t) => {
  // Chrome brackets IPv6 candidates; privacy extensions give WebRTC and HTTP different suffixes.
  const status = await webrtcProbe(t, {
    v6: '2001:db8:1:2::1',
    candidates: [{ address: '[2001:DB8:1:2:a1b2:c3d4:e5f6:789]', type: 'srflx' }],
  });
  assert.equal(status.leaking, false);
});

test('WebRTC IPv6 from a different /64 than HTTP is a leak', async (t) => {
  const status = await webrtcProbe(t, {
    v6: '2001:db8:1:2::1',
    candidates: [{ address: '[2001:db8:9:9::1]', type: 'srflx' }],
  });
  assert.equal(status.leaking, true);
});

test('WebRTC exposing a raw local address is a leak', async (t) => {
  const status = await webrtcProbe(t, {
    v4: '203.0.113.50',
    candidates: [{ address: '192.168.1.20', type: 'host' }, { address: '203.0.113.50', type: 'srflx' }],
  });
  assert.equal(status.leaking, true);
  assert.match(status.row.value, /192\.168\.1\.20/);
});

test('privacy score: defaults are neutral, the total is capped, exposure subtracts', () => {
  assert.equal(calculatePrivacyScore({}).score, BASE_SCORE);
  const everything = { adBlocker: true, fingerprintProtection: true, webrtcProtected: true, gpcEnabled: true, vpnDetected: true, torDetected: true, privateBrowsing: true, brave: true };
  assert.equal(calculatePrivacyScore(everything).score, 100);
  const exposed = calculatePrivacyScore({ webrtcLeaking: true, webdriverDetected: true });
  assert.equal(exposed.score, BASE_SCORE - 25);
  assert.equal(exposed.grade, 'F (At Risk)');
});
