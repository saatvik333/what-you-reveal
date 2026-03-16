import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { collectClipboardData } from './clipboard.js';

describe('Clipboard Module', () => {
  let originalNavigator;

  beforeEach(() => {
    // Keep reference to the real one (if it exists)
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore the property
    if (originalNavigator === undefined) {
      delete global.navigator;
    } else {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
  });

  it('should return "Not Supported" when navigator.permissions is missing', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Permissions API'], {
      value: 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    });
  });

  it('should return "Not Supported" when navigator.permissions.query is missing', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        permissions: {} // no query
      },
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Permissions API'], {
      value: 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    });
  });

  it('should return "Not Supported / Error" when navigator.permissions.query throws an error', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        permissions: {
          query: async () => {
            throw new Error('Test error');
          }
        }
      },
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Permissions API'], {
      value: 'Not Supported / Error',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    });
  });

  it('should process permissions when navigator.permissions.query succeeds', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        permissions: {
          query: async ({ name }) => {
            if (name === 'clipboard-read') {
              return { state: 'prompt' };
            }
            if (name === 'clipboard-write') {
              return { state: 'granted' };
            }
            return { state: 'denied' };
          }
        }
      },
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Read Permission'], {
      value: 'Prompt (Safe)',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read'
    });

    assert.deepStrictEqual(result['Write Permission'], {
      value: 'GRANTED',
      warning: true,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write'
    });

    assert.strictEqual(result['Permissions API'], undefined);
  });

  it('should handle missing Clipboard API', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Clipboard API'], {
      value: 'Missing (Secure Context Required?)',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
    });
  });

  it('should handle available Clipboard API', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {}
      },
      configurable: true,
      enumerable: true,
      writable: true,
    });

    const result = await collectClipboardData();

    assert.deepStrictEqual(result['Clipboard API'], {
      value: 'Available',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
    });
  });
});
