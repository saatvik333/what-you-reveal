/**
 * Media devices card: how many cameras, microphones and outputs any page can count without
 * permission (labels stay hidden until a capture permission is granted).
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';
// Firefox defers enumerateDevices() until the tab has focus; don't spin forever in a background tab.
const ENUMERATE_TIMEOUT_MS = 5000;

export async function collectMediaDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { 'Media Devices API': { value: 'Not Supported', url: `${MDN}MediaDevices` } };
  }

  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), ENUMERATE_TIMEOUT_MS); });
  let devices;
  try {
    devices = await Promise.race([navigator.mediaDevices.enumerateDevices(), timeout]);
  } catch {
    return { 'Media Devices API': { value: 'Blocked', url: `${MDN}MediaDevices/enumerateDevices` } };
  } finally {
    clearTimeout(timer);
  }
  if (devices === null) {
    return { 'Media Devices API': { value: 'Deferred by browser (tab not focused)', url: `${MDN}MediaDevices/enumerateDevices` } };
  }

  const count = (kind) => devices.filter((d) => d.kind === kind).length;
  const labels = devices.filter((d) => d.label).map((d) => `${d.kind}: ${d.label}`);
  const kindUrl = `${MDN}MediaDeviceInfo/kind`;

  return {
    'Microphones': { value: count('audioinput'), url: kindUrl },
    'Cameras': { value: count('videoinput'), url: kindUrl },
    'Audio Outputs': { value: count('audiooutput'), url: kindUrl },
    'Device Labels': labels.length > 0
      ? { value: labels.join('; '), warning: true, url: `${MDN}MediaDeviceInfo/label` }
      : { value: 'Hidden (no capture permission granted)', url: `${MDN}MediaDeviceInfo/label` },
  };
}
