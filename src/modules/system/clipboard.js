/**
 * Clipboard access / permission module
 */

/**
 * Checks if the browser allows clipboard access without interaction
 * @returns {Promise<Object>} Clipboard capabilities
 */
export async function collectClipboardData() {
  const clipData = {};

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const readPerm = await navigator.permissions.query({ name: 'clipboard-read' });
      const writePerm = await navigator.permissions.query({ name: 'clipboard-write' });

      clipData['Read Permission'] = formatPermission(readPerm.state);
      clipData['Write Permission'] = formatPermission(writePerm.state);
    } catch (e) {
      clipData['Permissions API'] = 'Not Supported / Error';
    }
  } else {
    clipData['Permissions API'] = 'Not Supported';
  }

  // Check if Clipboard API exists
  if (!navigator.clipboard) {
    clipData['Clipboard API'] = 'Missing (Secure Context Required?)';
  } else {
    clipData['Clipboard API'] = 'Available';
  }

  return clipData;
}

function formatPermission(state) {
  if (state === 'granted') {
    return { value: 'GRANTED', warning: true }; // Dangerous!
  } else if (state === 'prompt') {
    return 'Prompt (Safe)';
  } else if (state === 'denied') {
    return 'Denied (Safe)';
  }
  return state;
}
