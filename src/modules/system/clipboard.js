/**
 * Clipboard card: whether a page could read or write the clipboard without asking.
 * Writing after a user gesture is allowed by default in every browser; silent reading is the risk.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

async function permissionState(name) {
  try {
    return (await navigator.permissions.query({ name })).state;
  } catch {
    return null; // Firefox and Safari do not expose clipboard permission names.
  }
}

export async function collectClipboardData() {
  const data = {
    'Clipboard API': {
      value: navigator.clipboard ? 'Available' : 'Unavailable (needs HTTPS)',
      url: `${MDN}Clipboard_API`,
    },
    'Async Read': {
      value: typeof navigator.clipboard?.read === 'function' ? 'Supported' : 'Not Supported',
      url: `${MDN}Clipboard/read`,
    },
  };

  if (!navigator.permissions?.query) return data;
  const [read, write] = await Promise.all([permissionState('clipboard-read'), permissionState('clipboard-write')]);

  data['Read Permission'] = read === null
    ? { value: 'Per-use prompt (no permission state)', url: `${MDN}Clipboard/read` }
    : {
      value: { granted: 'Granted (pages can read silently)', prompt: 'Prompt', denied: 'Denied' }[read] ?? read,
      warning: read === 'granted',
      url: `${MDN}Clipboard/read`,
    };
  data['Write Permission'] = write === null
    ? { value: 'Gesture-gated (no permission state)', url: `${MDN}Clipboard/write` }
    : { value: { granted: 'Granted (default)', prompt: 'Prompt', denied: 'Denied' }[write] ?? write, url: `${MDN}Clipboard/write` };
  return data;
}
