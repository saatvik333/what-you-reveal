/**
 * Tor exit detection through the Tor Project's Onionoo API.
 *
 * Onionoo answers with CORS headers and searches every address a relay used for onion
 * routing or for exiting in the past 24 hours, IPv4 and IPv6, so one small request per public
 * address replaces downloading the bulk exit list through a third-party CORS proxy.
 * Searches match address prefixes, so results are confirmed by exact address.
 */

import { fetchPublicIPs } from '../../utils/publicip.js';

const ONIONOO_URL = 'https://onionoo.torproject.org/details';

function stripPort(orAddress) {
  // "1.2.3.4:9001" or "[2001:db8::1]:9001"
  const host = orAddress.slice(0, orAddress.lastIndexOf(':'));
  return host.startsWith('[') ? host.slice(1, -1) : host;
}

async function isExitAddress(ip) {
  const query = new URLSearchParams({ search: ip, running: 'true', fields: 'exit_addresses,or_addresses,flags' });
  const response = await fetch(`${ONIONOO_URL}?${query}`);
  if (!response.ok) throw new Error(`Onionoo HTTP ${response.status}`);
  const { relays } = await response.json();
  if (!Array.isArray(relays)) throw new Error('Onionoo returned no relay list');
  const target = ip.toLowerCase();
  return relays.some((relay) =>
    (relay.exit_addresses ?? []).some((a) => a.toLowerCase() === target) ||
    ((relay.flags ?? []).includes('Exit') && (relay.or_addresses ?? []).some((a) => stripPort(a).toLowerCase() === target)),
  );
}

/**
 * @returns {Promise<{ isTor: boolean, ips: string[], error?: 'ip' | 'lookup' }>}
 * `error` means the result cannot rule Tor out: no public IP was found, or Onionoo failed.
 */
export async function isUsingTor() {
  const { v4, v6 } = await fetchPublicIPs();
  const ips = [v4, v6].filter(Boolean);
  if (ips.length === 0) return { isTor: false, ips, error: 'ip' };

  const results = await Promise.allSettled(ips.map(isExitAddress));
  if (results.some((r) => r.status === 'fulfilled' && r.value)) return { isTor: true, ips };
  if (results.some((r) => r.status === 'rejected')) return { isTor: false, ips, error: 'lookup' };
  return { isTor: false, ips };
}
