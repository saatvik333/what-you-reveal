/**
 * Clipboard access / permission module
 */

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

      clipData['Read Permission'] = { 
        value: formatPermission(readPerm.state), 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read'
      };
      
      // Handle the object returned by formatPermission if needed (it returns string or object)
      // Actually formatPermission returns object for 'granted', string for others. 
      // We need to normalize this.
      const readVal = formatPermission(readPerm.state);
      clipData['Read Permission'] = typeof readVal === 'object' 
        ? { ...readVal, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read' }
        : { value: readVal, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read' };

      const writeVal = formatPermission(writePerm.state);
      clipData['Write Permission'] = typeof writeVal === 'object'
        ? { ...writeVal, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write' }
        : { value: writeVal, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write' };
        
    } catch (e) {
      clipData['Permissions API'] = { 
        value: 'Not Supported / Error',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
      };
    }
  } else {
    clipData['Permissions API'] = {
      value: 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API'
    };
  }

  // Check if Clipboard API exists
  if (!navigator.clipboard) {
    clipData['Clipboard API'] = { 
      value: 'Missing (Secure Context Required?)', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API' 
    };
  } else {
    clipData['Clipboard API'] = { 
      value: 'Available', 
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API' 
    };
  }

  return clipData;
}
