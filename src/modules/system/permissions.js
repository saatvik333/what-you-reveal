/**
 * Permissions detection module
 * Checks status of various browser permissions
 */

/**
 * Collects permission states
 * @returns {Promise<Object>} Permissions data object
 */
export async function collectPermissionsData() {
  const permUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API';

  if (!navigator.permissions || !navigator.permissions.query) {
    return { 'Permissions API': { value: 'Not Supported / Blocked', url: permUrl } };
  }

  const permissionsList = [
    { name: 'geolocation', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API' },
    { name: 'notifications', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API' },
    { name: 'camera', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API' },
    { name: 'microphone', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API' },
    { name: 'clipboard-read', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API' },
    { name: 'clipboard-write', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API' },
    { name: 'persistent-storage', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Storage_API' },
    { name: 'midi', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API' },
    { name: 'screen-wake-lock', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API' },
    { name: 'window-management', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API' },
    { name: 'accelerometer', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs' },
    { name: 'gyroscope', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs' },
    { name: 'magnetometer', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs' },
    { name: 'ambient-light-sensor', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs' },
    { name: 'background-sync', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API' },
    { name: 'background-fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API' },
    { name: 'push', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API' },
  ];

  const permData = {};

  // We use a promise.allSettled to ensure one slow/hanging permission doesn't block all
  const promises = permissionsList.map(async (perm) => {
    try {
      // Firefox and others might require specific descriptors
      // or throw on unsupported permissions
      const descriptor = { name: perm.name };

      // Adjust descriptor for specific permissions if needed
      if (perm.name === 'camera') {
          // 'camera' is not standardized in Chrome yet, uses 'video_capture' internally or similar? 
          // Actually standard says 'camera', but Chrome often requires { name: 'camera' }
          // Some implementations might strict check
      }
      
      // Some permissions require extra properties
      if (perm.name === 'push') {
          descriptor.userVisibleOnly = true;
      }
      if (perm.name === 'midi') {
          descriptor.sysex = true; // Check for powerful midi if possible, or just basic
      }

      const result = await navigator.permissions.query(descriptor);
      
      // Format the state string (capitalize first letter)
      const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
      
      return { 
          name: perm.name, 
          state: state,
          url: perm.url
      };
    } catch (e) {
      // If prompt fails, it likely means not supported or requires different descriptor
      // Just mark as unsupported or skip
      return { 
          name: perm.name, 
          state: 'Unsupported/Protected',
          url: perm.url,
          warning: true 
      };
    }
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { name, state, url, warning } = result.value;
      // Format key name to be title case and readable
      const key = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      permData[key] = {
          value: state,
          url: url,
          warning: warning || state === 'Denied' // Highlight denied permissions as warning if significant
      };
    }
  });

  return permData;
}
