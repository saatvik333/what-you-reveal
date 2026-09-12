import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchCachedGeoIP, clearGeoIPCache } from '../src/utils/geoip.js';

test('an obsolete failed GeoIP request does not evict a newer cached request', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  let rejectOld;
  let requests = 0;
  t.mock.method(globalThis, 'fetch', () => {
    requests++;
    if (requests === 1) return new Promise((_, reject) => { rejectOld = reject; });
    return Promise.resolve({ ok: true, json: async () => ({ ip: '203.0.113.1' }) });
  });
  const old = fetchCachedGeoIP();
  const failure = assert.rejects(old, /offline/);
  clearGeoIPCache();
  await fetchCachedGeoIP();
  rejectOld(new Error('offline'));
  await failure;
  await fetchCachedGeoIP();
  assert.equal(requests, 2);
});

test('GeoIP shares concurrent lookups and retries after failure', async (t) => {
  clearGeoIPCache();
  t.after(clearGeoIPCache);
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    if (requests === 1) return { ok: false, status: 429 };
    return { ok: true, json: async () => ({ ip: '203.0.113.1' }) };
  });
  const first = fetchCachedGeoIP();
  const second = fetchCachedGeoIP();
  await Promise.all([assert.rejects(first, /429/), assert.rejects(second, /429/)]);
  assert.equal(requests, 1);
  assert.deepEqual(await fetchCachedGeoIP(), { ip: '203.0.113.1' });
  await fetchCachedGeoIP();
  assert.equal(requests, 2);
});

async function torScenario(t, { ipResponse, listResponse }) {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('ipify')) return ipResponse;
    return listResponse;
  });
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem: () => {} },
  });
  t.after(() => {
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else delete globalThis.localStorage;
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  const { isUsingTor } = await import(`../src/modules/privacy/tor.js?scenario=${t.name}`);
  return isUsingTor();
}

test('failed Tor exit-list lookup is an error, not a negative detection', async (t) => {
  const result = await torScenario(t, {
    ipResponse: { ok: true, json: async () => ({ ip: '203.0.113.1' }) },
    listResponse: { ok: false, status: 503 },
  });
  assert.equal(result.error, true);
  assert.equal(result.ip, '203.0.113.1');
});

test('unsuccessful IP lookup cannot produce a successful Tor check', async (t) => {
  const result = await torScenario(t, {
    ipResponse: { ok: false, status: 503, json: async () => ({}) },
    listResponse: { ok: true, text: async () => '203.0.113.1\n' },
  });
  assert.equal(result.error, true);
  assert.equal(result.ip, 'unknown');
});

test('a successful HTTP response without an IP is still a failed lookup', async (t) => {
  const result = await torScenario(t, {
    ipResponse: { ok: true, json: async () => ({}) },
    listResponse: { ok: true, text: async () => '203.0.113.1\n' },
  });
  assert.equal(result.error, true);
  assert.equal(result.ip, 'unknown');
});

test('an empty Tor exit list cannot rule out Tor usage', async (t) => {
  const result = await torScenario(t, {
    ipResponse: { ok: true, json: async () => ({ ip: '203.0.113.1' }) },
    listResponse: { ok: true, text: async () => '' },
  });
  assert.equal(result.error, true);
});

for (const [name, ip, expected] of [
  ['Tor exit node', '203.0.113.1', true],
  ['non-Tor address', '203.0.113.2', false],
]) {
  test(`successful lookup detects ${name}`, async (t) => {
    const result = await torScenario(t, {
      ipResponse: { ok: true, json: async () => ({ ip }) },
      listResponse: { ok: true, text: async () => '203.0.113.1\n' },
    });
    assert.equal(result.isTor, expected);
    assert.equal(result.nodeCount, 1);
    assert.ok(!result.error);
  });
}
