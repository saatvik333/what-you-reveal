import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { collectClipboardData } from './clipboard.js';

describe('Clipboard Module', () => {
  let originalNavigator;

  beforeEach(() => {
    // Save original to restore later
    originalNavigator = global.navigator;
    // We cannot set global.navigator directly if it's a getter, so we use Object.defineProperty
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true
      });
    } else {
      delete global.navigator;
    }
  });

  it('handles missing permissions API', async () => {
    const data = await collectClipboardData();
    assert.deepStrictEqual(data['Permissions API'], {
      value: 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    });
  });

  it('handles permissions query rejection (catch block)', async () => {
    global.navigator.permissions = {
      query: () => Promise.reject(new Error('Mocked error'))
    };

    const data = await collectClipboardData();
    assert.deepStrictEqual(data['Permissions API'], {
      value: 'Not Supported / Error',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    });
  });

  it('handles granted permissions successfully', async () => {
    global.navigator.permissions = {
      query: async ({ name }) => {
        if (name === 'clipboard-read') return { state: 'granted' };
        if (name === 'clipboard-write') return { state: 'prompt' };
        return { state: 'denied' };
      }
    };
    global.navigator.clipboard = {}; // available

    const data = await collectClipboardData();
    assert.deepStrictEqual(data['Read Permission'], {
      value: 'GRANTED',
      warning: true,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read'
    });
    assert.deepStrictEqual(data['Write Permission'], {
      value: 'Prompt (Safe)',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write'
    });
    assert.deepStrictEqual(data['Clipboard API'], {
      value: 'Available',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
    });
  });
});
