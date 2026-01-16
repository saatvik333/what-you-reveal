/**
 * Media Devices Enumeration Module
 * Counts input/output devices without requesting access (unless granted)
 */

export async function collectMediaDevices() {
  const mediaDevicesUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices';

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { 'Media Devices API': { value: 'Not Supported', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices' } };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const counts = {
      audioinput: 0,
      audiooutput: 0,
      videoinput: 0,
      other: 0,
    };

    const labels = [];

    devices.forEach((d) => {
      if (counts[d.kind] !== undefined) {
        counts[d.kind]++;
      } else {
        counts['other']++;
      }
      // Label is often empty if permission is not granted
      if (d.label) {
        labels.push(`${d.kind}: ${d.label}`);
      }
    });

    const data = {
      Microphones: { 
          value: counts['audioinput'], 
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/kind' 
      },
      'Speakers/Headphones': { 
          value: counts['audiooutput'], 
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/kind' 
      },
      Cameras: { 
          value: counts['videoinput'], 
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/kind' 
      },
      'Total Devices': {
          value: devices.length,
          url: mediaDevicesUrl
      },
    };

    // If we have labels (permission granted), show them
    if (labels.length > 0) {
      data['Device Labels'] = { value: labels.join('\n'), warning: false, url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/label' };
    } else {
      data['Device Labels'] = { value: 'Hidden (Permission required)', warning: true, url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/label' };
    }

    return data;
  } catch (e) {
    return { Error: { value: 'Failed to enumerate devices', warning: true } };
  }
}
