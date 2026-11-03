/**
 * Hashing helpers for fingerprint values.
 */

/**
 * Hex SHA-256 via Web Crypto. `crypto.subtle` exists only in secure contexts (HTTPS, localhost);
 * elsewhere this falls back to the non-cryptographic cyrb53, which is enough for display.
 * @param {string} str
 * @returns {Promise<string>}
 */
export async function sha256(str) {
  if (!globalThis.crypto?.subtle) return cyrb53(str).toString(16).padStart(14, '0');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * cyrb53: fast 53-bit non-cryptographic string hash.
 * @param {string} str
 * @param {number} seed
 * @returns {number}
 */
export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
