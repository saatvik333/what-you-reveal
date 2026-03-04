import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { sha256, cyrb53 } from './crypto.js';

describe('Cryptographic Utilities', () => {
  describe('sha256', () => {
    let originalWarn;
    let originalCrypto;

    beforeEach(() => {
      originalWarn = console.warn;
      originalCrypto = globalThis.crypto;
    });

    afterEach(() => {
      console.warn = originalWarn;
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should generate correct SHA-256 hash using Web Crypto API', async () => {
      const result = await sha256('test');
      assert.strictEqual(result, '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });

    it('should fallback to simpleHash when Web Crypto API fails', async () => {
      let warningLogged = false;
      console.warn = (msg) => {
        if (msg === 'Web Crypto API not available, falling back to simple hash') {
          warningLogged = true;
        }
      };

      // Force failure by removing subtle from crypto
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          subtle: undefined
        },
        writable: true,
        configurable: true
      });

      const result = await sha256('test');

      // Expected result from simpleHash('test')
      assert.ok(warningLogged, 'Expected fallback warning to be logged');
      assert.strictEqual(result, '7c9e6865');
    });

    it('should handle empty string correctly', async () => {
      const result = await sha256('');
      assert.strictEqual(result, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('cyrb53', () => {
    it('should generate consistent hash for the same string', () => {
      const hash1 = cyrb53('hello world');
      const hash2 = cyrb53('hello world');
      assert.strictEqual(hash1, hash2);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = cyrb53('hello world');
      const hash2 = cyrb53('hello worle');
      assert.notStrictEqual(hash1, hash2);
    });

    it('should handle custom seed', () => {
      const hashDefaultSeed = cyrb53('hello world'); // seed = 0
      const hashCustomSeed = cyrb53('hello world', 12345);

      assert.notStrictEqual(hashDefaultSeed, hashCustomSeed);
      assert.strictEqual(cyrb53('hello world', 12345), hashCustomSeed); // Deterministic with seed
    });

    it('should handle empty string', () => {
      const hash1 = cyrb53('');
      const hash2 = cyrb53('');
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(typeof hash1, 'number');
    });
  });
});
