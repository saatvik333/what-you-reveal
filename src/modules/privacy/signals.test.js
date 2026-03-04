import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert';
import { detectVPNProxy } from './signals.js';

describe('detectVPNProxy', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('returns fallback object when fetch rejects', async () => {
    // Mock global fetch to reject
    mock.method(globalThis, 'fetch', () => Promise.reject(new Error('Network error')));

    const result = await detectVPNProxy();

    assert.deepStrictEqual(result, { isVPN: false, error: true });
  });
});
