/**
 * Cryptographic and Hashing Utilities
 */

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

/**
 * SHA-256 hash using Web Crypto API (hardware-accelerated)
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function sha256(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback to cyrb53 if Web Crypto unavailable
    return cyrb53(str).toString(16);
  }
}

/**
 * Generates a fingerprint of Math.random() behavior
 * Detects seeded/deterministic RNG (anti-fingerprinting measures)
 * @returns {string} Math.random fingerprint
 */
export function mathRandomFingerprint() {
  // Generate a sequence and detect patterns
  const samples = [];
  for (let i = 0; i < 10; i++) {
    samples.push(Math.random());
  }
  
  // Check for suspicious patterns (deterministic sequences)
  const isMonotonic = samples.every((v, i) => i === 0 || v > samples[i-1]) ||
                      samples.every((v, i) => i === 0 || v < samples[i-1]);
  
  // Hash the sequence to create a fingerprint
  const seqStr = samples.map(n => n.toString().slice(2, 10)).join('');
  
  return {
    hash: cyrb53(seqStr).toString(16),
    suspicious: isMonotonic,
    entropy: samples.reduce((acc, v) => acc + v, 0) / samples.length,
  };
}
