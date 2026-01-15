/**
 * Permissions detection module
 * Checks status of various browser permissions
 */

/**
 * Collects permission states
 * @returns {Promise<Object>} Permissions data object
 */
export async function collectPermissionsData() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return { 'Permissions API': 'Not Supported / Blocked' };
  }

  const permNames = [
    'geolocation',
    'notifications',
    'camera',
    'microphone',
    'clipboard-read',
    'clipboard-write',
    'persistent-storage',
    'midi',
  ];

  const permData = {};

  // We use a promise.allSettled to ensure one slow/hanging permission doesn't block all
  const promises = permNames.map(async (name) => {
    try {
      // Firefox and others might require specific descriptors
      // or throw on unsupported permissions
      const descriptor = { name };

      // Adjust descriptor for specific permissions if needed
      if (name === 'camera' || name === 'microphone') {
        // Some browsers might need { name: 'camera' } directly,
        // others might fail without more specific query.
        // Standard allows { name: 'camera' }.
      }

      const result = await navigator.permissions.query(descriptor);
      return { name, state: result.state };
    } catch (e) {
      return { name, state: 'Unsupported/Protected' };
    }
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      permData[result.value.name] = result.value.state;
    }
  });

  return permData;
}
