import test from 'node:test';
import assert from 'node:assert';
import { sha256 } from './crypto.js';

test('sha256 success path', async () => {
  const input = 'hello world';
  const expectedHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

  const result = await sha256(input);
  assert.strictEqual(result, expectedHash, 'Should return correct SHA-256 hash');
});

test('sha256 success path with empty string', async () => {
  const input = '';
  // Empty string SHA-256
  const expectedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const result = await sha256(input);
  assert.strictEqual(result, expectedHash, 'Should return correct SHA-256 hash for empty string');
});

test('sha256 fallback path (Web Crypto API error)', async () => {
  const input = 'hello world';
  // simpleHash('hello world') expected result
  const expectedFallbackHash = '3551c8c1';

  const originalDigest = globalThis.crypto.subtle.digest;
  const originalWarn = console.warn;
  let warnCalled = false;

  try {
    console.warn = () => { warnCalled = true; };
    globalThis.crypto.subtle.digest = async () => { throw new Error('Simulated Web Crypto error'); };

    const result = await sha256(input);

    assert.strictEqual(result, expectedFallbackHash, 'Should return simpleHash result on error');
    assert.strictEqual(warnCalled, true, 'console.warn should have been called');
  } finally {
    globalThis.crypto.subtle.digest = originalDigest;
    console.warn = originalWarn;
  }
});

test('sha256 fallback path with empty string', async () => {
  const originalDigest = globalThis.crypto.subtle.digest;
  const originalWarn = console.warn;
  try {
    console.warn = () => {};
    globalThis.crypto.subtle.digest = async () => { throw new Error('Simulated Web Crypto error'); };

    const result = await sha256('');
    // simpleHash('') = 5381 (hex: 1505)
    assert.strictEqual(result, (5381).toString(16), 'Should return correct simpleHash for empty string');
  } finally {
    globalThis.crypto.subtle.digest = originalDigest;
    console.warn = originalWarn;
  }
});
