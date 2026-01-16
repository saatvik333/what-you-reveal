/**
 * Cryptographic Utilities
 * Standardized SHA-256 hashing using Web Crypto API
 */

/**
 * Generates a SHA-256 hash of the input string
 * @param {string} str - Input string
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function sha256(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Web Crypto API not available, falling back to simple hash');
    return simpleHash(str);
  }
}

/**
 * Simple fallback hash (djb2 implementation) if Web Crypto is blocked
 * @param {string} str 
 * @returns {string} Hex-like string
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  return (hash >>> 0).toString(16);
}

/**
 * Simple mixing hash function (cyrb53) - fast, non-cryptographic
 * @param {string} str - String to hash
 * @param {number} seed - Optional seed
 * @returns {number} Hash value
 */
export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
