/**
 * Media Devices Enumeration Module
 * Counts input/output devices without requesting access (unless granted)
 */

export async function collectMediaDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { 'Media Devices API': 'Not Supported' };
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
      Microphones: counts['audioinput'],
      'Speakers/Headphones': counts['audiooutput'],
      Cameras: counts['videoinput'],
      'Total Devices': devices.length,
    };

    // If we have labels (permission granted), show them
    if (labels.length > 0) {
      data['Device Labels'] = { value: labels.join('\n'), warning: false };
    } else {
      data['Device Labels'] = 'Hidden (Permission required)';
    }

    return data;
  } catch (e) {
    return { Error: 'Failed to enumerate devices' };
  }
}
