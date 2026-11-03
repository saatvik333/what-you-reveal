/**
 * Navigator card: the User-Agent string and which web platform APIs this browser exposes.
 * The set of supported APIs alone narrows down browser, version and platform.
 * Language, privacy signals and device data live in their own cards.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

const FEATURES = [
  ['Service Worker', () => 'serviceWorker' in navigator, 'Service_Worker_API'],
  ['Push API', () => 'PushManager' in window, 'Push_API'],
  ['Storage Manager', () => 'storage' in navigator, 'StorageManager'],
  ['File System Access', () => 'showOpenFilePicker' in window, 'File_System_API'],
  ['Web Bluetooth', () => 'bluetooth' in navigator, 'Web_Bluetooth_API'],
  ['WebUSB', () => 'usb' in navigator, 'WebUSB_API'],
  ['WebHID', () => 'hid' in navigator, 'WebHID_API'],
  ['Web Serial', () => 'serial' in navigator, 'Web_Serial_API'],
  ['Web MIDI', () => 'requestMIDIAccess' in navigator, 'Web_MIDI_API'],
  ['Gamepad', () => 'getGamepads' in navigator, 'Gamepad_API'],
  ['WebAuthn (Passkeys)', () => 'PublicKeyCredential' in window, 'Web_Authentication_API'],
  ['Credential Management', () => 'credentials' in navigator, 'Credential_Management_API'],
  ['Web Share', () => 'share' in navigator, 'Web_Share_API'],
  ['Clipboard', () => 'clipboard' in navigator, 'Clipboard_API'],
  ['Virtual Keyboard', () => 'virtualKeyboard' in navigator, 'VirtualKeyboard_API'],
  ['WebXR', () => 'xr' in navigator, 'WebXR_Device_API'],
  ['WebGPU', () => 'gpu' in navigator, 'WebGPU_API'],
  ['WebCodecs', () => 'VideoDecoder' in window, 'WebCodecs_API'],
  ['Media Session', () => 'mediaSession' in navigator, 'Media_Session_API'],
  ['Picture-in-Picture', () => 'pictureInPictureEnabled' in document, 'Picture-in-Picture_API'],
  ['Presentation', () => 'presentation' in navigator, 'Presentation_API'],
  ['Screen Wake Lock', () => 'wakeLock' in navigator, 'Screen_Wake_Lock_API'],
  ['Vibration', () => 'vibrate' in navigator, 'Vibration_API'],
  ['Device Orientation', () => 'DeviceOrientationEvent' in window, 'Device_orientation_events'],
  ['Generic Sensors', () => 'Accelerometer' in window, 'Sensor_APIs'],
  ['Compute Pressure', () => 'PressureObserver' in window, 'Compute_Pressure_API'],
  ['Shared Storage', () => 'sharedStorage' in window, 'Shared_Storage_API'],
  ['Topics (ad interests)', () => 'browsingTopics' in document, 'Topics_API'],
];

export async function collectNavigatorData() {
  const data = {
    'User Agent': { value: navigator.userAgent, url: `${MDN}Navigator/userAgent` },
    'Platform (Legacy)': { value: navigator.platform || 'Empty', url: `${MDN}Navigator/platform` },
    'Vendor': { value: navigator.vendor || 'Empty', url: `${MDN}Navigator/vendor` },
    'PDF Viewer': {
      value: navigator.pdfViewerEnabled === undefined ? 'Unknown' : navigator.pdfViewerEnabled ? 'Built-in' : 'None',
      url: `${MDN}Navigator/pdfViewerEnabled`,
    },
  };

  const results = FEATURES.map(([name, test, page]) => {
    let supported = false;
    try {
      supported = Boolean(test());
    } catch {}
    return [name, supported, page];
  });
  data['APIs Exposed'] = { value: `${results.filter(([, ok]) => ok).length} of ${FEATURES.length} tested` };
  for (const [name, ok, page] of results) {
    data[name] = { value: ok ? 'Supported' : 'Not Supported', url: `${MDN}${page}` };
  }
  return data;
}
