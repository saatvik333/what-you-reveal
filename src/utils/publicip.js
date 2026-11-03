/**
 * Public IP lookup through ipify, split by address family.
 *
 * api.ipify.org answers over IPv4 only and api6.ipify.org over IPv6 only, so each result is
 * the address this browser uses for that family. Keeping the families apart matters when
 * comparing against WebRTC candidates or the Tor relay list: a dual-stack connection has
 * two public addresses and either may be the one a given server sees.
 */

async function lookup(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const { ip } = await response.json();
    return typeof ip === 'string' && ip.trim() ? ip.trim() : null;
  } catch {
    return null;
  }
}

let publicIPsPromise = null;

/** @returns {Promise<{ v4: string|null, v6: string|null }>} shared for the page load */
export function fetchPublicIPs() {
  if (publicIPsPromise) return publicIPsPromise;
  const request = Promise.all([
    lookup('https://api.ipify.org?format=json'),
    lookup('https://api6.ipify.org?format=json'),
  ]).then(([v4, v6]) => {
    // Nothing learned: let the next caller retry instead of caching the failure.
    if (!v4 && !v6 && publicIPsPromise === request) publicIPsPromise = null;
    return { v4, v6 };
  });
  publicIPsPromise = request;
  return request;
}

export function clearPublicIPCache() {
  publicIPsPromise = null;
}
