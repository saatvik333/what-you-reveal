import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sha256, cyrb53 } from './crypto.js';

describe('Crypto Utilities', () => {
  describe('sha256', () => {
    test('should calculate correct hash using Web Crypto', async () => {
      const hash = await sha256('test');
      assert.strictEqual(hash, '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });

    test('should fall back to simpleHash when Web Crypto is unavailable', async () => {
      // Mock global crypto to throw error
      const originalSubtle = globalThis.crypto.subtle;
      const originalConsoleWarn = console.warn;
      let consoleWarnCalled = false;

      try {
        // Redefine the digest property
        Object.defineProperty(globalThis.crypto, 'subtle', {
          value: {
            digest: () => { throw new Error('Web Crypto API disabled'); }
          },
          configurable: true,
          writable: true
        });

        console.warn = (msg) => {
          if (msg === 'Web Crypto API not available, falling back to simple hash') {
            consoleWarnCalled = true;
          }
        };

        const hash = await sha256('test');

        // Output from djb2 for 'test':
        assert.ok(typeof hash === 'string');
        assert.ok(hash.length > 0);
        assert.notStrictEqual(hash, '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
        assert.strictEqual(hash, '7c9e6865'); // simpleHash (djb2) calculation for 'test'
        assert.ok(consoleWarnCalled, 'console.warn should be called');
      } finally {
        Object.defineProperty(globalThis.crypto, 'subtle', {
          value: originalSubtle,
          configurable: true,
          writable: true
        });
        console.warn = originalConsoleWarn;
      }
    });

    test('should fall back to simpleHash when globalThis.crypto is undefined', async () => {
      const originalCrypto = globalThis.crypto;
      const originalConsoleWarn = console.warn;
      let consoleWarnCalled = false;

      try {
        // Remove crypto entirely
        Object.defineProperty(globalThis, 'crypto', {
          value: undefined,
          configurable: true,
          writable: true
        });

        console.warn = (msg) => {
          if (msg === 'Web Crypto API not available, falling back to simple hash') {
            consoleWarnCalled = true;
          }
        };

        const hash = await sha256('test');

        assert.strictEqual(hash, '7c9e6865'); // simpleHash (djb2) calculation for 'test'
        assert.ok(consoleWarnCalled, 'console.warn should be called');
      } finally {
        Object.defineProperty(globalThis, 'crypto', {
          value: originalCrypto,
          configurable: true,
          writable: true
        });
        console.warn = originalConsoleWarn;
      }
    });
  });

  describe('cyrb53', () => {
    test('should calculate consistent hash', () => {
      const hash1 = cyrb53('test');
      const hash2 = cyrb53('test');
      assert.strictEqual(hash1, hash2);
    });

    test('should calculate different hashes for different seeds', () => {
      const hash1 = cyrb53('test', 0);
      const hash2 = cyrb53('test', 1);
      assert.notStrictEqual(hash1, hash2);
    });
  });
});
