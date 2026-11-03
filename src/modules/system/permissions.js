/**
 * Permissions card: this site's permission state for each powerful feature.
 * "Prompt" is the default; "Denied" usually means the user blocked the feature browser-wide;
 * a name the browser rejects is itself a fingerprinting signal. Clipboard permissions are in
 * the clipboard card.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

const PERMISSIONS = [
  [{ name: 'geolocation' }, 'Geolocation_API'],
  [{ name: 'notifications' }, 'Notifications_API'],
  [{ name: 'camera' }, 'Media_Capture_and_Streams_API'],
  [{ name: 'microphone' }, 'Media_Capture_and_Streams_API'],
  [{ name: 'persistent-storage' }, 'Storage_API'],
  [{ name: 'midi' }, 'Web_MIDI_API'],
  [{ name: 'screen-wake-lock' }, 'Screen_Wake_Lock_API'],
  [{ name: 'window-management' }, 'Window_Management_API'],
  [{ name: 'local-fonts' }, 'Local_Font_Access_API'],
  [{ name: 'accelerometer' }, 'Sensor_APIs'],
  [{ name: 'gyroscope' }, 'Sensor_APIs'],
  [{ name: 'magnetometer' }, 'Sensor_APIs'],
  [{ name: 'background-sync' }, 'Background_Synchronization_API'],
  [{ name: 'push', userVisibleOnly: true }, 'Push_API'],
  [{ name: 'storage-access' }, 'Storage_Access_API'],
];

const titleCase = (name) => name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Granted only when the user said yes. Others (sensors, background sync, wake lock, storage
// access for a first-party page) are granted by default in Chromium and reveal nothing.
const USER_GRANTED = new Set(['geolocation', 'notifications', 'camera', 'microphone', 'midi', 'window-management', 'local-fonts', 'persistent-storage', 'push']);

export async function collectPermissionsData() {
  if (!navigator.permissions?.query) {
    return { 'Permissions API': { value: 'Not Supported', url: `${MDN}Permissions_API` } };
  }

  const results = await Promise.all(PERMISSIONS.map(async ([descriptor, page]) => {
    try {
      const { state } = await navigator.permissions.query(descriptor);
      const warning = state === 'granted' && USER_GRANTED.has(descriptor.name);
      return [descriptor.name, { value: titleCase(state), warning, url: `${MDN}${page}` }];
    } catch {
      return [descriptor.name, { value: 'Unsupported Name', url: `${MDN}${page}` }];
    }
  }));

  return Object.fromEntries(results.map(([name, row]) => [titleCase(name), row]));
}
